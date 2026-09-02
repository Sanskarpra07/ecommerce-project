import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import api from '../api';
import { getStoreSettings } from '../settings';

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState(getStoreSettings().logoUrl || '');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/settings.php');
        const url = res.data?.settings?.logoUrl;
        if (mounted && url) setLogoUrl(url);
      } catch (error) {
        /* local settings only */
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            {logoUrl && !logoError ? (
              <img className="footer-logo-img" src={logoUrl} alt="MegaFoot" onError={() => setLogoError(true)} />
            ) : (
              <>
                <span className="footer-logo-icon">&#128085;</span>
                <span>Mega<span>Foot</span></span>
              </>
            )}
          </Link>
          <p>Premium footwear designed for comfort, built for style. Step into the latest trends with confidence.</p>
          <div className="footer-social">
            <a href="#facebook" aria-label="Facebook" title="Facebook" onClick={(e) => e.preventDefault()}>
              <span>&#120125;</span>
            </a>
            <a href="#instagram" aria-label="Instagram" title="Instagram" onClick={(e) => e.preventDefault()}>
              <span>&#128247;</span>
            </a>
            <a href="#twitter" aria-label="Twitter" title="Twitter" onClick={(e) => e.preventDefault()}>
              <span>&#128038;</span>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/catalog">All Products</Link></li>
            <li><Link to="/catalog?category=1">Running</Link></li>
            <li><Link to="/catalog?category=2">Casual</Link></li>
            <li><Link to="/catalog?category=3">Formal</Link></li>
            <li><Link to="/catalog?category=4">Sneakers</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Customer Service</h4>
          <ul>
            <li><Link to="/cart">Shopping Cart</Link></li>
            <li><a href="#shipping" onClick={(e) => e.preventDefault()}>Shipping Info</a></li>
            <li><a href="#returns" onClick={(e) => e.preventDefault()}>Returns &amp; Exchanges</a></li>
            <li><a href="#size-guide" onClick={(e) => e.preventDefault()}>Size Guide</a></li>
            <li><a href="#faq" onClick={(e) => e.preventDefault()}>FAQ</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Create Account</Link></li>
            <li><Link to="/admin">Admin Panel</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>&copy; {new Date().getFullYear()} MegaFoot. All rights reserved.</p>
          <div className="footer-payments">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>PayPal</span>
            <span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}