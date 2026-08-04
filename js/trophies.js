import { DataLoader } from './data/dataLoader.js';

const loader = new DataLoader();
const listEl = document.getElementById('trophiesList');
const countryFilter = document.getElementById('countryFilter');
const typeFilter = document.getElementById('typeFilter');

let allTrophies = [];

async function init() {
  try {
    const data = await loader.load('data/trophies/index.json');
    allTrophies = data;
    // Populate country filter
    const countries = [...new Set(data.map(t => t.country))].sort();
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      countryFilter.appendChild(opt);
    });
    renderTrophies(allTrophies);
  } catch {
    listEl.innerHTML = '<p style="color:var(--text2);">No se pudieron cargar los trofeos.</p>';
  }
}

function renderTrophies(trophies) {
  listEl.innerHTML = trophies.map(t => `
    <div class="trophy-card">
      <div class="trophy-icon">${t.icon || '🏆'}</div>
      <div class="trophy-name">${t.name}</div>
      <div class="trophy-country">${t.flag || ''} ${t.country}</div>
      <span class="badge ${t.prestige >= 4 ? 'badge-gold' : ''}">${'⭐'.repeat(t.prestige || 1)}</span>
    </div>
  `).join('');
}

countryFilter?.addEventListener('change', filterTrophies);
typeFilter?.addEventListener('change', filterTrophies);

function filterTrophies() {
  const country = countryFilter.value;
  const type = typeFilter.value;
  const filtered = allTrophies.filter(t =>
    (!country || t.country === country) &&
    (!type || t.type === type)
  );
  renderTrophies(filtered);
}

init();
