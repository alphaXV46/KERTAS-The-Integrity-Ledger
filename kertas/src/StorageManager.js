// StorageManager.js — localStorage with 3 named save slots
const SCHEMA_VERSION = 1;
const KEY_PREFIX = 'kertas_v1_slot_';
const KEY_SETTINGS = 'kertas_v1_settings';

export class StorageManager {
  saveSlot(slotIndex, data) {
    if (slotIndex < 0 || slotIndex > 2) throw new Error('Invalid slot index');
    const payload = {
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      data
    };
    try {
      localStorage.setItem(KEY_PREFIX + slotIndex, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn('Save failed:', e);
      return false;
    }
  }

  loadSlot(slotIndex) {
    const raw = localStorage.getItem(KEY_PREFIX + slotIndex);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  deleteSlot(slotIndex) {
    localStorage.removeItem(KEY_PREFIX + slotIndex);
  }

  getAllSlots() {
    return [0, 1, 2].map(i => ({ index: i, save: this.loadSlot(i) }));
  }

  hasAnySave() {
    return [0, 1, 2].some(i => this.loadSlot(i) !== null);
  }

  saveSettings(settings) {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  }

  loadSettings() {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return { lang: 'id', muted: false };
    try { return JSON.parse(raw); } catch { return { lang: 'id', muted: false }; }
  }
}
