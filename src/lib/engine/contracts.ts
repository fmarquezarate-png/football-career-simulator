import type { CareerState, Team } from "../data/types";
import { getAllLeagues } from "../data/loader";
import { normal, clamp, type Rng } from "./rng";

export interface ContractOffer {
  team: Team;
  leagueId: string;
  wageWeekly: number;
  transferFee: number;
  contractYears: number;
  releaseClause: number;
  interestScore: number;
}

/**
 * Genera ofertas de fichaje al final de la temporada.
 * El interés de cada club depende de:
 *   - overall del jugador
 *   - reputación
 *   - goles + asistencias + trofeos individuales
 *   - edad (penaliza >30)
 *   - gap entre rating del jugador y rating del equipo (menos ofertas de equipos muy inferiores)
 */
export function generateOffers(rng: Rng, state: CareerState): ContractOffer[] {
  const offers: ContractOffer[] = [];
  const lastSeason = state.history[state.history.length - 1];
  const goalsLast = lastSeason?.goals ?? state.seasonStats.goals;
  const assistsLast = lastSeason?.assists ?? state.seasonStats.assists;
  const trophiesLast = lastSeason?.individualAwards.length ?? 0;

  const ageFactor = state.age <= 27 ? 1.0 : state.age <= 30 ? 0.85 : state.age <= 33 ? 0.55 : 0.25;
  const baseInterest = (state.overall - 55) * 3 + state.reputation * 0.4 + goalsLast * 1.2 + assistsLast * 0.9 + trophiesLast * 8;

  for (const league of getAllLeagues()) {
    for (const team of league.teams) {
      if (team.id === state.currentTeamId) continue;
      const teamAvg = (team.attack + team.midfield + team.defense) / 3;
      const gap = state.overall - teamAvg;
      // Los clubes solo se interesan si el jugador aporta upside o encaje.
      if (gap < -6 && team.prestige < 75) continue;

      const interestScore = clamp(baseInterest * ageFactor - Math.max(0, teamAvg - state.overall) * 4 + team.prestige * 0.1, 0, 300);
      if (interestScore < 55) continue;
      // Sólo top 15 clubes por interés al final.
      offers.push({
        team, leagueId: league.id,
        wageWeekly: computeWage(rng, state, team, interestScore),
        transferFee: computeFee(rng, state, team, interestScore),
        contractYears: state.age >= 32 ? 1 + Math.floor(rng() * 2) : 3 + Math.floor(rng() * 3),
        releaseClause: 0,
        interestScore,
      });
    }
  }
  offers.sort((a, b) => b.interestScore - a.interestScore);
  const top = offers.slice(0, 6);
  for (const o of top) o.releaseClause = Math.round(o.transferFee * (1.5 + rng() * 1.5));
  return top;
}

function computeWage(rng: Rng, state: CareerState, team: Team, interest: number): number {
  const base = team.wageCeiling * clamp((state.overall - 60) / 30, 0.2, 1.4);
  const noise = normal(rng, 1, 0.1);
  return Math.max(5000, Math.round(base * noise * clamp(interest / 150, 0.4, 1.4)));
}

function computeFee(rng: Rng, state: CareerState, team: Team, interest: number): number {
  const baseMillions = Math.pow(Math.max(0, state.overall - 55), 2.2) * 0.35;
  const ageAdj = state.age <= 26 ? 1.2 : state.age <= 30 ? 1.0 : state.age <= 33 ? 0.55 : 0.2;
  const budgetCap = team.budget * 0.9;
  const raw = baseMillions * 1_000_000 * ageAdj * normal(rng, 1, 0.15) * clamp(interest / 120, 0.6, 1.8);
  return Math.max(0, Math.min(budgetCap, Math.round(raw)));
}
