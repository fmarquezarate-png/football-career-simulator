import type {
  AppliedEventOutcome, CareerSeasonStats, CareerState, Difficulty, EventTemplate,
  Position, PreferredFoot,
} from "../data/types";
import { getLeague, getAllLeagues, getTeam, findTeamByName } from "../data/loader";
import { DIFFICULTY_PROFILES } from "../data/difficulty";
import { assignStartingClub, leagueStrength, type ClubTier } from "./clubAssignment";
import { makeRng, clamp, normal, type Rng } from "./rng";
import { round1 } from "../utils";
import { penaltyOutcomeEffects, type PenaltyContext, type PenaltyResult } from "./penalty";
import {
  applyOverallDeltaToAttributes, capToPotential, evolveAttributes,
  initialAttributes, overallFromAttributes,
} from "./attributes";
import { simulatePlayerSeason } from "./playerPerformance";
import { applyChoice, EVENT_MEMORY, EVENT_TEMPLATES, pickSeasonEvents } from "./events";
import { computeAwards } from "./awards";
import { simulateNationalTeam } from "./nationalTeam";
import { generateOffers, type ContractOffer } from "./contracts";

/**
 * Decisiones por temporada. Cinco mantiene el ritmo: suficientes para que la
 * temporada tenga forma, pocas como para que cada una pese.
 */
export const EVENTS_PER_SEASON = 5;

