import type { Difficulty } from "./types";

/**
 * Cada nivel de dificultad mueve tres palancas del motor:
 *  - `startOverall` / `potentialBonus`: con qué material arrancas.
 *  - `clubTierWeights`: probabilidad de debutar en un club de cada franja.
 *     [élite, grande, media, modesto] — el club NO se elige, se sortea.
 *  - `growthMultiplier` / `eventVariance`: cuánto progresas y cuánto castigan
 *     las malas decisiones.
 */
export interface DifficultyProfile {
  id: Difficulty;
  label: string;
  tagline: string;
  startOverall: number;
  potentialBonus: number;
  clubTierWeights: [number, number, number, number];
  growthMultiplier: number;
  eventVariance: number;
  bullets: string[];
  accent: string;
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: {
    id: "easy",
    label: "Promesa de oro",
    tagline: "Debutas ya hecho y en un grande",
    startOverall: 72,
    potentialBonus: 8,
    clubTierWeights: [45, 35, 17, 3],
    growthMultiplier: 1.25,
    eventVariance: 0.75,
    bullets: [
      "Media inicial ~72-77, potencial alto garantizado",
      "80% de opciones de debutar en un club élite o grande",
      "Progresas un 25% más rápido cada temporada",
      "Las decisiones malas penalizan menos",
    ],
    accent: "text-emerald-400",
  },
  normal: {
    id: "normal",
    label: "Canterano",
    tagline: "El camino realista de un chaval con talento",
    startOverall: 65,
    potentialBonus: 4,
    clubTierWeights: [12, 30, 40, 18],
    growthMultiplier: 1,
    eventVariance: 1,
    bullets: [
      "Media inicial ~65-70, potencial variable",
      "Lo normal es empezar en un club medio de una liga top",
      "Progresión estándar: dependes de minutos y rendimiento",
      "Las decisiones pesan tal cual las calcula el motor",
    ],
    accent: "text-sky-400",
  },
  hard: {
    id: "hard",
    label: "Sin padrinos",
    tagline: "Nadie te regala nada: te toca reventar la puerta",
    startOverall: 58,
    potentialBonus: 0,
    clubTierWeights: [2, 12, 36, 50],
    growthMultiplier: 0.82,
    eventVariance: 1.25,
    bullets: [
      "Media inicial ~58-63, potencial sin bonus",
      "Casi siempre debutas en un club modesto o de mitad de tabla",
      "Progresas un 18% más lento: cada temporada cuenta",
      "Los errores duelen más (lesiones, moral, reputación)",
    ],
    accent: "text-amber-400",
  },
  legendary: {
    id: "legendary",
    label: "Leyenda",
    tagline: "Del filial al Balón de Oro, o nada",
    startOverall: 52,
    potentialBonus: -3,
    clubTierWeights: [0, 4, 21, 75],
    growthMultiplier: 0.7,
    eventVariance: 1.5,
    bullets: [
      "Media inicial ~52-57, el potencial puede quedarse corto",
      "Debutas prácticamente siempre en la zona baja de la tabla",
      "Progresión muy lenta: necesitas temporadas sobresalientes",
      "Máxima varianza: una mala racha puede hundir la carrera",
    ],
    accent: "text-rose-400",
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "normal", "hard", "legendary"];
