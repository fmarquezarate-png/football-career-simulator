import type { Attributes, CareerSeasonStats, Position } from "../data/types";
import { clamp, normal, type Rng } from "./rng";

/**
 * Los atributos dejan de ser decorativos: son la fuente de la que sale el OVR
 * y evolucionan con lo que pasa en la carrera.
 *
 * - Cada decisión con efecto sobre la media reparte ese cambio entre los
 *   atributos del jugador, cargando más en los que definen su puesto.
 * - Cada temporada, el rendimiento real (goles, asistencias, partidos) empuja
 *   los atributos concretos que ese rendimiento entrena.
 * - La edad muerde: primero la velocidad, más tarde el físico.
 */

export const ATTRIBUTE_KEYS = [
  "pace", "shooting", "passing", "dribbling", "defending", "physical",
] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export const ATTRIBUTE_LABEL: Record<AttributeKey, string> = {
  pace: "Velocidad",
  shooting: "Tiro",
  passing: "Pase",
  dribbling: "Regate",
  defending: "Defensa",
  physical: "Físico",
};

/**
 * Peso de cada atributo en la media, por posición. Suman 1.
 * Un central con tiro 80 no es mejor central; un delantero con tiro 80, sí.
 */
const WEIGHTS: Record<Position, Record<AttributeKey, number>> = {
  GK:  { pace: 0.05, shooting: 0.02, passing: 0.13, dribbling: 0.05, defending: 0.55, physical: 0.20 },
  CB:  { pace: 0.12, shooting: 0.03, passing: 0.12, dribbling: 0.05, defending: 0.42, physical: 0.26 },
  LB:  { pace: 0.24, shooting: 0.05, passing: 0.18, dribbling: 0.13, defending: 0.26, physical: 0.14 },
  RB:  { pace: 0.24, shooting: 0.05, passing: 0.18, dribbling: 0.13, defending: 0.26, physical: 0.14 },
  CDM: { pace: 0.10, shooting: 0.07, passing: 0.26, dribbling: 0.12, defending: 0.28, physical: 0.17 },
  CM:  { pace: 0.12, shooting: 0.13, passing: 0.31, dribbling: 0.20, defending: 0.14, physical: 0.10 },
  CAM: { pace: 0.13, shooting: 0.22, passing: 0.28, dribbling: 0.27, defending: 0.03, physical: 0.07 },
  LW:  { pace: 0.26, shooting: 0.22, passing: 0.16, dribbling: 0.28, defending: 0.02, physical: 0.06 },
  RW:  { pace: 0.26, shooting: 0.22, passing: 0.16, dribbling: 0.28, defending: 0.02, physical: 0.06 },
  ST:  { pace: 0.20, shooting: 0.38, passing: 0.09, dribbling: 0.16, defending: 0.01, physical: 0.16 },
};

/** Media global derivada de los atributos y el puesto. */
export function overallFromAttributes(attrs: Attributes, position: Position): number {
  const w = WEIGHTS[position];
  let sum = 0;
  for (const k of ATTRIBUTE_KEYS) sum += attrs[k] * w[k];
  return Math.round(clamp(sum, 40, 99));
}

/**
 * Atributos iniciales coherentes con una media objetivo: se parte del perfil
 * del puesto y se escala hasta que el OVR calculado coincide con `targetOverall`.
 */
export function initialAttributes(
  position: Position, targetOverall: number, rng: Rng, preferredFoot: "left" | "right" | "both",
): Attributes {
  const w = WEIGHTS[position];
  const attrs = {} as Attributes;

  for (const k of ATTRIBUTE_KEYS) {
    // Los atributos clave del puesto arrancan por encima de la media del jugador.
    const emphasis = (w[k] - 1 / ATTRIBUTE_KEYS.length) * 42;
    attrs[k] = clamp(Math.round(normal(rng, targetOverall + emphasis, 4)), 30, 92);
  }

  // Los ambidiestros pagan un poco de regate especializado a cambio de versatilidad.
  if (preferredFoot === "both") {
    attrs.dribbling = clamp(attrs.dribbling - 2, 30, 92);
    attrs.passing = clamp(attrs.passing + 3, 30, 92);
  }

  // Ajuste fino para que el OVR resultante case con el objetivo.
  for (let i = 0; i < 40; i++) {
    const diff = targetOverall - overallFromAttributes(attrs, position);
    if (diff === 0) break;
    const step = Math.sign(diff);
    for (const k of ATTRIBUTE_KEYS) attrs[k] = clamp(attrs[k] + step, 30, 95);
  }
  return attrs;
}

/**
 * Frena los atributos para que la media derivada nunca supere el techo del
 * jugador. Sin esto los eventos empujan los atributos indefinidamente y el
 * potencial deja de significar nada.
 */
