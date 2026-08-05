import type { CareerState } from "../data/types";
import { clamp, type Rng } from "./rng";

/**
 * El penalti decisivo.
 *
 * No es un evento narrativo más: aquí el jugador elige **dónde y cómo** tirar,
 * y el portero elige a la vez. Se resuelven en paralelo, como en la realidad.
 *
 * - Los palos son más difíciles de parar pero más fáciles de fallar fuera.
 * - El centro casi nunca lo para el portero si se tira, pero se lo comen los
 *   que se quedan quietos.
 * - La potencia añade gol y resta precisión; la colocación al revés.
 * - Tu tiro, tu moral y la presión del escenario mueven la aguja.
 */

export type PenaltyZone = "left" | "center" | "right";
export type PenaltyPower = "placed" | "power" | "panenka";

export interface PenaltyOption {
  zone: PenaltyZone;
  power: PenaltyPower;
  label: string;
  description: string;
}

export interface PenaltyContext {
  /** Competición y momento, para el relato. */
  competition: string;
  stakes: string;
  /** Nivel del portero rival, 0-100. */
  keeper: number;
}

export interface PenaltyResult {
  scored: boolean;
  /** Dónde adivinó el portero. */
  keeperGuess: PenaltyZone;
  /** Falló por fuera en vez de parada. */
  missedTarget: boolean;
  headline: string;
  detail: string;
}

export const PENALTY_ZONES: { zone: PenaltyZone; label: string }[] = [
  { zone: "left", label: "A su izquierda" },
  { zone: "center", label: "Por el centro" },
  { zone: "right", label: "A su derecha" },
];

export const PENALTY_POWERS: { power: PenaltyPower; label: string; description: string }[] = [
  { power: "placed", label: "Colocado", description: "Ajustado al palo. Difícil de parar si va bien." },
  { power: "power", label: "Con todo", description: "Potencia máxima. Si entra, no hay portero." },
  { power: "panenka", label: "Panenka", description: "A lo Panenka. Gloria o ridículo." },
];

/** Probabilidad de marcar con cada combinación, ya ajustada al jugador. */
export function penaltyOdds(
  zone: PenaltyZone, power: PenaltyPower, state: CareerState, ctx: PenaltyContext,
): { scoreChance: number; onTarget: number } {
  // Precisión: por el centro es casi imposible fallar la portería; a los
  // palos, cuanto más fuerte le pegues, más fácil es irse fuera.
  const onTargetBase = zone === "center" ? 0.95 : 0.86;
  const powerAccuracy = { placed: 0.02, power: -0.08, panenka: -0.05 }[power];

  const skill = (state.attributes.shooting - 70) / 100;
  const nerves = (state.morale - 60) / 400;

  const onTarget = clamp(onTargetBase + powerAccuracy + skill * 0.25 + nerves, 0.55, 0.99);

  // Si el portero acierta la dirección, ¿la para?
  // Por el centro sí, y con creces: ahí es donde tiene el cuerpo. Ese es el
  // precio de la zona más fácil de acertar, y lo que evita que tirar al medio
  // sea siempre la mejor opción.
  const savableIfGuessed = zone === "center"
    ? { placed: 0.8, power: 0.55, panenka: 0.9 }[power]
    : { placed: 0.5, power: 0.25, panenka: 0.65 }[power];

  const keeperFactor = clamp(ctx.keeper / 100, 0.4, 1);
  // Los porteros se tiran a un palo dos de cada tres veces, pero quedarse
  // quieto es más habitual de lo que parece.
  const guessChance = zone === "center" ? 0.3 : 0.36;

  const savedChance = guessChance * savableIfGuessed * keeperFactor;
  const scoreChance = clamp(onTarget * (1 - savedChance), 0.15, 0.97);

  return { scoreChance, onTarget };
}

export function shootPenalty(
  rng: Rng, zone: PenaltyZone, power: PenaltyPower,
  state: CareerState, ctx: PenaltyContext,
): PenaltyResult {
  const { onTarget } = penaltyOdds(zone, power, state, ctx);

  // 1) El portero elige lado, sin saber el tuyo.
  const r = rng();
  const keeperGuess: PenaltyZone = r < 0.35 ? "left" : r < 0.7 ? "right" : "center";

  // 2) ¿Va entre los tres palos?
  if (rng() > onTarget) {
    return {
      scored: false, keeperGuess, missedTarget: true,
      headline: power === "panenka" ? "La picas fuera." : "La mandas fuera.",
      detail: zone === "center"
        ? "Se te va por encima del larguero. El estadio entero se lleva las manos a la cabeza."
        : "Se te marcha rozando el palo. Ni el portero se lo cree.",
    };
  }

  // 3) Si adivinó el lado, puede pararla.
  if (keeperGuess === zone) {
    const savable = zone === "center"
      ? { placed: 0.8, power: 0.55, panenka: 0.9 }[power]
      : { placed: 0.5, power: 0.25, panenka: 0.65 }[power];
    if (rng() < savable * clamp(ctx.keeper / 100, 0.4, 1)) {
      return {
        scored: false, keeperGuess, missedTarget: false,
        headline: "¡La para!",
        detail: power === "panenka"
          ? "Se queda quieto y la atrapa sin moverse. El ridículo es absoluto."
          : "Adivina el lado y llega. Se hace enorme.",
      };
    }
  }

  return {
    scored: true, keeperGuess, missedTarget: false,
    headline: "¡GOL!",
    detail:
      power === "panenka" ? "Se tira antes de tiempo y la ves caer mansa en el centro de la portería. Locura."
      : keeperGuess === zone ? "Adivina el lado pero no llega. Ajustadísimo."
      : "Se va al otro lado. La red se infla.",
  };
}

/** Efectos sobre la carrera del penalti decisivo. */
export function penaltyOutcomeEffects(result: PenaltyResult) {
  return result.scored
    ? { goals: 1, reputation: 18, morale: 15, overall: 0.5 }
    : { reputation: -12, morale: -20, overall: -0.4 };
}
