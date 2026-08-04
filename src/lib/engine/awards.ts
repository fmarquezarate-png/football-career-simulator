import type { CareerSeasonStats, Team } from "../data/types";
import { getLeague } from "../data/loader";
import { normal, clamp, type Rng } from "./rng";

export interface AwardsResult {
  trophies: string[];
  individual: string[];
}

interface AwardContext {
  seasonStats: CareerSeasonStats;
  team: Team;
  leagueId: string;
  reputation: number;
  overall: number;
}

const CONT_CUP_NAME: Record<string, string> = {
  es1: "UEFA Champions League",
  en1: "UEFA Champions League",
  de1: "UEFA Champions League",
  it1: "UEFA Champions League",
  fr1: "UEFA Champions League",
};

const DOMESTIC_CUP: Record<string, string> = {
  es1: "Copa del Rey",
  en1: "FA Cup",
  de1: "DFB-Pokal",
  it1: "Coppa Italia",
  fr1: "Coupe de France",
};

const SUPERCUP: Record<string, string> = {
  es1: "Supercopa de España",
  en1: "Community Shield",
  de1: "DFL-Supercup",
  it1: "Supercoppa Italiana",
  fr1: "Trophée des Champions",
};

/** Trofeos de club (aleatorios con prob dependiente de rating equipo) + individuales (dependen de stats). */
export function computeAwards(rng: Rng, ctx: AwardContext): AwardsResult {
  const trophies: string[] = [];
  const individual: string[] = [];
  const s = ctx.seasonStats;
  const leagueMeta = getLeague(ctx.leagueId);
  const leagueName = leagueMeta?.name ?? ctx.leagueId;
  const teamPower = (ctx.team.attack + ctx.team.midfield + ctx.team.defense) / 3;

  // Liga
  if ((s.teamLeagueFinish ?? 20) === 1) trophies.push(leagueName);
  // Copa doméstica
  const cupProb = clamp(0.08 + (teamPower - 70) / 200, 0.03, 0.35);
  if (rng() < cupProb) trophies.push(DOMESTIC_CUP[ctx.leagueId] ?? "Copa doméstica");
  // Supercopa (solo si ganaste liga o copa)
  if (trophies.length && rng() < 0.5) trophies.push(SUPERCUP[ctx.leagueId] ?? "Supercopa");
  // Continental
  const conProb = clamp(0.03 + (teamPower - 82) / 100, 0.01, 0.2);
  if (rng() < conProb) trophies.push(CONT_CUP_NAME[ctx.leagueId] ?? "UEFA Champions League");

  // Botas y Pichichi (goles temporada)
  const goldenBootThreshold = normal(rng, 27, 3);
  if (s.goals >= goldenBootThreshold) individual.push("Bota de Oro de la liga");
  const assistKingThreshold = normal(rng, 15, 3);
  if (s.assists >= assistKingThreshold) individual.push("Rey de las asistencias");

  // MVP de liga (goles + asistencias + rating + team success)
  const contribution = s.goals + s.assists;
  const mvpScore = contribution + (s.avgRating - 6.8) * 20 + (20 - (s.teamLeagueFinish ?? 20)) * 0.6 + s.motm * 0.5;
  if (mvpScore > normal(rng, 42, 4)) individual.push(`MVP ${leagueName}`);

  // Balón de Oro: umbral alto, requiere temporada legendaria + trofeos importantes
  const ballonScore = mvpScore + trophies.length * 6 + (ctx.reputation - 60) * 0.4 + (ctx.overall - 82) * 1.5;
  if (ballonScore > normal(rng, 82, 3) && ((s.teamLeagueFinish ?? 20) <= 2 || trophies.length >= 2)) {
    individual.push("🏆 Balón de Oro");
  }

  return { trophies, individual };
}
