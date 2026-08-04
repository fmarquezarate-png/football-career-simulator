/**
 * CareerManager - Manages the player's career state
 */
import { StorageManager } from '../data/storage.js';
import { MatchEngine } from './matchEngine.js';

export class CareerManager {
  constructor() {
    this.storage = new StorageManager();
    this.engine = new MatchEngine();
    this.state = null;
  }

  newCareer({ playerName, teamId, leagueId, position, nationality, difficulty = 'normal' }) {
    this.state = {
      playerName,
      teamId,
      teamName: '',
      leagueId,
      position,
      nationality,
      difficulty,
      season: 1,
      week: 1,
      age: 18,
      overall: this._startingOverall(difficulty),
      potential: Math.floor(Math.random() * 20) + 75,
      stats: { goals: 0, assists: 0, apps: 0, motm: 0, trophies: [] },
      seasonStats: { goals: 0, assists: 0, apps: 0, motm: 0 },
      attributes: this._defaultAttributes(position),
      morale: 80,
      fitness: 100,
      reputation: 20,
      history: []
    };
    this.storage.saveCareer(this.state);
    return this.state;
  }

  loadCareer() {
    this.state = this.storage.loadCareer();
    return this.state;
  }

  _startingOverall(difficulty) {
    const map = { easy: 72, normal: 65, hard: 58, legendary: 52 };
    return (map[difficulty] || 65) + Math.floor(Math.random() * 6);
  }

  _defaultAttributes(position) {
    const base = { pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 };
    if (position === 'GK') return { ...base, reflexes: 70, positioning: 70, handling: 70, kicking: 60, pace: 50 };
    if (['CB','LB','RB'].includes(position)) return { ...base, defending: 72, physical: 68 };
    if (['CAM','LW','RW','ST'].includes(position)) return { ...base, shooting: 70, dribbling: 70, pace: 72 };
    return base;
  }

  progressSeason(seasonResults) {
    if (!this.state) return;
    const s = this.state;
    s.season++;
    s.age++;
    s.history.push({ season: s.season - 1, ...s.seasonStats });
    s.seasonStats = { goals: 0, assists: 0, apps: 0, motm: 0 };
    // Natural progression / regression
    if (s.age <= 27) s.overall = Math.min(s.potential, s.overall + Math.floor(Math.random() * 3));
    else if (s.age >= 32) s.overall = Math.max(40, s.overall - Math.floor(Math.random() * 2));
    this.storage.saveCareer(s);
    return s;
  }
}
