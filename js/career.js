import { CareerManager } from './engine/careerManager.js';
import { MatchEngine } from './engine/matchEngine.js';
import { StatsEngine } from './engine/statsEngine.js';

const career = new CareerManager();
const stats = new StatsEngine();

const setupScreen = document.getElementById('setupScreen');
const careerScreen = document.getElementById('careerScreen');

let currentState = career.loadCareer();

if (currentState) {
  showCareer(currentState);
} else {
  setupScreen.style.display = 'block';
}

document.getElementById('setupForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const state = career.newCareer({
    playerName: document.getElementById('playerName').value,
    position: document.getElementById('playerPosition').value,
    difficulty: document.getElementById('difficulty').value,
    teamId: 'default',
    leagueId: 'es1'
  });
  currentState = state;
  showCareer(state);
});

function showCareer(state) {
  setupScreen.style.display = 'none';
  careerScreen.style.display = 'grid';

  document.getElementById('sidebarName').textContent = state.playerName;
  document.getElementById('sidebarPos').textContent = state.position;
  document.getElementById('sidebarOvr').textContent = state.overall;

  renderSeasonInfo(state);
  renderTab('overview', state);
}

function renderSeasonInfo(state) {
  document.getElementById('seasonInfo').innerHTML = `
    <div class="season-info-row"><span class="season-info-label">Temporada</span><span class="season-info-value">${state.season}</span></div>
    <div class="season-info-row"><span class="season-info-label">Edad</span><span class="season-info-value">${state.age} años</span></div>
    <div class="season-info-row"><span class="season-info-label">Potencial</span><span class="season-info-value" style="color:var(--gold)">${state.potential}</span></div>
    <div class="season-info-row"><span class="season-info-label">Jornada</span><span class="season-info-value">${state.week}/38</span></div>
    <div class="season-info-row"><span class="season-info-label">Goles</span><span class="season-info-value">${state.seasonStats.goals}</span></div>
    <div class="season-info-row"><span class="season-info-label">Asistencias</span><span class="season-info-value">${state.seasonStats.assists}</span></div>
  `;
}

// Tab system
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTab(btn.dataset.tab, currentState);
  });
});

function renderTab(tab, state) {
  const el = document.getElementById('tabContent');
  if (tab === 'overview') {
    el.innerHTML = `
      <div class="card" style="margin-bottom:1rem;">
        <h3 style="margin-bottom:1rem;">📊 Atributos</h3>
        <div class="attributes-grid">
          ${Object.entries(state.attributes).map(([k, v]) => `
            <div class="attribute-item">
              <div class="attribute-label">${k}</div>
              <div class="attribute-value" style="color:${v>=70?'var(--accent)':v>=55?'var(--gold)':'#ef4444'}">${v}</div>
              <div class="progress-bar" style="margin-top:0.3rem;"><div class="progress-fill" style="width:${v}%"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:0.75rem;">🏆 Palmarés</h3>
        ${state.stats.trophies.length === 0
          ? '<p style="color:var(--text2);font-size:0.9rem;">Aún no has ganado ningún trofeo. ¡A por ello!</p>'
          : state.stats.trophies.map(t => `<span class="badge badge-gold" style="margin:0.2rem;">🏆 ${t}</span>`).join('')
        }
      </div>
    `;
  } else if (tab === 'stats') {
    el.innerHTML = `
      <div class="card">
        <h3 style="margin-bottom:1rem;">📈 Estadísticas de Carrera</h3>
        <table class="stats-table">
          <thead><tr><th>Temporada</th><th>Partidos</th><th>Goles</th><th>Asistencias</th><th>MOTM</th></tr></thead>
          <tbody>
            ${state.history.map(h => `
              <tr><td>T${h.season}</td><td>${h.apps}</td><td>${h.goals}</td><td>${h.assists}</td><td>${h.motm}</td></tr>
            `).join('') || '<tr><td colspan="5" style="color:var(--text2);text-align:center;">Sin historial aún</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } else {
    el.innerHTML = `<div class="card"><p style="color:var(--text2);">Sección "${tab}" en desarrollo 🚧</p></div>`;
  }
}
