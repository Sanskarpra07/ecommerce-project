import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';
import './ProductDetails.css';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('9');
  const [showDetails, setShowDetails] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get('/products.php', { params: { id } });
        setProduct(response.data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [id]);

  if (!product) return <div className="loading-text">Loading product...</div>;

  const stockClass = product.stock_quantity > 20 ? '' : product.stock_quantity > 0 ? 'low' : 'out';

  const handleAdd = () => {
    addToCart({ ...product, size }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-details-container">
      <Link to="/catalog" className="back-link">Back to Catalog</Link>
      <div className="product-details">
        <div className="pd-left">
          <img src={product.image_url} alt={product.name} className="product-image" />
        </div>
        <div className="pd-right">
          <span className="pd-brand">{product.brand}</span>
          <h2>{product.name}</h2>
          <p className="pd-price">${parseFloat(product.price).toFixed(2)}</p>
          <p className={`pd-stock ${stockClass}`}>
            {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} available)` : 'Out of Stock'}
          </p>
          <p className="pd-desc">{product.description}</p>

          <div className="details-row">
            <label>Size:</label>
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
            </select>
          </div>
          <div className="details-row">
            <label>Qty:</label>
            <select value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))}>
              {[...Array(5)].map((_, i) => (
                <option key={i} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <div className="pd-actions">
            <button onClick={handleAdd} className={added ? 'btn-added' : ''}>
              {added ? 'Added!' : 'Add to Cart'}
            </button>
            <button className="btn-secondary" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>

          {showDetails && (
            <div className="product-info">
              <h3>Specifications</h3>
              <ul>
                <li><span>Category</span><strong>{product.category_name || product.category_id}</strong></li>
                <li><span>Color</span><strong>{product.color || 'N/A'}</strong></li>
                <li><span>SKU</span><strong>MF-{product.id}</strong></li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
