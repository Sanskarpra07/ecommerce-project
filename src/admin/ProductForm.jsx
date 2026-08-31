import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../components/Toast';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';

const EMPTY_FORM = {
  category_id: '1',
  name: '',
  brand: '',
  price: '',
  size: '9',
  color: '',
  description: '',
  image_url: '',
  stock_quantity: '10',
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories.php');
        setCategories(res.data.categories || []);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetchProduct = async () => {
      try {
        const res = await api.get('/products.php', { params: { id } });
        const p = res.data.product;
        if (p) {
          setForm({
            category_id: String(p.category_id),
            name: p.name || '',
            brand: p.brand || '',
            price: p.price || '',
            size: p.size || '9',
            color: p.color || '',
            description: p.description || '',
            image_url: p.image_url || '',
            stock_quantity: String(p.stock_quantity ?? '10'),
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast('Failed to load product', 'error');
        navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, isEdit, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast('Product name is required', 'error');
      return;
    }
    const priceVal = parseFloat(form.price);
    if (isNaN(priceVal) || priceVal <= 0) {
      toast('Please enter a valid price', 'error');
      return;
    }
    const stockVal = parseInt(form.stock_quantity, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      toast('Please enter a valid stock quantity', 'error');
      return;
    }

    const payload = {
      ...form,
      price: priceVal,
      stock_quantity: stockVal,
      image_url: form.image_url.trim() || DEFAULT_IMAGE,
      admin_token: 'admin123',
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.put('/products.php', { ...payload, id: parseInt(id, 10) });
        toast(`Product "${form.name}" updated successfully`, 'success');
      } else {
        await api.post('/products.php', payload);
        toast('Product created successfully', 'success');
      }
      navigate('/admin/products');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save product';
      toast(`Error: ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading product...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/admin/products')}>
          Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="product-form-card">
        <div className="form-grid">
          <label>
            Product Name *
            <input
              type="text"
              name="name"
              placeholder="e.g. Air Zoom Pegasus 39"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Brand
            <input
              type="text"
              name="brand"
              placeholder="e.g. Nike"
              value={form.brand}
              onChange={handleChange}
            />
          </label>
          <label>
            Price ($) *
            <input
              type="number"
              name="price"
              step="0.01"
              placeholder="129.99"
              value={form.price}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Stock *
            <input
              type="number"
              name="stock_quantity"
              placeholder="25"
              value={form.stock_quantity}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Category *
            <select name="category_id" value={form.category_id} onChange={handleChange} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </label>
          <label>
            Size
            <input
              type="text"
              name="size"
              placeholder="e.g. 9, 10.5"
              value={form.size}
              onChange={handleChange}
            />
          </label>
          <label>
            Color
            <input
              type="text"
              name="color"
              placeholder="e.g. Black / White"
              value={form.color}
              onChange={handleChange}
            />
          </label>
          <label>
            Image URL
            <input
              type="url"
              name="image_url"
              placeholder="https://..."
              value={form.image_url}
              onChange={handleChange}
            />
          </label>
          <label className="form-full">
            Description
            <textarea
              name="description"
              placeholder="Product description..."
              value={form.description}
              onChange={handleChange}
              rows={4}
            />
          </label>
        </div>
        <div className="form-actions-row">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save & Publish'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/products')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