export interface NewCareerParams {
  playerName: string;
  nationality: string;
  position: Position;
  preferredFoot: PreferredFoot;
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
  const { team, league, tier } = assignStartingClub(rng, params.difficulty, params.nationality);
  const targetOverall = clamp(profile.startOverall + Math.floor(rng() * 6), 45, 85);
  // El OVR sale de los atributos, no al revés: así cualquier cambio posterior
  // en un atributo se refleja en la media.
  const attributes = initialAttributes(params.position, targetOverall, rng, params.preferredFoot);
  const startOverall = overallFromAttributes(attributes, params.position);
  return {
    playerName: params.playerName,
    nationality: params.nationality,
    position: params.position,
    preferredFoot: params.preferredFoot,
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
    attributes,
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

/**
 * Recupera una carrera guardada con un catálogo de ligas anterior.
 *
 * Al pasar de 5 a 33 ligas los identificadores de equipo cambiaron, así que
 * una partida vieja apunta a clubes que ya no existen y el panel reventaría al
 * no encontrarlos. Se reasigna por nombre y, si tampoco cuadra, al club más
 * parecido en nivel dentro de la liga del jugador.
 */
function sanitizeNumbers(state: CareerState): CareerState {
  return {
    ...state,
    overall: Math.round(state.overall),
    potential: Math.round(state.potential),
    morale: Math.round(state.morale),
    reputation: Math.round(state.reputation),
    fitness: Math.round(state.fitness),
  };
}

export function migrateCareer(state: CareerState): CareerState {
  const needsRounding = [state.overall, state.morale, state.reputation, state.fitness]
    .some(v => !Number.isInteger(v));
  if (getTeam(state.currentTeamId)) {
    return needsRounding ? sanitizeNumbers(state) : state;
  }

  const byName = findTeamByName(state.currentTeamName);
  const target = byName ?? (() => {
    const league = getLeague(state.currentLeagueId) ?? getAllLeagues()[0];
    const team = [...league.teams].sort(
      (a, b) => Math.abs(a.overall - state.overall) - Math.abs(b.overall - state.overall),
    )[0];
    return { league, team };
  })();

  return {
    ...sanitizeNumbers(state),
    currentTeamId: target.team.id,
    currentTeamName: target.team.name,
    currentLeagueId: target.league.id,
    // El histórico conserva los nombres; solo se reapuntan los identificadores
    // para que los escudos vuelvan a resolverse.
    history: state.history.map(h => ({
      ...h,
      teamId: findTeamByName(h.teamName)?.team.id ?? target.team.id,
    })),
    contracts: state.contracts.map(c => ({
      ...c,
      teamId: findTeamByName(c.teamName)?.team.id ?? c.teamId,
    })),
  };
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

  // El cambio de media no se aplica al OVR directamente: se reparte entre los
  // atributos y el OVR se recalcula desde ellos.
  const attributes = capToPotential(
    applyOverallDeltaToAttributes(state.attributes, state.position, outcome.overallDelta, rng),
    state.position,
    Math.min(99, state.potential + 3),
  );

  const newState: CareerState = {
    ...state,
    attributes,
    overall: Math.round(clamp(overallFromAttributes(attributes, state.position), 45, Math.min(99, state.potential + 3))),
    morale: Math.round(clamp(state.morale + outcome.moraleDelta, 0, 100)),
    reputation: Math.round(clamp(state.reputation + outcome.reputationDelta, 0, 100)),
    fitness: Math.round(clamp(state.fitness + outcome.fitnessDelta, 20, 100)),
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

/**
 * Escala solo los deltas negativos por el factor de varianza de la dificultad.
 *
 * Redondea siempre: moral, reputación y forma son enteros (0-100) y la media
 * lleva como mucho un decimal. Sin esto, multiplicar por 1,25 dejaba moral
 * 62,5 y medias con cola decimal infinita paseándose por toda la interfaz.
 */
function amplifyDownside(o: AppliedEventOutcome, variance: number): AppliedEventOutcome {
  if (variance === 1) return o;
  const down = (v: number) => (v < 0 ? v * variance : v);
  return {
    ...o,
    goalsBoost: Math.round(down(o.goalsBoost)),
    assistsBoost: Math.round(down(o.assistsBoost)),
    moraleDelta: Math.round(down(o.moraleDelta)),
    reputationDelta: Math.round(down(o.reputationDelta)),
    overallDelta: round1(down(o.overallDelta)),
    fitnessDelta: Math.round(down(o.fitnessDelta)),
  };
}

/**
 * ¿Toca penalti decisivo esta temporada?
 *
 * Es un momento excepcional, no un evento de cada año: hace falta jugar en un
 * club con opciones y tener peso en el equipo. Cuando ocurre, el escenario se
 * elige según lo lejos que llegue tu club.
 */
export function penaltyChance(state: CareerState): PenaltyContext | null {
  if (state.position === "GK") return null;
  const team = getTeam(state.currentTeamId);
  if (!team) return null;

  const rng = makeRng(`penalty-${state.playerName}-${state.seasonNumber}`);
  const strength = leagueStrength(state.currentLeagueId);
  const tier = team.team.overall;

  // Cuanto mejor el club y más peso tengas, más probable llegar a una final.
  const base = clamp((tier - 62) / 120 + (state.reputation - 40) / 400, 0.02, 0.3);
  if (rng() > base) return null;

  const european = strength >= 70 && tier >= 76;
  const competition = european
    ? (rng() < 0.5 ? "Final de la UEFA Champions League" : "Final de la Copa nacional")
    : "Final de la Copa nacional";

  return {
    competition,
    stakes: "Tanda de penaltis, empate a todo. Te toca a ti. Sesenta mil personas conteniendo la respiración.",
    keeper: Math.round(clamp(normal(rng, tier + 4, 5), 60, 92)),
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
    breakdown: perf.breakdown,
    eventGoals: state.seasonStats.goals,
    eventAssists: state.seasonStats.assists,
  };

  const awards = computeAwards(rng, {
    seasonStats, team, leagueId: league.id, reputation: state.reputation, overall: state.overall,
  });
  seasonStats.trophies = awards.trophies;
  seasonStats.individualAwards = awards.individual;

  const nt = simulateNationalTeam(rng, state);
  Object.assign(seasonStats, nt);

  // Progresión: los atributos se mueven según lo que ha pasado en el campo.
  const newAge = state.age + 1;
  const evolved = evolveAttributes(
    state.attributes, state.position, seasonStats, newAge, state.potential, rng,
  );
  seasonStats.age = state.age;
  seasonStats.overallAfter = overallFromAttributes(evolved.attributes, state.position);
  seasonStats.attributeChanges = evolved.changes;
  // La media sale íntegramente de los atributos: no hay un segundo cálculo de
  // progresión por edad que pudiera contradecirlos.
  const newOverall = seasonStats.overallAfter!;

  const newState: CareerState = {
    ...state,
    seasonNumber: state.seasonNumber + 1,
    week: 1,
    age: newAge,
    attributes: evolved.attributes,
    overall: Math.round(newOverall),
    reputation: Math.round(clamp(state.reputation + seasonStats.trophies.length * 3 + seasonStats.individualAwards.length * 6 + Math.max(0, seasonStats.avgRating - 7) * 4, 0, 100)),
    morale: Math.round(clamp(60 + seasonStats.avgRating * 4, 0, 100)),
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

/** Traslada el desenlace del penalti decisivo al estado de la carrera. */
export function applyPenalty(state: CareerState, result: PenaltyResult): CareerState {
  const e = penaltyOutcomeEffects(result);
  return {
    ...state,
    seasonStats: { ...state.seasonStats, goals: state.seasonStats.goals + (e.goals ?? 0) },
    reputation: clamp(state.reputation + (e.reputation ?? 0), 0, 100),
    morale: clamp(state.morale + (e.morale ?? 0), 0, 100),
    penaltyTakenSeason: state.seasonNumber,
  };
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
