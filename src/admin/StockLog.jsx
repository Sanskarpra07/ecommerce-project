import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useToast } from '../components/Toast';

const EMPTY_FORM = {
  product_id: '',
  type: 'add',
  change_amount: '',
  reason: '',
};

export default function StockLog() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products.php');
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get('/stock_log.php', { params: { admin_token: 'admin123', limit: 50 } });
      setLogs(res.data.logs || []);
    } catch (error) {
      console.error('Error fetching stock log:', error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchLogs()]);
      setLoading(false);
    };
    load();
  }, [fetchProducts, fetchLogs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id) {
      toast('Please select a product', 'error');
      return;
    }
    const amount = parseInt(form.change_amount, 10);
    if (!amount || amount <= 0) {
      toast('Please enter a valid amount', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.post('/stock_log.php', {
        product_id: parseInt(form.product_id, 10),
        change_amount: amount,
        type: form.type,
        reason: form.reason.trim(),
        changed_by: 'Admin',
        admin_token: 'admin123',
      });
      toast('Stock updated successfully', 'success');
      setForm(EMPTY_FORM);
      await Promise.all([fetchProducts(), fetchLogs()]);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update stock';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === parseInt(form.product_id, 10));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Stock Adjustment</h1>
          <p className="admin-subtitle">Manage inventory levels and view adjustment history</p>
        </div>
      </div>

      <div className="stock-layout">
        <div className="stock-form-card">
          <h3>Adjust Stock</h3>
          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Product *
              <select
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                required
              >
                <option value="">-- Select product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock_quantity})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type *
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              >
                <option value="add">Add Stock</option>
                <option value="remove">Remove Stock</option>
              </select>
            </label>
            <label>
              Amount *
              <input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={form.change_amount}
                onChange={(e) => setForm({ ...form, change_amount: e.target.value })}
                required
              />
            </label>
            <label>
              Reason
              <input
                type="text"
                placeholder="e.g. New stock arrived, Damaged goods"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </label>
            {selectedProduct && (
              <div className="stock-preview">
                Current stock: <strong>{selectedProduct.stock_quantity}</strong>
                {form.type === 'remove' && form.change_amount && (
                  <span> &rarr; New: <strong>{Math.max(0, selectedProduct.stock_quantity - parseInt(form.change_amount || 0, 10))}</strong></span>
                )}
                {form.type === 'add' && form.change_amount && (
                  <span> &rarr; New: <strong>{selectedProduct.stock_quantity + parseInt(form.change_amount || 0, 10)}</strong></span>
                )}
              </div>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </form>
        </div>

        <div className="stock-log-card">
          <h3>Recent Adjustments</h3>
          {loading ? (
            <div className="admin-loading">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="empty-state">No stock adjustments recorded yet.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Change</th>
                  <th>Reason</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td><strong>{log.product_name}</strong></td>
                    <td>
                      {parseInt(log.change_amount) > 0 ? (
                        <span className="badge-success">+{log.change_amount}</span>
                      ) : (
                        <span className="badge-danger">{log.change_amount}</span>
                      )}
                    </td>
                    <td className="text-muted small">{log.reason || '--'}</td>
                    <td>{log.changed_by}</td>
                    <td className="text-muted small">
                      {new Date(log.created_at).toLocaleDateString('en-US', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
