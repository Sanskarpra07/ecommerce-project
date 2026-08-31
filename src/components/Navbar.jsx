import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { items } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

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
      <Link to="/" className="logo">Mega<span>Foot</span></Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/catalog">Shop</Link>
        {isAdmin && <Link to="/admin">Admin</Link>}
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
          <span className="cart-icon">&#128722;</span>
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
      </div>
    </nav>
  );
}
