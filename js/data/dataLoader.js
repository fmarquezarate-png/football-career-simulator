/**
 * DataLoader - Fetches and caches JSON data files
 */
export class DataLoader {
  constructor() {
    this._cache = {};
  }

  async load(path) {
    if (this._cache[path]) return this._cache[path];
    const base = this._getBase();
    const res = await fetch(`${base}${path}`);
    if (!res.ok) throw new Error(`Failed to load: ${path}`);
    const data = await res.json();
    this._cache[path] = data;
    return data;
  }

  _getBase() {
    // Works both locally and on Vercel
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return '/';
    return '/';
  }

  async loadLeague(countryCode) {
    return this.load(`data/leagues/${countryCode}.json`);
  }

  async loadTrophies(countryCode) {
    return this.load(`data/trophies/${countryCode}.json`);
  }

  async loadAllLeagues() {
    return this.load('data/leagues/index.json');
  }
}
