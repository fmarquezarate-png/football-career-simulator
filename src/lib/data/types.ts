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

export interface EventChoice {
  key: string;
  label: string;
  description: string;
  qualityBias: number;
  outcomeSummary: string;
}

export interface EventTemplate {
  key: string;
  title: string;
  description: string;
  weight: number;
  conditions?: { minSeason?: number; positions?: Position[]; minOverall?: number; maxOverall?: number };
  choices: EventChoice[];
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
}
