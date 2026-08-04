/**
 * Match Engine - Simulates football matches
 * Uses team strength, form, home advantage and randomness
 */
export class MatchEngine {
  constructor() {
    this.HOME_ADVANTAGE = 0.08;
  }

  /**
   * Simulate a single match
   * @param {object} home - { name, overall, form, attack, defense }
   * @param {object} away - { name, overall, form, attack, defense }
   * @returns {{ homeGoals, awayGoals, events }}
   */
  simulate(home, away) {
    const homeStr = (home.overall / 100) + this.HOME_ADVANTAGE + (home.form || 0) * 0.02;
    const awayStr = (away.overall / 100) + (away.form || 0) * 0.02;

    const homeGoals = this._calcGoals(homeStr, away.defense / 100);
    const awayGoals = this._calcGoals(awayStr, home.defense / 100);
    const events = this._generateEvents(homeGoals, awayGoals, home, away);

    return { homeGoals, awayGoals, events };
  }

  _calcGoals(attackStr, defStr) {
    const base = Math.max(0, attackStr - defStr * 0.6) * 3.5;
    const rand = Math.random() * 2.5;
    return Math.round(Math.max(0, (base + rand) * (0.5 + Math.random())));
  }

  _generateEvents(hg, ag, home, away) {
    const events = [];
    const minutes = () => Math.floor(Math.random() * 90) + 1;

    // Goals
    for (let i = 0; i < hg; i++)
      events.push({ type: 'goal', team: 'home', minute: minutes(), player: this._randomPlayer(home) });
    for (let i = 0; i < ag; i++)
      events.push({ type: 'goal', team: 'away', minute: minutes(), player: this._randomPlayer(away) });

    // Yellow cards
    const yellows = Math.floor(Math.random() * 4);
    for (let i = 0; i < yellows; i++)
      events.push({ type: 'yellow', team: Math.random() > 0.5 ? 'home' : 'away', minute: minutes() });

    return events.sort((a, b) => a.minute - b.minute);
  }

  _randomPlayer(team) {
    if (!team.players || !team.players.length) return 'Jugador';
    return team.players[Math.floor(Math.random() * team.players.length)].name;
  }

  simulateSeason(teams) {
    const results = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = 0; j < teams.length; j++) {
        if (i === j) continue;
        const match = this.simulate(teams[i], teams[j]);
        results.push({ home: teams[i].name, away: teams[j].name, ...match });
      }
    }
    return results;
  }

  buildTable(teams, results) {
    const table = Object.fromEntries(teams.map(t => [t.name, { name: t.name, logo: t.logo, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }]));
    for (const r of results) {
      const h = table[r.home], a = table[r.away];
      if (!h || !a) continue;
      h.p++; a.p++;
      h.gf += r.homeGoals; h.ga += r.awayGoals;
      a.gf += r.awayGoals; a.ga += r.homeGoals;
      if (r.homeGoals > r.awayGoals) { h.w++; h.pts += 3; a.l++; }
      else if (r.homeGoals < r.awayGoals) { a.w++; a.pts += 3; h.l++; }
      else { h.d++; a.d++; h.pts++; a.pts++; }
    }
    return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
  }
}
