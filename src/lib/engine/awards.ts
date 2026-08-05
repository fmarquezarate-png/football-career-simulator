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

/**
 * Nombre de las competiciones por liga. Con 33 ligas, una tabla por
 * competición sería inmanejable: se define la copa, la supercopa y el torneo
 * continental de cada país, y los que falten caen a un nombre genérico
 * coherente con su confederación.
 */
const DOMESTIC_CUP: Record<string, string> = {
  es1: "Copa del Rey", en1: "FA Cup", de1: "DFB-Pokal", it1: "Coppa Italia",
  fr1: "Coupe de France", pt1: "Taça de Portugal", nl1: "KNVB Beker",
  tr1: "Türkiye Kupası", be1: "Beker van België", at1: "ÖFB-Cup",
  ch1: "Schweizer Cup", gr1: "Κύπελλο Ελλάδας", sco1: "Scottish Cup",
  cz1: "Český pohár", dk1: "DBU Pokalen", pl1: "Puchar Polski",
  hr1: "Hrvatski kup", ua1: "Кубок України", rs1: "Kup Srbije",
  no1: "Norgesmesterskapet", se1: "Svenska Cupen", ro1: "Cupa României",
  il1: "גביע המדינה", bg1: "Купа на България",
  br1: "Copa do Brasil", ar1: "Copa Argentina", mx1: "Copa MX",
  sa1: "King's Cup", us1: "US Open Cup", jp1: "Copa del Emperador",
  co1: "Copa Colombia", cl1: "Copa Chile", uy1: "Copa Uruguay",
};

const SUPERCUP: Record<string, string> = {
  es1: "Supercopa de España", en1: "Community Shield", de1: "DFL-Supercup",
  it1: "Supercoppa Italiana", fr1: "Trophée des Champions",
  pt1: "Supertaça Cândido de Oliveira", nl1: "Johan Cruyff Schaal",
  tr1: "Süper Kupa", be1: "Supercopa de Bélgica", br1: "Supercopa do Brasil",
  ar1: "Supercopa Argentina", mx1: "Campeón de Campeones",
  sa1: "Supercopa Saudí", cl1: "Supercopa de Chile", uy1: "Supercopa Uruguaya",
  co1: "Superliga de Colombia", jp1: "Supercopa de Japón",
};

/** Torneo continental por confederación. */
const CONTINENTAL: Record<string, string> = {
  UEFA: "UEFA Champions League",
  CONMEBOL: "Copa Libertadores",
  CONCACAF: "CONCACAF Champions Cup",
  AFC: "AFC Champions League",
  CAF: "CAF Champions League",
};

function domesticCup(leagueId: string): string {
  return DOMESTIC_CUP[leagueId] ?? "Copa nacional";
}

function supercup(leagueId: string): string {
  return SUPERCUP[leagueId] ?? "Supercopa nacional";
}

function continentalCup(leagueId: string): string {
  const conf = getLeague(leagueId)?.confederation ?? "UEFA";
  return CONTINENTAL[conf] ?? "Copa continental";
}

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
  if (rng() < cupProb) trophies.push(domesticCup(ctx.leagueId));
  // Supercopa (solo si ganaste liga o copa)
  if (trophies.length && rng() < 0.5) trophies.push(supercup(ctx.leagueId));
  // Continental
  const conProb = clamp(0.03 + (teamPower - 82) / 100, 0.01, 0.2);
  if (rng() < conProb) trophies.push(continentalCup(ctx.leagueId));

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
