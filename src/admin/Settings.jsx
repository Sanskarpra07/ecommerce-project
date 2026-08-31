import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const SETTINGS_KEY = 'megafoot_settings';

const DEFAULT_SETTINGS = {
  storeName: 'MegaFoot',
  tagline: 'Step Into Style',
  supportEmail: 'support@megafoot.com',
  currency: 'USD',
  itemsPerPage: '12',
  enableReviews: false,
  enableNewsletter: false,
};

function loadLocal() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

const convertFromApi = (apiSettings) => {
  const s = { ...DEFAULT_SETTINGS };
  if (!apiSettings || typeof apiSettings !== 'object') return s;
  if (apiSettings.storeName) s.storeName = apiSettings.storeName;
  if (apiSettings.tagline) s.tagline = apiSettings.tagline;
  if (apiSettings.supportEmail) s.supportEmail = apiSettings.supportEmail;
  if (apiSettings.currency) s.currency = apiSettings.currency;
  if (apiSettings.itemsPerPage) s.itemsPerPage = apiSettings.itemsPerPage;
  if (apiSettings.enableReviews !== undefined) {
    s.enableReviews = apiSettings.enableReviews === '1' || apiSettings.enableReviews === true;
  }
  if (apiSettings.enableNewsletter !== undefined) {
    s.enableNewsletter = apiSettings.enableNewsletter === '1' || apiSettings.enableNewsletter === true;
  }
  return s;
};

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState(loadLocal);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings.php');
        const apiData = res.data?.settings || {};
        if (Object.keys(apiData).length > 0) {
          setSettings(convertFromApi(apiData));
        }
      } catch (error) {
        console.error('Failed to load settings from API:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      const payload = {
        settings: {
          storeName: settings.storeName,
          tagline: settings.tagline,
          supportEmail: settings.supportEmail,
          currency: settings.currency,
          itemsPerPage: settings.itemsPerPage,
          enableReviews: settings.enableReviews ? '1' : '0',
          enableNewsletter: settings.enableNewsletter ? '1' : '0',
        },
        admin_token: 'admin123',
      };
      try {
        await api.put('/settings.php', payload);
      } catch (apiError) {
        console.error('Could not reach settings API, saved locally only:', apiError);
      }
      setSaving(false);
      toast('Settings saved successfully', 'success');
    } catch (error) {
      setSaving(false);
      toast('Failed to save settings', 'error');
    }
  };

  const handleReset = async () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(SETTINGS_KEY);
      try {
        await api.put('/settings.php', { settings: {}, admin_token: 'admin123' });
      } catch (apiError) {
        console.error('Could not reset via API:', apiError);
      }
    } catch (error) {
      console.error('Reset error:', error);
    }
    toast('Settings reset to defaults', 'info');
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Store Settings</h1>
          <p className="admin-subtitle">Configure your storefront preferences</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-form">
        <div className="settings-section">
          <h3>General</h3>
          <div className="form-grid">
            <label>Store Name
              <input type="text" name="storeName" value={settings.storeName} onChange={handleChange} />
            </label>
            <label>Tagline
              <input type="text" name="tagline" value={settings.tagline} onChange={handleChange} />
            </label>
            <label>Support Email
              <input type="email" name="supportEmail" value={settings.supportEmail} onChange={handleChange} />
            </label>
            <label>Currency
              <select name="currency" value={settings.currency} onChange={handleChange}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (&#8364;)</option>
                <option value="GBP">GBP (&pound;)</option>
                <option value="INR">INR (&#8377;)</option>
              </select>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Catalog</h3>
          <div className="form-grid">
            <label>Products Per Page
              <input type="number" name="itemsPerPage" min="4" max="48" value={settings.itemsPerPage} onChange={handleChange} />
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Features</h3>
          <div className="check-list">
            <label className="checkbox-row">
              <input type="checkbox" name="enableReviews" checked={settings.enableReviews} onChange={handleChange} />
              <span>Enable Product Reviews</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" name="enableNewsletter" checked={settings.enableNewsletter} onChange={handleChange} />
              <span>Enable Newsletter Signup</span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Account</h3>
          <div className="account-info">
            <p><strong>Logged in as:</strong> {user?.full_name} ({user?.email})</p>
            <p><strong>Role:</strong> Administrator</p>
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="btn-secondary" onClick={handleReset}>Reset to Defaults</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
