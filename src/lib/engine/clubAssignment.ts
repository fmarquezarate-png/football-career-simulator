import type { Difficulty, League, Team } from "../data/types";
import { getAllLeagues, LEAGUE_IDS, leagueStrength } from "../data/loader";
import { HOME_LEAGUE, originWeights } from "../data/origins";
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
 * Franja de un equipo *dentro de su liga*. Con 33 competiciones de nivel muy
 * distinto, calcular las franjas sobre el conjunto global dejaba a ligas
 * enteras sin un solo club "grande", que es justo lo contrario de lo que se
 * quiere: Colo-Colo es un grande en Chile aunque su media no llegue a la de
 * un colista de la Premier.
 */
function tierWithinLeague(league: League, teamId: string): ClubTier {
  const sorted = [...league.teams].sort((a, b) => b.overall - a.overall);
  const i = sorted.findIndex(t => t.id === teamId);
  const pct = i / Math.max(sorted.length - 1, 1);
  if (pct <= 0.12) return "elite";
  if (pct <= 0.35) return "grande";
  if (pct <= 0.68) return "media";
  return "modesto";
}

export function tierOfTeam(teamId: string): ClubTier | null {
  for (const league of getAllLeagues()) {
    if (league.teams.some(t => t.id === teamId)) return tierWithinLeague(league, teamId);
  }
  return null;
}

/**
 * Sortea el club de debut en dos pasos, como ocurre de verdad:
 *
 *  1. **El país.** Lo decide la nacionalidad: un chileno empieza casi siempre
 *     en Chile, y si sale fuera lo normal es Argentina o Brasil antes que
 *     Europa. La dificultad regula cuánto empuja hacia fuera y hacia arriba.
 *  2. **El club dentro de esa liga.** Aquí sí manda la dificultad, con las
 *     franjas calculadas dentro de la propia liga.
 */
export function assignStartingClub(
  rng: Rng, difficulty: Difficulty, nationality: string,
): StartingClub {
  const leagueWeights = originWeights(nationality, difficulty, LEAGUE_IDS);
  const ids = Object.keys(leagueWeights);
  const leagueId = pickWeighted(rng, ids, ids.map(id => leagueWeights[id]));
  const league = getAllLeagues().find(l => l.id === leagueId)!;

  const pools: Record<ClubTier, Team[]> = { elite: [], grande: [], media: [], modesto: [] };
  for (const team of league.teams) pools[tierWithinLeague(league, team.id)].push(team);

  const weights = DIFFICULTY_PROFILES[difficulty].clubTierWeights;
  const available = TIER_ORDER.filter((t, i) => pools[t].length > 0 && weights[i] > 0);
  const tier = available.length
    ? pickWeighted(rng, available, available.map(t => weights[TIER_ORDER.indexOf(t)]))
    : TIER_ORDER.find(t => pools[t].length > 0)!;

  const pool = pools[tier];
  return { team: pool[Math.floor(rng() * pool.length)], league, tier };
}

/** Reparto esperado por franja, para explicarlo en la pantalla de creación. */
export function tierOdds(difficulty: Difficulty): { tier: ClubTier; pct: number }[] {
  const weights = DIFFICULTY_PROFILES[difficulty].clubTierWeights;
  const total = weights.reduce((a, b) => a + b, 0);
  return TIER_ORDER.map((tier, i) => ({ tier, pct: Math.round((weights[i] / total) * 100) }));
}

/**
 * Reparto esperado por país, para enseñarle al jugador dónde es probable que
 * debute antes de empezar. Devuelve las ligas más probables ya ordenadas.
 */
export function originOdds(
  nationality: string, difficulty: Difficulty, limit = 5,
): { leagueId: string; country: string; countryCode: string; pct: number }[] {
  const weights = originWeights(nationality, difficulty, LEAGUE_IDS);
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const leagues = getAllLeagues();

  return Object.entries(weights)
    .map(([leagueId, w]) => {
      const l = leagues.find(x => x.id === leagueId)!;
      return { leagueId, country: l.country, countryCode: l.countryCode, pct: (w / total) * 100 };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, limit)
    .map(x => ({ ...x, pct: Math.round(x.pct) }));
}

export { HOME_LEAGUE, leagueStrength };
