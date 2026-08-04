/**
 * Nacionalidades jugables: los 205 países de `countries.ts` con su pool de
 * nombres resuelto (override por país si existe, si no el pool regional).
 */
import { COUNTRIES, findCountry, type Country } from "./countries";
import { COUNTRY_POOLS, REGION_POOLS, type NamePool } from "./namePools";

export interface Nationality extends Country, NamePool {}

export const NATIONALITIES: Nationality[] = COUNTRIES.map(c => ({
  ...c,
  ...(COUNTRY_POOLS[c.code] ?? REGION_POOLS[c.region]),
}));

/** Lista ligera para selects (sin los pools de nombres). */
export const NATIONALITY_OPTIONS = COUNTRIES.map(({ id, name, code }) => ({ id, name, code }));

export function findNationality(codeOrId: string): Nationality {
  const c = findCountry(codeOrId);
  return { ...c, ...(COUNTRY_POOLS[c.code] ?? REGION_POOLS[c.region]) };
}

export { COUNTRIES, findCountry };
export type { Country };
