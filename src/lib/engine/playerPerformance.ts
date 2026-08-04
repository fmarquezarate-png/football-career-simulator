import type { Position, Team } from "../data/types";
import { normal, poisson, clamp, type Rng } from "./rng";

/**
 * Fracciones de participación en goles por posición.
 * ST/LW/RW acaparan goles. Los centrales asisten poco.
 */
const GOAL_SHARE: Record<Position, number> = {
  GK: 0.001, CB: 0.03, LB: 0.02, RB: 0.02, CDM: 0.04, CM: 0.07, CAM: 0.15, LW: 0.20, RW: 0.20, ST: 0.32,
};
const ASSIST_SHARE: Record<Position, number> = {
  GK: 0.001, CB: 0.02, LB: 0.05, RB: 0.05, CDM: 0.06, CM: 0.12, CAM: 0.20, LW: 0.18, RW: 0.18, ST: 0.14,
};

export interface SeasonPerformanceInput {
  position: Position;
  overall: number;
  team: Team;
  leagueRounds: number;
  leagueAvgOverall: number;
  reputation: number;
  moralePct: number;
  fitnessPct: number;
  potential: number;
}

export interface SeasonPerformanceOutput {
  apps: number;
  goals: number;
  assists: number;
  motm: number;
  avgRating: number;
  teamLeagueFinish: number;
  teamGoalsFor: number;
  teamGoalsAgainst: number;
}

/**
 * Simulación de temporada agregada para el jugador.
 * Cada temporada se genera un rendimiento estocástico
 * en función de rating, posición, calidad del equipo,
 * y el diferencial contra la media de la liga.
 */
export function simulatePlayerSeason(input: SeasonPerformanceInput, rng: Rng): SeasonPerformanceOutput {
  const {
    position, overall, team, leagueRounds, leagueAvgOverall,
    reputation, moralePct, fitnessPct,
  } = input;

  // Titularidad: cuanto más rating relativo al equipo, más partidos juega.
  const teamAvg = (team.attack + team.midfield + team.defense) / 3;
  const gap = overall - teamAvg;
  const startingProb = clamp(0.55 + gap * 0.04, 0.25, 0.98);
  const appsMu = leagueRounds * startingProb * (fitnessPct / 100);
  const apps = clamp(Math.round(normal(rng, appsMu, 3)), 5, leagueRounds);

  // Goles del equipo esperados durante la temporada.
  const leagueGap = teamAvg - leagueAvgOverall;
  const teamGoalsFor = clamp(Math.round(normal(rng, 45 + leagueGap * 1.6 + team.attack * 0.4, 8)), 15, 130);
  const teamGoalsAgainst = clamp(Math.round(normal(rng, 55 - leagueGap * 1.3 - team.defense * 0.25, 8)), 12, 120);

  // Share del jugador según posición + calidad.
  const positionGoalShare = GOAL_SHARE[position];
  const positionAssistShare = ASSIST_SHARE[position];
  const skillFactor = clamp((overall - 60) / 30, 0.4, 2.2);
  const moraleFactor = clamp(0.6 + moralePct / 200, 0.6, 1.1);

  const goalsMu = teamGoalsFor * positionGoalShare * skillFactor * moraleFactor * (apps / leagueRounds);
  const assistsMu = teamGoalsFor * positionAssistShare * skillFactor * moraleFactor * (apps / leagueRounds);

  const goals = poisson(rng, Math.max(0, goalsMu));
  const assists = poisson(rng, Math.max(0, assistsMu));

  // MOTM y rating medio.
  const contributionsPerApp = apps > 0 ? (goals + assists) / apps : 0;
  const motmMu = apps * (0.03 + contributionsPerApp * 0.3) * skillFactor;
  const motm = clamp(Math.round(normal(rng, motmMu, 1.5)), 0, apps);

  const ratingMu = 6.4 + contributionsPerApp * 0.8 + (overall - 65) * 0.015 + (reputation / 500);
  const avgRating = clamp(Number(normal(rng, ratingMu, 0.15).toFixed(2)), 5.5, 9.5);

  // Clasificación del equipo (1 = campeón).
  const finishNoise = normal(rng, 0, 1.5);
  const rankRaw = clamp(10 - leagueGap * 0.6 + finishNoise, 1, 20);
  const teamLeagueFinish = Math.round(rankRaw);

  return { apps, goals, assists, motm, avgRating, teamLeagueFinish, teamGoalsFor, teamGoalsAgainst };
}
