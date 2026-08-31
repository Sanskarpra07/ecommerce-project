import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../pages/Shop.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [size, setSize] = useState('9');
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart({ ...product, size }, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="card-link">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'}
          alt={product.name}
          className="product-img"
        />
      </Link>
      <div className="card-body">
        <span className="card-brand">{product.brand}</span>
        <Link to={`/product/${product.id}`}>
          <h3 className="card-title">{product.name}</h3>
        </Link>
        <p className="card-price">${parseFloat(product.price).toFixed(2)}</p>
        <div className="card-actions">
          <select value={size} onChange={(e) => setSize(e.target.value)} onClick={(e) => e.stopPropagation()}>
            <option value="7">Size 7</option>
            <option value="8">Size 8</option>
            <option value="9">Size 9</option>
            <option value="10">Size 10</option>
            <option value="11">Size 11</option>
          </select>
          <button onClick={handleAdd} className={added ? 'added' : ''}>
            {added ? 'Added!' : 'Add +'}
          </button>
        </div>
      </div>
    </div>
  );
}
