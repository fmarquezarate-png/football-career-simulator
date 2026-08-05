import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Regla única de decimales del juego: **como mucho uno**, y ninguno si el
 * número es entero. Nada de «62.5000000001» ni de «7.40».
 *
 * Se usa en toda la interfaz; el motor además redondea en origen para que los
 * valores guardados tampoco arrastren cola decimal.
 */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Formatea un número para mostrarlo: máximo un decimal, sin ceros de relleno. */
export function fmt(n: number): string {
  const r = round1(n);
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Igual que `fmt` pero con signo explícito, para deltas. */
export function fmtDelta(n: number): string {
  const r = round1(n);
  return `${r >= 0 ? "+" : ""}${Number.isInteger(r) ? r : r.toFixed(1)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(round1(n));
}

export function formatMoney(n: number): string {
  if (n >= 1_000_000) return `${fmt(n / 1_000_000)}M €`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k €`;
  return `${Math.round(n)} €`;
}
