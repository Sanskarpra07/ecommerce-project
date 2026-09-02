import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from '../components/Toast';
import { getStoreSettings } from '../settings';
import './AdminLayout.css';
import './css/admin-common.css';

export default function AdminLayout() {
  const { user, isAdmin } = useAuth();
  const logoUrl = getStoreSettings().logoUrl || '';
  const storeUrl = (window.location.href || '').split('#')[0] || './';

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <h2>Admin Access Restricted</h2>
        <p>You must be signed in with an administrator account to view the dashboard.</p>
        <div className="admin-denied-actions">
          <Link to="/login" className="btn-denied-login">Log In as Admin</Link>
          <Link to="/" className="btn-denied-home">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            {logoUrl ? (
              <img className="admin-brand-logo" src={logoUrl} alt="Store logo" />
            ) : (
              <h2>Mega<span>Foot</span></h2>
            )}
            <p>Admin Panel</p>
          </div>
          <nav className="admin-nav">
            <NavLink to="/admin" end className="admin-nav-link">
              <span className="nav-icon">&#128200;</span> Dashboard
            </NavLink>
            <NavLink to="/admin/products" className="admin-nav-link">
              <span className="nav-icon">&#128230;</span> Products
            </NavLink>
            <NavLink to="/admin/categories" className="admin-nav-link">
              <span className="nav-icon">&#127991;</span> Categories
            </NavLink>
            <NavLink to="/admin/stock-log" className="admin-nav-link">
              <span className="nav-icon">&#128203;</span> Stock Log
            </NavLink>
            <NavLink to="/admin/orders" className="admin-nav-link">
              <span className="nav-icon">&#128196;</span> Orders
            </NavLink>
            <NavLink to="/admin/users" className="admin-nav-link">
              <span className="nav-icon">&#128101;</span> Users
            </NavLink>
            <NavLink to="/admin/settings" className="admin-nav-link">
              <span className="nav-icon">&#9881;</span> Settings
            </NavLink>
          </nav>
          <div className="admin-user">
            <span className="admin-user-name">{user?.full_name}</span>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="admin-back-store">
              View Store &#8599;
            </a>
          </div>
        </aside>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
