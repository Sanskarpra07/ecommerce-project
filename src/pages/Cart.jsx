import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './Cart.css';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const shipping = totalPrice > 100 || totalPrice === 0 ? 0 : 10;
  const grandTotal = totalPrice + shipping;

  const handleCheckout = async () => {
    if (!user) {
      if (window.confirm('You are checking out as guest. Would you like to log in first?')) {
        navigate('/login', { state: { from: '/cart' } });
        return;
      }
    }

    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const response = await api.post('/orders.php', {
        user_id: user ? user.id : 1,
        items: orderItems,
      });

      setOrderSuccess(response.data);
      clearCart();
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="cart-page">
        <div className="order-success">
          <div className="success-icon">&#10004;</div>
          <h2>Thank You for Your Order!</h2>
          <p className="success-sub">Your order has been placed successfully.</p>
          <p>Order ID: <strong>#{orderSuccess.order_id}</strong></p>
          <p>Total Amount: <strong>${parseFloat(orderSuccess.total).toFixed(2)}</strong></p>
          <p className="success-note">A confirmation has been sent. We'll keep you updated.</p>
          <div className="order-success-actions">
            <button onClick={() => { setOrderSuccess(null); navigate('/catalog'); }}>Continue Shopping</button>
            <Link to="/admin">View in Admin</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h2 className="cart-heading">Your Shopping Cart</h2>
        <div className="empty-cart">
          <div className="empty-cart-icon">&#128722;</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any shoes yet. Explore our collection and find your perfect pair.</p>
          <Link to="/catalog" className="continue-shopping">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2 className="cart-heading">Your Shopping Cart</h2>
      <div className="cart-layout">
        <div className="cart-items-wrap">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.product.id} className="cart-item">
                <Link to={`/product/${item.product.id}`} className="cart-item-img">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    onError={(e) => {
                      if (!e.target.dataset.fbk) {
                        e.target.dataset.fbk = '1';
                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80';
                      }
                    }}
                  />
                </Link>
                <div className="item-details">
                  <span className="brand">{item.product.brand || 'MegaFoot'}</span>
                  <h3>{item.product.name}</h3>
                  <p className="price">
                    ${parseFloat(item.product.price).toFixed(2)}{' '}
                    <span className="size-label">| Size: {item.product.size || 'N/A'}</span>
                  </p>
                </div>
                <div className="item-right">
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>&minus;</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <p className="total">${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
                  <button className="btn-remove" onClick={() => removeFromCart(item.product.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <Link to="/catalog" className="shopping-link">&larr; Continue Shopping</Link>
        </div>

        <div className="cart-summary">
          <h3 className="summary-title">Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? <strong className="free">FREE</strong> : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          {shipping > 0 && (
            <p className="free-ship-note">Add ${(100 - totalPrice).toFixed(2)} more to get free shipping!</p>
          )}
          <button onClick={handleCheckout} className="checkout-btn" disabled={loading}>
            {loading ? 'Placing Order...' : 'Proceed to Checkout'}
          </button>
          <div className="summary-trust">
            <span>&#128274;</span> Secure SSL encrypted checkout
          </div>
        </div>
      </div>
    </div>
  );
}
