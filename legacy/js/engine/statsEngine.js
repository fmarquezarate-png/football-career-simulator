/**
 * StatsEngine - Calculates and formats player/team statistics
 */
export class StatsEngine {
  /**
   * Calculate player rating for a match (0-10)
   */
  matchRating(stats) {
    let rating = 6.0;
    rating += stats.goals * 1.2;
    rating += stats.assists * 0.7;
    rating -= stats.errors * 0.8;
    rating += stats.saves ? stats.saves * 0.15 : 0;
    if (stats.yellowCard) rating -= 0.3;
    if (stats.redCard) rating -= 2;
    return Math.min(10, Math.max(3, parseFloat(rating.toFixed(1))));
  }

  /**
   * Build standings table from fixtures array
   */
  buildStandings(fixtures, teamNames) {
    const table = {};
    for (const name of teamNames) {
      table[name] = { name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    }
    for (const f of fixtures) {
      if (f.played) {
        const h = table[f.home], a = table[f.away];
        if (!h || !a) continue;
        h.p++; a.p++;
        h.gf += f.homeGoals; h.ga += f.awayGoals;
        a.gf += f.awayGoals; a.ga += f.homeGoals;
        if (f.homeGoals > f.awayGoals) { h.w++; h.pts += 3; a.l++; }
        else if (f.homeGoals < f.awayGoals) { a.w++; a.pts += 3; h.l++; }
        else { h.d++; a.d++; h.pts++; a.pts++; }
      }
    }
    return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
  }

  /**
   * Format a number as +X or -X
   */
  formatDiff(n) {
    return n >= 0 ? `+${n}` : `${n}`;
  }

  /**
   * Get form string (last 5 results)
   */
  getForm(results) {
    return results.slice(-5).map(r => {
      if (r === 'W') return '<span class="badge badge-green">G</span>';
      if (r === 'L') return '<span class="badge" style="color:#ef4444">P</span>';
      return '<span class="badge">E</span>';
    }).join('');
  }
}
