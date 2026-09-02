import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './css/product-form.css';

const SETTINGS_KEY = 'megafoot_settings';

const DEFAULT_SETTINGS = {
  storeName: 'MegaFoot',
  tagline: 'Step Into Style',
  supportEmail: 'support@megafoot.com',
  currency: 'USD',
  itemsPerPage: '12',
  logoUrl: '',
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
  if (apiSettings.logoUrl) s.logoUrl = apiSettings.logoUrl;
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
  const [confirmRemoveLogo, setConfirmRemoveLogo] = useState(false);

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

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings locally', e);
    }
  }, [settings]);

  const persistLogoToApi = async (logoUrl) => {
    try {
      await api.put('/settings.php', {
        settings: { logoUrl: logoUrl || '' },
        admin_token: 'admin123',
      });
    } catch (apiError) {
      console.error('Could not save logo to API:', apiError);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }

    const fd = new FormData();
    fd.append('image', file);
    fd.append('admin_token', 'admin123');

    try {
      const res = await api.post('/upload.php', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      setSettings((prev) => ({ ...prev, logoUrl: url }));
      await persistLogoToApi(url);
      toast('Logo uploaded — shown in navbar & footer', 'success');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to upload logo';
      toast(msg, 'error');
    }
  };

  const handleLogoUrlBlur = () => {
    persistLogoToApi(settings.logoUrl || '');
  };

  const handleRemoveLogo = async () => {
    setConfirmRemoveLogo(false);
    setSettings((prev) => ({ ...prev, logoUrl: '' }));
    await persistLogoToApi('');
    toast('Logo removed — store using text logo', 'info');
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
          logoUrl: settings.logoUrl || '',
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
          <h3>Store Branding</h3>
          <div className="form-grid">
            <label>Store Logo (URL)
              <input
                type="text"
                name="logoUrl"
                value={settings.logoUrl}
                placeholder="https://.../logo.png"
                onChange={handleChange}
                onBlur={handleLogoUrlBlur}
              />
            </label>
            <div>
              <span className="admin-form-label">Or Upload a Logo</span>
              <div className="upload-dropzone">
                <input type="file" id="logoUpload" className="upload-input" accept="image/*" onChange={handleImageUpload} />
                <label htmlFor="logoUpload" className="upload-label">
                  <span>&#128228;</span> Choose image to upload
                </label>
                <span className="upload-hint">JPG, PNG, GIF or WebP &middot; max 5MB</span>
              </div>
            </div>
          </div>
          {settings.logoUrl && (
            <div className="logo-preview">
              <img src={settings.logoUrl} alt="Store logo" onError={(e) => { e.target.style.visibility = 'hidden'; }} />
              <div>
                <p>Current logo (shown in the storefront navbar and footer).</p>
                <button type="button" className="btn-secondary small-btn" onClick={() => setConfirmRemoveLogo(true)}>
                  Remove &amp; Use Text Logo
                </button>
              </div>
            </div>
          )}
        </div>

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

      {confirmRemoveLogo && (
        <div className="admin-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Remove Logo?</h2>
              <button type="button" className="modal-close" onClick={() => setConfirmRemoveLogo(false)}>&times;</button>
            </div>
            <p className="modal-text">
              The storefront navbar and footer will go back to showing the default "MegaFoot" text logo.
              This will be saved immediately — are you sure?
            </p>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setConfirmRemoveLogo(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleRemoveLogo}>Yes, Remove Logo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
