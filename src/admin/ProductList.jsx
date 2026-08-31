import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../components/Toast';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';

export default function ProductList() {
  const toast = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products.php');
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(products);
    } else {
      const term = search.toLowerCase();
      setFiltered(
        products.filter((p) =>
          (p.name || '').toLowerCase().includes(term) ||
          (p.brand || '').toLowerCase().includes(term) ||
          String(p.id).includes(term)
        )
      );
    }
  }, [search, products]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete('/products.php', { params: { id, admin_token: 'admin123' } });
      toast(`Product "${name}" deleted`, 'info');
      fetchProducts();
    } catch (error) {
      toast('Failed to delete product', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Products</h1>
          <p className="admin-subtitle">{filtered.length} products</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/products/add')}>
          + Add Product
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-search"
          placeholder="Search by name, brand, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="admin-loading">Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          No products found. <Link to="/admin/products/add">Add One?</Link>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>ID</th>
              <th>Name</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <img
                    src={p.image_url || DEFAULT_IMAGE}
                    alt={p.name}
                    className="table-thumbnail"
                    onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                  />
                </td>
                <td className="text-muted">#{p.id}</td>
                <td><strong>{p.name}</strong></td>
                <td>{p.brand || '-'}</td>
                <td>
                  <span className="badge-pill">{p.category_name || `Cat #${p.category_id}`}</span>
                </td>
                <td>${parseFloat(p.price).toFixed(2)}</td>
                <td>
                  <span className={p.stock_quantity > 5 ? 'stock-ok' : 'stock-low'}>
                    {p.stock_quantity}
                  </span>
                </td>
                <td className="table-actions">
                  <button className="btn-action edit" onClick={() => navigate(`/admin/products/edit/${p.id}`)}>
                    Edit
                  </button>
                  <button className="btn-action delete" onClick={() => handleDelete(p.id, p.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
