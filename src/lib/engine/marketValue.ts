import type { CareerState } from "../data/types";
import { leagueStrength } from "../data/loader";

/**
 * Valor de mercado del jugador.
 *
 * Crece de forma muy no lineal con la media —de 70 a 80 no es el mismo salto
 * que de 85 a 95— y se hunde con la edad a partir de los 29. La liga importa:
 * el mismo futbolista vale bastante más en la Premier que en Primera División
 * de Chile, porque ahí es donde está el dinero que lo puede pagar.
 */
export function marketValue(state: CareerState): number {
  const base = Math.pow(Math.max(state.overall - 42, 1), 3.05) * 42;

  const ageFactor =
    state.age <= 20 ? 1.35
    : state.age <= 24 ? 1.25
    : state.age <= 27 ? 1.1
    : state.age <= 29 ? 0.9
    : state.age <= 31 ? 0.62
    : state.age <= 33 ? 0.38
    : state.age <= 35 ? 0.18
    : 0.07;

  const leagueFactor = 0.55 + (leagueStrength(state.currentLeagueId) / 100) * 0.75;
  const fameFactor = 0.85 + (state.reputation / 100) * 0.4;
  const potentialFactor = 1 + Math.max(0, state.potential - state.overall) * 0.012;

  return Math.round(base * ageFactor * leagueFactor * fameFactor * potentialFactor);
}

/** Formato compacto de valor: 450K, 12,5M, 105M. */
export function formatValue(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `€${m >= 100 ? Math.round(m) : Math.round(m * 10) / 10}M`;
  }
  if (v >= 1_000) return `€${Math.round(v / 1_000)}K`;
  return `€${Math.round(v)}`;
}
