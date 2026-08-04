import type { CareerState, CareerSeasonStats, NationalTeam } from "../data/types";
import { NATIONAL_TEAMS } from "../data/loader";
import { findCountry } from "../data/nationalities";
import { normal, clamp, poisson, type Rng } from "./rng";

/**
 * Selección del jugador. Las 32 potencias tienen rating curado en
 * `national-teams.json`; el resto de los 205 países recibe un rating sintético
 * estable (derivado del código ISO) en la franja baja, para que cualquier
 * nacionalidad tenga carrera internacional aunque sea modesta.
 */
export function resolveNationalTeam(code: string): NationalTeam {
  const curated = NATIONAL_TEAMS.find(n => n.code === code) ?? NATIONAL_TEAMS.find(n => n.id === code);
  if (curated) return curated;

  const country = findCountry(code);
  let hash = 0;
  for (let i = 0; i < country.code.length; i++) hash = (hash * 31 + country.code.charCodeAt(i)) % 1000;
  return {
    id: country.id,
    name: country.name,
    code: country.code,
    confederation: "—",
    rating: 46 + (hash % 22), // 46–67: selecciones menores
  };
}

/**
 * Convocatoria a selección + posible participación en Mundial.
 * El Mundial ocurre cada 4 temporadas (season % 4 === 0).
 */
export function simulateNationalTeam(rng: Rng, state: CareerState): Partial<CareerSeasonStats> {
  const nt = resolveNationalTeam(state.nationality);

  // Cuanto más fuerte la selección, más difícil entrar.
  const callupThreshold = 45 + (nt.rating - 50) * 0.45;
  const score = state.overall * 0.6 + state.reputation * 0.6;
  if (score < callupThreshold) return {};

  const apps = clamp(Math.round(normal(rng, 6 + score / 30, 2)), 1, 14);
  const goalsMu = apps * (state.position === "ST" ? 0.35 : state.position === "LW" || state.position === "RW" ? 0.28 : state.position === "CAM" ? 0.18 : 0.05);
  const goals = poisson(rng, Math.max(0, goalsMu));

  // Solo las selecciones con opciones reales llegan a la fase final.
  const isWorldCupYear = state.seasonNumber % 4 === 0;
  const qualifies = isWorldCupYear && rng() < clamp((nt.rating - 40) / 55, 0.05, 0.95);

  return {
    nationalTeamApps: apps,
    nationalTeamGoals: goals,
    worldCupParticipated: qualifies
      ? `Mundial ${2026 + Math.floor((state.seasonNumber - 1) / 4) * 4}`
      : undefined,
  };
}
