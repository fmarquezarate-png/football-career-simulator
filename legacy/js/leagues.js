import { DataLoader } from './data/dataLoader.js';

const loader = new DataLoader();
const listEl = document.getElementById('leaguesList');
const searchEl = document.getElementById('searchInput');
const confFilter = document.getElementById('confederationFilter');

let allLeagues = [];

async function init() {
  try {
    const index = await loader.loadAllLeagues();
    allLeagues = index;
    renderLeagues(allLeagues);
  } catch {
    listEl.innerHTML = '<p style="color:var(--text2);padding:1rem;">No se pudieron cargar las ligas.</p>';
  }
}

function renderLeagues(leagues) {
  if (!leagues.length) {
    listEl.innerHTML = '<p style="color:var(--text2);padding:1rem;">No se encontraron resultados.</p>';
    return;
  }
  listEl.innerHTML = leagues.map(l => `
    <div class="league-row">
      <span class="league-flag">${l.flag || '🏳️'}</span>
      <div class="league-info">
        <div class="league-name">${l.name}</div>
        <div class="league-country">${l.country} · ${l.confederation}</div>
      </div>
      <span class="league-teams-count">${l.teams} equipos</span>
      <span class="badge">${l.tier === 1 ? '⭐ 1ª División' : `${l.tier}ª División`}</span>
    </div>
  `).join('');
}

searchEl?.addEventListener('input', filterLeagues);
confFilter?.addEventListener('change', filterLeagues);

function filterLeagues() {
  const q = searchEl.value.toLowerCase();
  const conf = confFilter.value;
  const filtered = allLeagues.filter(l =>
    (!q || l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)) &&
    (!conf || l.confederation === conf)
  );
  renderLeagues(filtered);
}

init();
