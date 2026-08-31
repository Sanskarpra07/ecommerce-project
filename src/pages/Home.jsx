import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import './Home.css';

export default function Home() {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get('/products.php');
        setTrending((res.data.products || []).slice(0, 4));
      } catch (error) {
        console.error('Error fetching trending products:', error);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h1>Step Into Style</h1>
        <p>Discover the latest trends in premium footwear at MegaFoot</p>
        <Link to="/catalog" className="cta-button">Shop Now</Link>
      </section>

      <section className="categories">
        <h2>Shop by Category</h2>
        <div className="category-grid">
          <Link to="/catalog?category=1" className="category-card">
            <h3>Running</h3>
          </Link>
          <Link to="/catalog?category=2" className="category-card">
            <h3>Casual</h3>
          </Link>
          <Link to="/catalog?category=3" className="category-card">
            <h3>Formal</h3>
          </Link>
          <Link to="/catalog?category=4" className="category-card">
            <h3>Sneakers</h3>
          </Link>
        </div>
      </section>

      <section className="trending">
        <h2>Trending Now</h2>
        <div className="product-grid">
          {trending.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <Link to="/catalog" className="view-all">View All Products</Link>
      </section>
    </div>
  );
}
