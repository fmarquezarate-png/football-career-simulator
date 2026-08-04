import type { CareerState, CareerSeasonStats } from "../data/types";
import { NATIONAL_TEAMS } from "../data/loader";
import { normal, clamp, poisson, type Rng } from "./rng";

/**
 * Convocatoria a selección + posible participación en Mundial.
 * El Mundial ocurre cada 4 temporadas (season % 4 === 0).
 */
export function simulateNationalTeam(rng: Rng, state: CareerState): Partial<CareerSeasonStats> {
  const nt = NATIONAL_TEAMS.find(n => n.code === state.nationality) ?? NATIONAL_TEAMS.find(n => n.id === state.nationality);
  if (!nt) return {};

  // Umbral de convocatoria: reputación + overall vs media internacional.
  const callupThreshold = 60 + (100 - nt.rating) * 0.15;
  const score = state.overall * 0.6 + state.reputation * 0.6;
  if (score < callupThreshold) return {};

  const apps = clamp(Math.round(normal(rng, 6 + score / 30, 2)), 1, 14);
  const goalsMu = apps * (state.position === "ST" ? 0.35 : state.position === "LW" || state.position === "RW" ? 0.28 : state.position === "CAM" ? 0.18 : 0.05);
  const goals = poisson(rng, Math.max(0, goalsMu));

  const isWorldCupYear = state.seasonNumber % 4 === 0;
  return {
    nationalTeamApps: apps,
    nationalTeamGoals: goals,
    worldCupParticipated: isWorldCupYear ? `Mundial ${2026 + Math.floor((state.seasonNumber - 1) / 4) * 4}` : undefined,
  };
}
