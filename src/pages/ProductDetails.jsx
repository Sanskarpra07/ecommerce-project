import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';
import './ProductDetails.css';

const SIZES = ['6','7','8','9','10','11','12'];

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('description');
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get('/products.php', { params: { id } });
        setProduct(response.data.product);
        setError('');
      } catch (err) {
        setError('Failed to load product details.');
      }
    };
    fetchProduct();
  }, [id]);

  if (!product) {
    return <div className="loading-text">{error || 'Loading product...'}</div>;
  }

  const stockClass = product.stock_quantity > 20 ? '' : product.stock_quantity > 0 ? 'low' : 'out';

  const handleAdd = () => {
    if (!selectedSize) {
      setError('Please select a size.');
      return;
    }
    setError('');
    addToCart({ ...product, size: selectedSize }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-details-container">
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/catalog">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-details">
        <div className="pd-left">
          <div className="pd-image-wrap">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'}
              alt={product.name}
              className="product-image"
            />
            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
              <span className="pd-low-badge">Low Stock</span>
            )}
            {product.stock_quantity === 0 && (
              <span className="pd-out-badge">Out of Stock</span>
            )}
          </div>
        </div>

        <div className="pd-right">
          <span className="pd-brand">{product.brand || 'MegaFoot'}</span>
          <h2>{product.name}</h2>

          <div className="pd-rating">
            {'\u2605\u2605\u2605\u2605\u2605'}
            <span>(4.9) | {product.id * 37} reviews</span>
          </div>

          <p className={`pd-stock ${stockClass}`}>
            {product.stock_quantity > 0
              ? `In Stock (${product.stock_quantity} available)`
              : 'Currently Out of Stock'}
          </p>

          <div className="pd-price-row">
            <p className="pd-price">${parseFloat(product.price).toFixed(2)}</p>
            <span className="pd-tax">inclusive of all taxes</span>
          </div>

          <p className="pd-desc">{product.description || 'Premium quality footwear designed for comfort and style.'}</p>

          <div className="pd-size-row">
            <label><strong>Select Size:</strong> <span>Size Guide</span></label>
            <div className="pd-sizes">
              {SIZES.map((s) => (
                <button
                  key={s}
                  className={`pd-size ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pd-qty-row">
            <label><strong>Quantity:</strong></label>
            <div className="qty-selector">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>&minus;</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(5, quantity + 1))}>+</button>
            </div>
          </div>

          {error && <p className="pd-error">{error}</p>}

          <div className="pd-actions">
            <button
              onClick={handleAdd}
              className={`pd-add-btn ${added ? 'btn-added' : ''}`}
              disabled={product.stock_quantity === 0}
            >
              {product.stock_quantity === 0
                ? 'Out of Stock'
                : added ? '\u2713 Added!' : 'Add to Cart'}
            </button>
          </div>

          <div className="pd-trust">
            <div><span>&#128666;</span> Free shipping over $100</div>
            <div><span>&#128257;</span> 30-day return policy</div>
            <div><span>&#128274;</span> Secure checkout</div>
          </div>
        </div>
      </div>

      {/* Tabs: Description + Specifications */}
      <div className="pd-tabs">
        <div className="pd-tab-headers">
          <button className={tab === 'description' ? 'active' : ''} onClick={() => setTab('description')}>
            Description
          </button>
          <button className={tab === 'specs' ? 'active' : ''} onClick={() => setTab('specs')}>
            Specifications
          </button>
        </div>
        <div className="pd-tab-content">
          {tab === 'description' ? (
            <p>
              {product.description || 'This premium {brand} footwear delivers exceptional comfort, durability, and style. Perfect for everyday wear, athletic performance, and everything in between.'}
            </p>
          ) : (
            <ul className="pd-specs">
              <li><span>Brand</span><strong>{product.brand || 'MegaFoot'}</strong></li>
              <li><span>Category</span><strong>{product.category_name || product.category_id}</strong></li>
              <li><span>Color</span><strong>{product.color || 'N/A'}</strong></li>
              <li><span>SKU</span><strong>MF-{product.id}</strong></li>
              <li><span>Availability</span>
                <strong>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                </strong>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
