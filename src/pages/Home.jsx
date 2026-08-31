import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const CATEGORIES = [
  { id: 1, name: 'Running', tagline: 'Built for speed', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
  { id: 2, name: 'Casual', tagline: 'Everyday comfort', img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80' },
  { id: 3, name: 'Formal', tagline: 'Make a statement', img: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=800&q=80' },
  { id: 4, name: 'Sneakers', tagline: 'Street ready', img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80' },
];

const CAT_FALLBACK = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';

const handleImgError = (e) => {
  if (e.target.src !== CAT_FALLBACK) {
    e.target.src = CAT_FALLBACK;
  }
};

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products.php');
        setTrending((res.data.products || []).slice(0, 8));
      } catch (e) {
        console.error('Error fetching products:', e);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories.php');
        if (res.data.categories) setCategories(res.data.categories);
      } catch (e) {
        setCategories(CATEGORIES);
      }
    };
    fetchCategories();
  }, []);

  const displayCategories = categories.length > 0
    ? categories.map((c, i) => ({
        ...c,
        tagline: CATEGORIES.find(c2 => c2.id === c.id)?.tagline || 'Explore now',
        img: CATEGORIES.find(c2 => c2.id === c.id)?.img || CATEGORIES[i % 4].img,
      }))
    : CATEGORIES;

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-tag">New Collection 2026</span>
          <h1>FIND YOUR<br />PERFECT PAIR</h1>
          <p>Step into the latest trends in premium footwear. Designed for comfort, built for style.</p>
          <div className="hero-actions">
            <Link to="/catalog" className="cta-primary">Shop Now</Link>
            <Link to="/catalog?category=1" className="cta-secondary">Explore Running</Link>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="trust-strip">
        <div className="trust-item">
          <span className="trust-icon">&#128666;</span>
          <div>
            <strong>Free Shipping</strong>
            <span>On orders over $100</span>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">&#128257;</span>
          <div>
            <strong>Easy Returns</strong>
            <span>30-day return policy</span>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">&#128274;</span>
          <div>
            <strong>Secure Payment</strong>
            <span>100% protected</span>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">&#9733;</span>
          <div>
            <strong>Premium Quality</strong>
            <span>Handpicked brands</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories">
        <div className="section-header">
          <span className="section-tag">Categories</span>
          <h2>Shop by Style</h2>
        </div>
        <div className="category-grid">
          {displayCategories.map((cat) => (
            <Link to={`/catalog?category=${cat.id}`} key={cat.id} className="category-card">
              <img src={cat.img} alt={cat.name} onError={handleImgError} />
              <div className="category-overlay">
                <h3>{cat.name}</h3>
                <span>{cat.tagline}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="trending">
        <div className="section-header">
          <span className="section-tag">Trending Now</span>
          <h2>Popular Picks</h2>
        </div>
        <div className="product-grid">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="view-all-wrap">
          <Link to="/catalog" className="view-all-btn">View All Products &rarr;</Link>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="promo-banner">
        <div className="promo-content">
          <span className="promo-tag">Limited Time</span>
          <h2>UP TO 40% OFF</h2>
          <p>Don't miss out on our biggest sale of the season. Hundreds of styles discounted.</p>
          <Link to="/catalog" className="cta-primary">Shop the Sale</Link>
        </div>
      </section>
    </div>
  );
}