export function capToPotential(
  attrs: Attributes, position: Position, cap: number,
): Attributes {
  let out = attrs;
  for (let i = 0; i < 30; i++) {
    const over = overallFromAttributes(out, position) - cap;
    if (over <= 0) break;
    const next = { ...out };
    for (const k of ATTRIBUTE_KEYS) next[k] = Math.max(25, next[k] - 1);
    out = next;
  }
  return out;
}

/**
 * Reparte el cambio de media de una decisión entre los atributos.
 * El 60% va a los atributos que definen el puesto y el resto se reparte,
 * con algo de ruido para que dos carreras no evolucionen igual.
 */
export function applyOverallDeltaToAttributes(
  attrs: Attributes, position: Position, overallDelta: number, rng: Rng,
): Attributes {
  if (overallDelta === 0) return attrs;
  const w = WEIGHTS[position];
  const next = { ...attrs };

  for (const k of ATTRIBUTE_KEYS) {
    const share = 0.6 * w[k] + 0.4 / ATTRIBUTE_KEYS.length;
    // El delta se multiplica por 6 porque un punto de media son varios de atributo.
    next[k] = clamp(next[k] + normal(rng, overallDelta * share * 6, 0.6), 25, 99);
  }
  for (const k of ATTRIBUTE_KEYS) next[k] = Math.round(next[k]);
  return next;
}

/**
 * Evolución de fin de temporada: el rendimiento entrena lo que se usa, y la
 * edad pasa factura. Devuelve los atributos y el desglose de qué los movió,
 * para poder enseñárselo al jugador.
 */
export function evolveAttributes(
  attrs: Attributes,
  position: Position,
  season: CareerSeasonStats,
  age: number,
  potential: number,
  rng: Rng,
): { attributes: Attributes; changes: { key: AttributeKey; delta: number; reason: string }[] } {
  const next = { ...attrs };
  const changes: { key: AttributeKey; delta: number; reason: string }[] = [];

  const bump = (key: AttributeKey, delta: number, reason: string) => {
    if (Math.abs(delta) < 0.5) return;
    const before = next[key];
    next[key] = Math.round(clamp(next[key] + delta, 25, 99));
    const real = next[key] - before;
    if (real !== 0) changes.push({ key, delta: real, reason });
  };

  const apps = Math.max(season.apps, 1);
  const per90Goals = season.goals / apps;
  const per90Assists = season.assists / apps;

  // Lo que se practica, mejora.
  if (per90Goals > 0.35) bump("shooting", normal(rng, 1.8, 0.5), "Temporada goleadora");
  else if (season.apps > 20 && per90Goals < 0.08) bump("shooting", normal(rng, -0.9, 0.4), "Pocos goles para tus minutos");

  if (per90Assists > 0.22) bump("passing", normal(rng, 1.6, 0.5), "Temporada de muchas asistencias");
  if (season.apps > 25) bump("physical", normal(rng, 1.2, 0.4), "Carga de partidos alta");
  if (season.apps < 12) bump("physical", normal(rng, -1.4, 0.4), "Pocos minutos: pierdes ritmo");

  if (season.avgRating > 7.2) bump("dribbling", normal(rng, 1.1, 0.4), "Gran nivel medio de juego");
  if (season.avgRating < 6.3 && season.apps > 15) bump("dribbling", normal(rng, -1, 0.4), "Temporada floja");

  const defensive = ["GK", "CB", "LB", "RB", "CDM"].includes(position);
  if (defensive && season.apps > 20) bump("defending", normal(rng, 1.4, 0.5), "Oficio defensivo acumulado");

  // Desarrollo juvenil: crece lo que define tu puesto, y solo mientras te
  // quede recorrido hasta el potencial.
  const headroom = potential - overallFromAttributes(next, position);
  if (age <= 23 && headroom > 0) {
    const w = WEIGHTS[position];
    for (const k of ATTRIBUTE_KEYS) {
      bump(k, normal(rng, headroom * (0.35 + w[k]) * 0.28, 0.4), `Desarrollo a los ${age}`);
    }
  }

  // La edad: primero las piernas, después el cuerpo.
  if (age >= 28) bump("pace", normal(rng, -(age - 26) * 0.7, 0.5), `La velocidad a los ${age}`);
  if (age >= 31) bump("dribbling", normal(rng, -(age - 29) * 0.5, 0.4), `Menos chispa a los ${age}`);
  if (age >= 32) bump("physical", normal(rng, -(age - 30) * 0.6, 0.5), `El desgaste a los ${age}`);

  // Tras 33 el techo también cae: ya no se sostiene el mejor nivel.
  const cap = age >= 33 ? potential - (age - 32) * 2 : potential;
  return { attributes: capToPotential(next, position, cap), changes };
}
