import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './css/dashboard.css';

const currency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function DashboardOverview() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prodRes, catRes, orderRes, userRes] = await Promise.allSettled([
          api.get('/products.php'),
          api.get('/categories.php'),
          api.get('/orders.php'),
          api.get('/users.php', { params: { admin_token: 'admin123' } }),
        ]);
        setProducts(prodRes.status === 'fulfilled' ? (prodRes.value.data.products || []) : []);
        setCategories(catRes.status === 'fulfilled' ? (catRes.value.data.categories || []) : []);
        setOrders(orderRes.status === 'fulfilled' ? (orderRes.value.data.orders || []) : []);
        setUsers(userRes.status === 'fulfilled' ? (userRes.value.data.users || []) : []);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
    [orders]
  );

  const metrics = [
    { label: 'Total Revenue', value: currency(totalRevenue), icon: '💵', sub: 'All recorded orders' },
    { label: 'Total Orders', value: orders.length.toLocaleString(), icon: '📦', sub: 'Placed in the store' },
    { label: 'Total Products', value: products.length.toLocaleString(), icon: '👟', sub: 'In the catalog' },
    { label: 'Total Users', value: users.length.toLocaleString(), icon: '👥', sub: 'Registered accounts' },
  ];

  const manageLinks = [
    {
      to: '/admin/products',
      icon: '📦',
      title: 'Manage Products',
      desc: 'Add, edit or remove products',
      count: products.length,
      label: 'products',
    },
    {
      to: '/admin/categories',
      icon: '🏷️',
      title: 'Manage Categories',
      desc: 'Organize the product catalog',
      count: categories.length,
      label: 'categories',
    },
    {
      to: '/admin/orders',
      icon: '📋',
      title: 'Manage Orders',
      desc: 'View and update order status',
      count: orders.length,
      label: 'orders',
    },
    {
      to: '/admin/users',
      icon: '👥',
      title: 'Manage Users',
      desc: 'View customer accounts',
      count: users.length,
      label: 'users',
    },
  ];

  if (loading) return <div className="db2026 db2026-root db2026-loading">Loading dashboard...</div>;

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Admin';

  return (
    <div className="db2026 db2026-root">
      <div className="db2026-banner">
        <div>
          <span className="db2026-eyebrow">Admin Dashboard</span>
          <h2>Welcome, {firstName}</h2>
          <p>Simple overview of your store and quick access to management tools.</p>
        </div>
        <div className="db2026-date">
          <div className="db2026-lbl">Today</div>
          <div className="db2026-val">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      <div className="db2026-grid db2026-stats">
        {metrics.map((m, idx) => (
          <div className="db2026-card" key={idx}>
            <div className="db2026-card-head">
              <span className="db2026-metric-label">{m.label}</span>
              <span className="db2026-icon-chip">{m.icon}</span>
            </div>
            <div className="db2026-metric-value">{m.value}</div>
            <div className="db2026-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="db2026-section-title">
        <h3>Quick Management</h3>
        <p>Click a card to manage that section</p>
      </div>

      <div className="db2026-manage-grid">
        {manageLinks.map((item, idx) => (
          <Link to={item.to} className="db2026-manage-card" key={idx}>
            <span className="db2026-icon-chip">{item.icon}</span>
            <div className="db2026-manage-body">
              <span className="db2026-manage-title">{item.title}</span>
              <span className="db2026-manage-desc">{item.desc}</span>
            </div>
            <div className="db2026-manage-right">
              <span className="db2026-manage-count">{item.count.toLocaleString()}</span>
              <span className="db2026-manage-arrow">&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}