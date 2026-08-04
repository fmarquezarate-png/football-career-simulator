/**
 * StorageManager - Handles all localStorage persistence
 */
export class StorageManager {
  constructor() {
    this.KEYS = {
      CAREER: 'fcs_career',
      SETTINGS: 'fcs_settings',
      HISTORY: 'fcs_history'
    };
  }

  saveCareer(data) {
    localStorage.setItem(this.KEYS.CAREER, JSON.stringify({ ...data, savedAt: Date.now() }));
  }

  loadCareer() {
    try {
      const raw = localStorage.getItem(this.KEYS.CAREER);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  deleteCareer() {
    localStorage.removeItem(this.KEYS.CAREER);
  }

  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(this.KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : { language: 'es', difficulty: 'normal', simSpeed: 'fast' };
    } catch { return {}; }
  }
}
