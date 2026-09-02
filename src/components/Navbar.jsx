import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { getStoreSettings } from '../settings';

export default function Navbar() {
  const { items } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [logoUrl, setLogoUrl] = useState(getStoreSettings().logoUrl || '');
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="logo">
          {logoUrl && !logoError ? (
            <img className="logo-img" src={logoUrl} alt="MegaFoot" onError={() => setLogoError(true)} />
          ) : (
            <>
              <span className="logo-icon">&#128085;</span>
              <span className="logo-text">Mega<span>Foot</span></span>
            </>
          )}
        </Link>

        <div className={`nav-links ${mobileMenu ? 'open' : ''}`}>
          <Link to="/" onClick={() => setMobileMenu(false)}>Home</Link>
          <Link to="/catalog" onClick={() => setMobileMenu(false)}>Shop</Link>
        </div>

        <div className="nav-actions">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search shoes..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <Link to="/cart" className="cart-link">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          <div className="user-section">
            {user ? (
              <>
                <span className={`user-badge ${isAdmin ? 'admin' : ''}`}>
                  {user.full_name} {isAdmin && '(Admin)'}
                </span>
                <button onClick={logout} className="btn-logout">Logout</button>
              </>
            ) : (
              <Link to="/login" className="btn-auth">Login</Link>
            )}
          </div>

          <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? '\u2715' : '\u2630'}
          </button>
        </div>
      </div>
    </nav>
  );
}
