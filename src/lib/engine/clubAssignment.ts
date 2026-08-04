import type { Difficulty, League, Team } from "../data/types";
import { getAllLeagues } from "../data/loader";
import { DIFFICULTY_PROFILES } from "../data/difficulty";
import { pickWeighted, type Rng } from "./rng";

export type ClubTier = "elite" | "grande" | "media" | "modesto";

export const TIER_ORDER: ClubTier[] = ["elite", "grande", "media", "modesto"];

export const TIER_LABEL: Record<ClubTier, string> = {
  elite: "Club élite",
  grande: "Club grande",
  media: "Club de mitad de tabla",
  modesto: "Club modesto",
};

export interface StartingClub {
  team: Team;
  league: League;
  tier: ClubTier;
}

/**
 * Reparte los equipos de las 5 ligas en cuatro franjas por percentil de overall.
 * Se calcula sobre el pool global, no por liga, para que un grande de Ligue 1 y
 * un grande de Premier caigan en la misma franja.
 */
function buildTiers(): Record<ClubTier, StartingClub[]> {
  const all: { team: Team; league: League }[] = [];
  for (const league of getAllLeagues()) {
    for (const team of league.teams) all.push({ team, league });
  }
  all.sort((a, b) => b.team.overall - a.team.overall);

  const n = all.length;
  const cuts = [Math.round(n * 0.1), Math.round(n * 0.3), Math.round(n * 0.62)];
  const tiers: Record<ClubTier, StartingClub[]> = { elite: [], grande: [], media: [], modesto: [] };

  all.forEach((entry, i) => {
    const tier: ClubTier =
      i < cuts[0] ? "elite" : i < cuts[1] ? "grande" : i < cuts[2] ? "media" : "modesto";
    tiers[tier].push({ ...entry, tier });
  });
  return tiers;
}

let TIERS: Record<ClubTier, StartingClub[]> | null = null;
function tiers() {
  TIERS ??= buildTiers();
  return TIERS;
}

/**
 * Sortea el club de debut. El jugador no elige equipo: la dificultad define la
 * distribución de probabilidad sobre las franjas y dentro de la franja el
 * reparto es uniforme.
 */
export function assignStartingClub(rng: Rng, difficulty: Difficulty): StartingClub {
  const pools = tiers();
  const weights = DIFFICULTY_PROFILES[difficulty].clubTierWeights;

  const available = TIER_ORDER.filter((t, i) => pools[t].length > 0 && weights[i] > 0);
  const availableWeights = available.map(t => weights[TIER_ORDER.indexOf(t)]);
  const tier = pickWeighted(rng, available, availableWeights);

  const pool = pools[tier];
  return pool[Math.floor(rng() * pool.length)];
}

/** Franja a la que pertenece un equipo ya asignado (para mostrarlo en la UI). */
export function tierOfTeam(teamId: string): ClubTier | null {
  const pools = tiers();
  for (const tier of TIER_ORDER) {
    if (pools[tier].some(c => c.team.id === teamId)) return tier;
  }
  return null;
}

/** Reparto esperado por dificultad, para explicarlo en la pantalla de setup. */
export function tierOdds(difficulty: Difficulty): { tier: ClubTier; pct: number }[] {
  const weights = DIFFICULTY_PROFILES[difficulty].clubTierWeights;
  const total = weights.reduce((a, b) => a + b, 0);
  return TIER_ORDER.map((tier, i) => ({ tier, pct: Math.round((weights[i] / total) * 100) }));
}
