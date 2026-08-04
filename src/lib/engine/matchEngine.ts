import type { Team } from "../data/types";
import { poisson, normal, clamp, type Rng } from "./rng";

const HOME_ADVANTAGE = 0.25;
const BASE_GOALS = 1.35;

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  homeXg: number;
  awayXg: number;
}

/** Poisson goals con lambda dependiente del gap de fuerza. */
export function simulateMatch(home: Team, away: Team, rng: Rng): MatchResult {
  const attHome = home.attack / 100;
  const defHome = home.defense / 100;
  const attAway = away.attack / 100;
  const defAway = away.defense / 100;

  const homeLambda = clamp(BASE_GOALS * (1 + HOME_ADVANTAGE) * (attHome / Math.max(0.5, defAway)), 0.1, 5.5);
  const awayLambda = clamp(BASE_GOALS * (attAway / Math.max(0.5, defHome)), 0.1, 5.0);

  const homeXg = normal(rng, homeLambda, 0.25);
  const awayXg = normal(rng, awayLambda, 0.25);

  return {
    homeGoals: poisson(rng, Math.max(0.1, homeXg)),
    awayGoals: poisson(rng, Math.max(0.1, awayXg)),
    homeXg,
    awayXg,
  };
}
