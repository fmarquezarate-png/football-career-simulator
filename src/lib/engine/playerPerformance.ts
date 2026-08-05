import type { Position, Team } from "../data/types";
import { normal, poisson, clamp, type Rng } from "./rng";
import { round1 } from "../utils";

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

/**
 * Un factor del rendimiento, ya traducido a lenguaje humano.
 * `multiplier` es lo que ese factor multiplica sobre la expectativa neutra, y
 * `goalsDelta` / `assistsDelta` cuántos goles y asistencias suma o resta.
 */
export interface PerformanceFactor {
  key: string;
  label: string;
  detail: string;
  multiplier: number;
  goalsDelta: number;
  assistsDelta: number;
}

export interface PerformanceBreakdown {
  /** Goles y asistencias que el modelo esperaba antes del azar. */
  expectedGoals: number;
  expectedAssists: number;
  /** Partidos posibles y probabilidad de ser titular. */
  leagueRounds: number;
  startingProb: number;
  factors: PerformanceFactor[];
  /** Cuánto se desvió el resultado real de lo esperado, por el azar. */
  luckGoals: number;
  luckAssists: number;
  ratingBase: number;
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
  breakdown: PerformanceBreakdown;
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
  // Un decimal desde el motor: la nota se muestra en varios sitios y no
  // tiene sentido guardar precisión que nunca se enseña.
  const avgRating = round1(clamp(normal(rng, ratingMu, 0.15), 5.5, 9.5));

  // Clasificación del equipo (1 = campeón).
  const finishNoise = normal(rng, 0, 1.5);
  const rankRaw = clamp(10 - leagueGap * 0.6 + finishNoise, 1, 20);
  const teamLeagueFinish = Math.round(rankRaw);

  // ---- Desglose explicativo -------------------------------------------
  // goalsMu es un producto de factores. La aportación de cada uno se mide
  // contra una REFERENCIA, no contra 1: comparar con "factor 1" haría que
  // cualquier jugador por debajo de media 90 apareciera restando goles, que es
  // cierto en la fórmula pero absurdo de leer. La referencia es un titular
  // habitual de nivel medio, así que el desglose responde a la pregunta real:
  // ¿esto me sumó o me restó respecto a un futbolista normal?
  const minutesFactor = apps / leagueRounds;
  const REF_SKILL = 0.67;    // media ~80
  const REF_MORALE = 1.0;    // moral 80
  const REF_MINUTES = 0.75;  // titular que se pierde algún partido

  const contribution = (mu: number, f: number, ref: number) =>
    f === 0 ? 0 : mu - (mu * ref) / f;

  const factors: PerformanceFactor[] = [
    {
      key: "team",
      label: "Ataque de tu equipo",
      detail: `${team.name} marcó ${teamGoalsFor} goles`,
      multiplier: 1,
      goalsDelta: 0,
      assistsDelta: 0,
    },
    {
      key: "position",
      label: "Peso de tu posición",
      detail: `Un ${position} participa en el ${Math.round(positionGoalShare * 100)}% de los goles`,
      multiplier: 1,
      goalsDelta: 0,
      assistsDelta: 0,
    },
    {
      key: "skill",
      label: "Tu nivel",
      detail: `Media ${overall} · frente a un jugador de nivel medio`,
      multiplier: round1(skillFactor / REF_SKILL),
      goalsDelta: round1(contribution(goalsMu, skillFactor, REF_SKILL)),
      assistsDelta: round1(contribution(assistsMu, skillFactor, REF_SKILL)),
    },
    {
      key: "morale",
      label: "Moral",
      detail: `${Math.round(moralePct)}/100`,
      multiplier: round1(moraleFactor / REF_MORALE),
      goalsDelta: round1(contribution(goalsMu, moraleFactor, REF_MORALE)),
      assistsDelta: round1(contribution(assistsMu, moraleFactor, REF_MORALE)),
    },
    {
      key: "minutes",
      label: "Minutos jugados",
      detail: `${apps} de ${leagueRounds} partidos · frente a un titular habitual`,
      multiplier: round1(minutesFactor / REF_MINUTES),
      goalsDelta: round1(contribution(goalsMu, minutesFactor, REF_MINUTES)),
      assistsDelta: round1(contribution(assistsMu, minutesFactor, REF_MINUTES)),
    },
    {
      key: "fitness",
      label: "Forma física",
      detail: `${Math.round(fitnessPct)}/100 · condiciona cuántos partidos aguantas`,
      multiplier: round1(fitnessPct / 100),
      goalsDelta: 0,
      assistsDelta: 0,
    },
  ];

  const breakdown: PerformanceBreakdown = {
    expectedGoals: round1(goalsMu),
    expectedAssists: round1(assistsMu),
    leagueRounds,
    startingProb,
    factors,
    luckGoals: round1(goals - goalsMu),
    luckAssists: round1(assists - assistsMu),
    ratingBase: round1(ratingMu),
  };

  return {
    apps, goals, assists, motm, avgRating, teamLeagueFinish,
    teamGoalsFor, teamGoalsAgainst, breakdown,
  };
}
