export type Position = "GK" | "CB" | "LB" | "RB" | "CDM" | "CM" | "CAM" | "LW" | "RW" | "ST";

export const POSITIONS: Position[] = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];

export const POSITION_LABEL: Record<Position, string> = {
  GK: "Portero",
  CB: "Central",
  LB: "Lateral izq.",
  RB: "Lateral der.",
  CDM: "Mediocentro def.",
  CM: "Mediocentro",
  CAM: "Mediocentro of.",
  LW: "Extremo izq.",
  RW: "Extremo der.",
  ST: "Delantero",
};

export type Difficulty = "easy" | "normal" | "hard" | "legendary";

export type PreferredFoot = "left" | "right" | "both";

export const FOOT_LABEL: Record<PreferredFoot, string> = {
  left: "Zurdo",
  right: "Diestro",
  both: "Ambidiestro",
};

export interface Attributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  city: string;
  overall: number;
  attack: number;
  midfield: number;
  defense: number;
  prestige: number;
  budget: number;
  wageCeiling: number;
  crest: string;
}

export interface LeagueIndexEntry {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  confederation: string;
  tier: number;
  teams: number;
  rounds: number;
  reputation: number;
  prestige: number;
  domesticCup: { id: string; name: string };
  continentalCup: string;
}

export interface League {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  season: string;
  rounds: number;
  teams: Team[];
}

export interface NationalTeam {
  id: string;
  name: string;
  code: string;
  confederation: string;
  rating: number;
}

export interface CareerSeasonStats {
  seasonNumber: number;
  teamId: string;
  teamName: string;
  leagueId: string;
  teamLeagueFinish?: number;
  apps: number;
  goals: number;
  assists: number;
  motm: number;
  avgRating: number;
  trophies: string[];
  individualAwards: string[];
  nationalTeamApps?: number;
  nationalTeamGoals?: number;
  worldCupParticipated?: string;
  /** Edad y media al cerrar la temporada, para la línea temporal de carrera. */
  age?: number;
  overallAfter?: number;
  /** Qué atributos se movieron y por qué. */
  attributeChanges?: { key: string; delta: number; reason: string }[];
}

export interface Contract {
  teamId: string;
  teamName: string;
  seasonStart: number;
  seasonEnd: number;
  wageWeekly: number;
  transferFee: number;
  releaseClause?: number;
}

export type EffectMetric =
  | "goals" | "assists" | "morale" | "reputation" | "overall" | "fitness";

/**
 * Efectos de una elección, expresados como la media (mu) de cada métrica en
 * sus propias unidades. El motor muestrea cada una de una normal, así que dos
 * jugadores con la misma decisión no obtienen lo mismo.
 *
 * La clave del diseño: casi ninguna opción es solo positiva. Una opción que
 * sube la media suele costar forma física o moral, y una que dispara la
 * reputación puede resentir el juego colectivo. No hay respuesta correcta.
 */
export type ChoiceEffects = Partial<Record<EffectMetric, number>>;

/**
 * Apuesta: la opción se juega a un sorteo antes de aplicar nada. Si sale bien
 * se aplican los `effects` de la elección; si sale mal, sus `failureEffects`.
 */
export interface ChoiceRisk {
  /** Probabilidad base de éxito, 0-1. */
  successChance: number;
  successLabel: string;
  failureLabel: string;
  /** Atributo del jugador que inclina la balanza, si aplica. */
  modifier?: "overall" | "reputation" | "morale" | "fitness";
}

export interface EventChoice {
  key: string;
  label: string;
  /** Contexto narrativo. No debe adelantar el resultado mecánico. */
  description: string;
  effects: ChoiceEffects;
  /** Solo para apuestas: qué pasa si el sorteo sale mal. */
  failureEffects?: ChoiceEffects;
  risk?: ChoiceRisk;
}

/**
 * Filtros de aparición. Cuantos más eventos condicionados haya, menos se
 * repite el repertorio entre temporadas: un canterano de 18 años y una
 * estrella de 31 ven catálogos casi disjuntos.
 */
export interface EventConditions {
  minSeason?: number;
  maxSeason?: number;
  minAge?: number;
  maxAge?: number;
  positions?: Position[];
  minOverall?: number;
  maxOverall?: number;
  minReputation?: number;
  maxReputation?: number;
  minMorale?: number;
  maxMorale?: number;
  maxFitness?: number;
  /** Franja del club actual. */
  tiers?: ("elite" | "grande" | "media" | "modesto")[];
  /** Requiere haber ganado algo. */
  minTrophies?: number;
}

export interface EventTemplate {
  key: string;
  title: string;
  description: string;
  weight: number;
  conditions?: EventConditions;
  choices: EventChoice[];
}

/** Resultado del sorteo de una elección arriesgada, para poder animarlo. */
export interface RollResult {
  /** Probabilidad efectiva de éxito ya ajustada por los atributos, 0-1. */
  successChance: number;
  /** Valor sorteado, 0-1. Éxito si es menor que `successChance`. */
  rolled: number;
  success: boolean;
  label: string;
}

export interface AppliedEventOutcome {
  eventKey: string;
  choiceKey: string;
  choiceLabel: string;
  goalsBoost: number;
  assistsBoost: number;
  moraleDelta: number;
  reputationDelta: number;
  overallDelta: number;
  fitnessDelta: number;
  message: string;
  roll?: RollResult;
}

export interface GeneratedPlayer {
  id: string;
  name: string;
  position: Position;
  nationality: string;
  age: number;
  overall: number;
}

export interface CareerState {
  id?: string;
  playerName: string;
  nationality: string;
  position: Position;
  preferredFoot: PreferredFoot;
  difficulty: Difficulty;
  currentTeamId: string;
  currentTeamName: string;
  currentLeagueId: string;
  /** Franja del club sorteado al debutar (solo informativo). */
  startingTier?: "elite" | "grande" | "media" | "modesto";
  age: number;
  overall: number;
  potential: number;
  reputation: number;
  morale: number;
  fitness: number;
  seasonNumber: number;
  week: number;
  isRetired: boolean;
  attributes: Attributes;
  totals: { goals: number; assists: number; apps: number; motm: number };
  seasonStats: { goals: number; assists: number; apps: number; motm: number };
  history: CareerSeasonStats[];
  contracts: Contract[];
  events: AppliedEventOutcome[];
  awards: string[];
  trophies: string[];
  currentSeasonEventsRemaining: number;
  /**
   * Claves de los últimos eventos vividos, para no repetirlos temporada tras
   * temporada. Se poda a los ~24 más recientes.
   */
  recentEventKeys?: string[];
}
