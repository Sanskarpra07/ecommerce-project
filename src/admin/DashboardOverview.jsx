import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';

export default function DashboardOverview() {
  const [summary, setSummary] = useState({
    products: 0,
    categories: 0,
    lowStock: 0,
    revenue: 0,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prodRes, catRes, orderRes] = await Promise.all([
          api.get('/products.php'),
          api.get('/categories.php'),
          api.get('/orders.php'),
        ]);

        const products = prodRes.data.products || [];
        const categories = catRes.data.categories || [];
        const orders = orderRes.data.orders || [];

        const lowStockCount = products.filter((p) => p.stock_quantity < 10).length;
        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

        setSummary({
          products: products.length,
          categories: categories.length,
          lowStock: lowStockCount,
          revenue: totalRevenue,
        });
        setRecentProducts(products.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Products', value: summary.products, icon: '\u{1F4E6}', color: 'stat-blue', link: '/admin/products' },
    { label: 'Categories', value: summary.categories, icon: '\u{1F3F7}', color: 'stat-teal', link: '/admin/categories' },
    { label: 'Low Stock', value: summary.lowStock, icon: '\u26A0\uFE0F', color: 'stat-amber', link: '/admin/stock-log' },
    { label: 'Revenue', value: `$${summary.revenue.toFixed(2)}`, icon: '\u{1F4B0}', color: 'stat-green', link: '/admin/orders' },
  ];

  if (loading) return <div className="admin-loading">Loading dashboard...</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Dashboard Overview</h1>
      </div>

      <div className="stats-grid">
        {stats.map((s, idx) => (
          <Link to={s.link} className={`stat-card ${s.color}`} key={idx}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-body">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
            <span className="stat-edit-btn">Manage &#8594;</span>
          </Link>
        ))}
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h2>Recently Added Products</h2>
          <Link to="/admin/products" className="btn-link-small">View All</Link>
        </div>
        {recentProducts.length === 0 ? (
          <p className="empty-state">No products yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      <img
                        src={p.image_url || DEFAULT_IMAGE}
                        alt={p.name}
                        className="table-thumbnail"
                        onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                      />
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge-pill">{p.category_name || 'Uncategorized'}</span>
                  </td>
                  <td>${parseFloat(p.price).toFixed(2)}</td>
                  <td>
                    {p.stock_quantity < 10 ? (
                      <span className="stock-low">{p.stock_quantity} (Low)</span>
                    ) : (
                      <span className="stock-ok">{p.stock_quantity}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-quick-links">
        <Link to="/admin/products" className="quick-link">
          <span className="quick-link-icon">&#128230;</span>
          <div>
            <span className="quick-link-title">Manage Products</span>
            <span className="quick-link-desc">Add, edit, or remove products</span>
          </div>
          <span className="quick-link-edit">&#9998;</span>
        </Link>
        <Link to="/admin/categories" className="quick-link">
          <span className="quick-link-icon">&#127991;</span>
          <div>
            <span className="quick-link-title">Manage Categories</span>
            <span className="quick-link-desc">Organize your product catalog</span>
          </div>
          <span className="quick-link-edit">&#9998;</span>
        </Link>
        <Link to="/admin/stock-log" className="quick-link">
          <span className="quick-link-icon">&#128203;</span>
          <div>
            <span className="quick-link-title">Stock Log</span>
            <span className="quick-link-desc">Adjust inventory and view history</span>
          </div>
          <span className="quick-link-edit">&#9998;</span>
        </Link>
        <Link to="/admin/orders" className="quick-link">
          <span className="quick-link-icon">&#128196;</span>
          <div>
            <span className="quick-link-title">Manage Orders</span>
            <span className="quick-link-desc">View and update order status</span>
          </div>
          <span className="quick-link-edit">&#9998;</span>
        </Link>
      </div>
    </div>
  );
}
