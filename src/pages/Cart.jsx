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
          <h2>Order Placed Successfully!</h2>
          <p>Order ID: <strong>#{orderSuccess.order_id}</strong></p>
          <p>Total Amount: <strong>${parseFloat(orderSuccess.total).toFixed(2)}</strong></p>
          <div className="order-success-actions">
            <button onClick={() => setOrderSuccess(null)}>Shop More</button>
            <Link to="/admin">View in Admin</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2>Your Shopping Cart</h2>
      {items.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is currently empty.</p>
          <Link to="/catalog" className="continue-shopping">Continue Shopping</Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.product.id} className="cart-item">
                <img src={item.product.image_url} alt={item.product.name} />
                <div className="item-details">
                  <span className="brand">{item.product.brand}</span>
                  <h3>{item.product.name}</h3>
                  <p className="price">${parseFloat(item.product.price).toFixed(2)} | Size: {item.product.size || 'N/A'}</p>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="item-actions">
                  <p className="total">${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
                  <button className="btn-remove" onClick={() => removeFromCart(item.product.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Total: ${totalPrice.toFixed(2)}</h3>
            <button onClick={handleCheckout} className="checkout-btn" disabled={loading}>
              {loading ? 'Placing Order...' : 'Proceed to Checkout'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
