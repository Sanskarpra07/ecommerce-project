import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useToast } from '../components/Toast';

const EMPTY_FORM = { name: '', description: '' };

export default function CategoryList() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories.php');
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const startEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.category_name, description: cat.description || '' });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Category name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put('/categories.php', {
          id: editing.id,
          name: form.name.trim(),
          description: form.description.trim(),
          admin_token: 'admin123',
        });
        toast(`Category "${form.name}" updated`, 'success');
      } else {
        await api.post('/categories.php', {
          name: form.name.trim(),
          description: form.description.trim(),
          admin_token: 'admin123',
        });
        toast(`Category "${form.name}" created`, 'success');
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      fetchCategories();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save category';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name, productCount) => {
    if (productCount > 0) {
      toast(`Cannot delete "${name}": ${productCount} product(s) use this category. Reassign them first.`, 'error');
      return;
    }
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await api.delete('/categories.php', { params: { id, admin_token: 'admin123' } });
      toast(`Category "${name}" deleted`, 'info');
      fetchCategories();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete category';
      toast(msg, 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Category Management</h1>
          <p className="admin-subtitle">{categories.length} categories</p>
        </div>
      </div>

      <div className="category-layout">
        <div className="category-form-card">
          <h3>{editing ? 'Edit Category' : 'Add New Category'}</h3>
          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Category Name *
              <input
                type="text"
                placeholder="e.g. Running, Casual"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Description
              <textarea
                placeholder="Short description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </label>
            <div className="form-actions-row">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update Category' : 'Add Category'}
              </button>
              {editing && (
                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="category-table-card">
          {loading ? (
            <div className="admin-loading">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">No categories found.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, idx) => (
                  <tr key={cat.id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td><strong>{cat.category_name}</strong></td>
                    <td className="text-muted small">{cat.description || '--'}</td>
                    <td>
                      <span className="badge-pill">{cat.product_count}</span>
                    </td>
                    <td className="table-actions">
                      <button className="btn-action edit" onClick={() => startEdit(cat)}>Edit</button>
                      <button
                        className="btn-action delete"
                        onClick={() => handleDelete(cat.id, cat.category_name, parseInt(cat.product_count) || 0)}
                      >
                        Delete
                      </button>
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
