import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../pages/Shop.css';

const SIZES = ['7','8','9','10','11','12'];

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [size, setSize] = useState('9');
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart({ ...product, size }, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setLiked(!liked);
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="card-link">
        <div className="card-img-wrap">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className="product-img"
          />
          <div className="card-badge-wrap">
            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
              <span className="card-badge badge-low">Low Stock</span>
            )}
          </div>
          <button className={`wishlist-btn ${liked ? 'active' : ''}`} onClick={handleWishlist} aria-label="Add to wishlist">
            {liked ? '&#9829;' : '&#9825;'}
          </button>
        </div>
      </Link>

      <div className="card-body">
        <span className="card-brand">{product.brand || 'MegaFoot'}</span>
        <Link to={`/product/${product.id}`}>
          <h3 className="card-title">{product.name}</h3>
        </Link>
        <div className="card-price-row">
          <p className="card-price">${parseFloat(product.price).toFixed(2)}</p>
        </div>

        <div className="card-sizes">
          {SIZES.map((s) => (
            <button
              key={s}
              className={`size-chip ${size === s ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setSize(s); }}
            >
              {s}
            </button>
          ))}
        </div>

        <button onClick={handleAdd} className={`add-to-cart-btn ${added ? 'added' : ''}`}>
          {added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
