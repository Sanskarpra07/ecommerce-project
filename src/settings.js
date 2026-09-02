export const SETTINGS_KEY = 'megafoot_settings';

export function getStoreSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) || {};
  } catch (e) {
    console.error('Failed to read store settings', e);
  }
  return {};
}