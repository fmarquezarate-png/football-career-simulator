import type {
  AppliedEventOutcome, CareerSeasonStats, CareerState, Difficulty, EventTemplate,
  Position,
} from "../data/types";
import { getLeague, getAllLeagues } from "../data/loader";
import { DIFFICULTY_PROFILES } from "../data/difficulty";
import { assignStartingClub, type ClubTier } from "./clubAssignment";
import { makeRng, clamp, type Rng } from "./rng";
import { simulatePlayerSeason } from "./playerPerformance";
import { applyChoice, EVENT_MEMORY, EVENT_TEMPLATES, pickSeasonEvents } from "./events";
import { computeAwards } from "./awards";
import { simulateNationalTeam } from "./nationalTeam";
import { generateOffers, type ContractOffer } from "./contracts";

export const EVENTS_PER_SEASON = 10;

export interface NewCareerParams {
  playerName: string;
  nationality: string;
  position: Position;
  difficulty: Difficulty;
  seed?: string;
}

/**
 * Crea la carrera. El club de debut **no se elige**: se sortea a partir de la
 * distribución de franjas de la dificultad (ver `clubAssignment.ts`).
 */
export function newCareer(params: NewCareerParams): CareerState {
  const rng = makeRng(params.seed ?? `${params.playerName}-${Date.now()}`);
  const profile = DIFFICULTY_PROFILES[params.difficulty];
  const { team, league, tier } = assignStartingClub(rng, params.difficulty);
  const startOverall = clamp(profile.startOverall + Math.floor(rng() * 6), 45, 85);
  return {
    playerName: params.playerName,
    nationality: params.nationality,
    position: params.position,
    difficulty: params.difficulty,
    currentTeamId: team.id,
    currentTeamName: team.name,
    currentLeagueId: league.id,
    startingTier: tier,
    age: 18,
    overall: startOverall,
    potential: clamp(startOverall + 10 + profile.potentialBonus + Math.floor(rng() * 15), 62, 95),
    reputation: 20,
    morale: 80,
    fitness: 100,
    seasonNumber: 1,
    week: 1,
    isRetired: false,
    attributes: defaultAttributes(params.position),
    totals: { goals: 0, assists: 0, apps: 0, motm: 0 },
    seasonStats: { goals: 0, assists: 0, apps: 0, motm: 0 },
    history: [],
    contracts: [{
      teamId: team.id, teamName: team.name, seasonStart: 1, seasonEnd: 3,
      wageWeekly: Math.max(5000, Math.round(team.wageCeiling * (startOverall / 100) * 0.3)),
      transferFee: 0,
    }],
    events: [],
    awards: [],
    trophies: [],
    currentSeasonEventsRemaining: EVENTS_PER_SEASON,
  };
}

function defaultAttributes(pos: Position) {
  const base = { pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 };
  if (pos === "GK") return { ...base, defending: 70, pace: 45 };
  if (["CB", "LB", "RB"].includes(pos)) return { ...base, defending: 72, physical: 68 };
  if (["CDM", "CM"].includes(pos)) return { ...base, passing: 70, defending: 65 };
  if (pos === "CAM") return { ...base, passing: 72, dribbling: 70, shooting: 68 };
  if (["LW", "RW"].includes(pos)) return { ...base, pace: 75, dribbling: 72, shooting: 68 };
  if (pos === "ST") return { ...base, shooting: 74, pace: 70, physical: 68 };
  return base;
}

/** Devuelve los eventos del bloque actual (o siguientes 3 hasta que el usuario los cierre). */
export function nextSeasonEvents(state: CareerState, chunk = 3): EventTemplate[] {
  const rng = makeRng(`events-${state.playerName}-${state.seasonNumber}-${state.currentSeasonEventsRemaining}`);
  return pickSeasonEvents(rng, state, Math.min(chunk, state.currentSeasonEventsRemaining));
}

