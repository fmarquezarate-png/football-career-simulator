"use client";
import type { CareerState } from "../data/types";

const KEY = "fcs.career.v2";

export function loadLocalCareer(): CareerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CareerState) : null;
  } catch {
    return null;
  }
}

export function saveLocalCareer(state: CareerState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearLocalCareer(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