/** Aplica una elección de evento sobre el estado y devuelve el nuevo state + outcome. */
export function resolveEvent(
  state: CareerState, template: EventTemplate, choiceKey: string,
): { state: CareerState; outcome: AppliedEventOutcome } {
  const choice = template.choices.find(c => c.key === choiceKey);
  if (!choice) throw new Error(`Choice desconocida: ${choiceKey}`);
  const rng = makeRng(`choice-${state.playerName}-${state.seasonNumber}-${template.key}-${choiceKey}-${Date.now()}`);
  const raw = applyChoice(rng, template, choice, state);
  // La dificultad amplifica el lado malo de cada decisión, no el bueno.
  const outcome = amplifyDownside(raw, DIFFICULTY_PROFILES[state.difficulty].eventVariance);

  const newState: CareerState = {
    ...state,
    overall: clamp(state.overall + outcome.overallDelta, 45, Math.min(99, state.potential + 3)),
    morale: clamp(state.morale + outcome.moraleDelta, 0, 100),
    reputation: clamp(state.reputation + outcome.reputationDelta, 0, 100),
    fitness: clamp(state.fitness + outcome.fitnessDelta, 20, 100),
    seasonStats: {
      ...state.seasonStats,
      goals: Math.max(0, state.seasonStats.goals + outcome.goalsBoost),
      assists: Math.max(0, state.seasonStats.assists + outcome.assistsBoost),
    },
    events: [...state.events, outcome],
    // Memoria de eventos: evita que el mismo repertorio se repita cada
    // temporada. Se conserva entre temporadas, no se reinicia con ellas.
    recentEventKeys: [...(state.recentEventKeys ?? []), template.key].slice(-EVENT_MEMORY),
    currentSeasonEventsRemaining: Math.max(0, state.currentSeasonEventsRemaining - 1),
  };
  return { state: newState, outcome };
}

/** Escala solo los deltas negativos por el factor de varianza de la dificultad. */
function amplifyDownside(o: AppliedEventOutcome, variance: number): AppliedEventOutcome {
  if (variance === 1) return o;
  const down = (v: number) => (v < 0 ? v * variance : v);
  return {
    ...o,
    goalsBoost: Math.round(down(o.goalsBoost)),
    assistsBoost: Math.round(down(o.assistsBoost)),
    moraleDelta: down(o.moraleDelta),
    reputationDelta: down(o.reputationDelta),
    overallDelta: down(o.overallDelta),
    fitnessDelta: down(o.fitnessDelta),
  };
}

export interface EndSeasonResult {
  state: CareerState;
  season: CareerSeasonStats;
  offers: ContractOffer[];
}

/** Cierra la temporada: simula partidos + selección + trofeos + progresión de edad/rating. */
export function endSeason(state: CareerState): EndSeasonResult {
  const rng = makeRng(`endseason-${state.playerName}-${state.seasonNumber}`);
  const league = getLeague(state.currentLeagueId)!;
  const team = league.teams.find(t => t.id === state.currentTeamId)!;

  const leagueAvgOverall = league.teams.reduce((sum, t) => sum + (t.attack + t.midfield + t.defense) / 3, 0) / league.teams.length;
  const perf = simulatePlayerSeason({
    position: state.position,
    overall: state.overall,
    team,
    leagueRounds: league.rounds,
    leagueAvgOverall,
    reputation: state.reputation,
    moralePct: state.morale,
    fitnessPct: state.fitness,
    potential: state.potential,
  }, rng);

  // Añadimos los boosts acumulados por eventos.
  const finalGoals = Math.max(0, perf.goals + state.seasonStats.goals);
  const finalAssists = Math.max(0, perf.assists + state.seasonStats.assists);
  const finalMotm = perf.motm;

  const seasonStats: CareerSeasonStats = {
    seasonNumber: state.seasonNumber,
    teamId: team.id, teamName: team.name, leagueId: league.id,
    teamLeagueFinish: perf.teamLeagueFinish,
    apps: perf.apps, goals: finalGoals, assists: finalAssists, motm: finalMotm,
    avgRating: perf.avgRating, trophies: [], individualAwards: [],
  };

  const awards = computeAwards(rng, {
    seasonStats, team, leagueId: league.id, reputation: state.reputation, overall: state.overall,
  });
  seasonStats.trophies = awards.trophies;
  seasonStats.individualAwards = awards.individual;

  const nt = simulateNationalTeam(rng, state);
  Object.assign(seasonStats, nt);

  // Progresión
  const newAge = state.age + 1;
  const growthMult = DIFFICULTY_PROFILES[state.difficulty].growthMultiplier;
  const rawGrowth = newAge <= 24 ? 2 + Math.floor(rng() * 3) : newAge <= 28 ? Math.floor(rng() * 2) : newAge <= 31 ? 0 : -1 - Math.floor(rng() * 2);
  // El multiplicador solo acelera/frena la mejora; el declive por edad es igual para todos.
  const growth = rawGrowth > 0 ? rawGrowth * growthMult : rawGrowth;
  const newOverall = clamp(state.overall + growth + Math.max(0, seasonStats.avgRating - 7) * 0.5, 45, state.potential);

  const newState: CareerState = {
    ...state,
    seasonNumber: state.seasonNumber + 1,
    week: 1,
    age: newAge,
    overall: Math.round(newOverall),
    reputation: clamp(state.reputation + seasonStats.trophies.length * 3 + seasonStats.individualAwards.length * 6 + Math.max(0, seasonStats.avgRating - 7) * 4, 0, 100),
    morale: clamp(60 + seasonStats.avgRating * 4, 0, 100),
    fitness: 100,
    seasonStats: { goals: 0, assists: 0, apps: 0, motm: 0 },
    totals: {
      apps: state.totals.apps + seasonStats.apps,
      goals: state.totals.goals + seasonStats.goals,
      assists: state.totals.assists + seasonStats.assists,
      motm: state.totals.motm + seasonStats.motm,
    },
    history: [...state.history, seasonStats],
    trophies: [...state.trophies, ...seasonStats.trophies],
    awards: [...state.awards, ...seasonStats.individualAwards],
    events: [],
    currentSeasonEventsRemaining: EVENTS_PER_SEASON,
    isRetired: newAge >= 38 || (newAge >= 34 && state.overall < 70),
  };

  const offers = generateOffers(rng, newState);
  return { state: newState, season: seasonStats, offers };
}

/** Aceptar oferta => actualizar contrato y equipo. */
export function acceptOffer(state: CareerState, offer: ContractOffer): CareerState {
  const contract = {
    teamId: offer.team.id, teamName: offer.team.name,
    seasonStart: state.seasonNumber, seasonEnd: state.seasonNumber + offer.contractYears - 1,
    wageWeekly: offer.wageWeekly, transferFee: offer.transferFee, releaseClause: offer.releaseClause,
  };
  return {
    ...state,
    currentTeamId: offer.team.id,
    currentTeamName: offer.team.name,
    currentLeagueId: offer.leagueId,
    contracts: [...state.contracts, contract],
  };
}

export function stayCurrentTeam(state: CareerState): CareerState {
  // Solo garantizamos que hay contrato activo; si no, generamos uno de renovación estándar.
  const active = state.contracts.some(c => c.teamId === state.currentTeamId && c.seasonEnd >= state.seasonNumber);
  if (active) return state;
  const team = getAllLeagues().flatMap(l => l.teams).find(t => t.id === state.currentTeamId)!;
  return {
    ...state,
    contracts: [...state.contracts, {
      teamId: team.id, teamName: team.name,
      seasonStart: state.seasonNumber, seasonEnd: state.seasonNumber + 2,
      wageWeekly: Math.round(team.wageCeiling * clamp((state.overall - 60) / 30, 0.3, 1.2)),
      transferFee: 0,
    }],
  };
}

// Re-export EVENT_TEMPLATES para consumo desde UI si hace falta buscar por key.
export { EVENT_TEMPLATES };
export type { ContractOffer };
