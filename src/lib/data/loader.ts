import type { League, LeagueIndexEntry, NationalTeam } from "./types";
import leagueIndexJson from "../../../public/data/leagues/index.json";
import es1 from "../../../public/data/leagues/es1.json";
import en1 from "../../../public/data/leagues/en1.json";
import de1 from "../../../public/data/leagues/de1.json";
import it1 from "../../../public/data/leagues/it1.json";
import fr1 from "../../../public/data/leagues/fr1.json";
import nationalTeamsJson from "../../../public/data/national-teams.json";

const LEAGUE_MAP: Record<string, League> = {
  es1: es1 as League,
  en1: en1 as League,
  de1: de1 as League,
  it1: it1 as League,
  fr1: fr1 as League,
};

export const LEAGUES_INDEX: LeagueIndexEntry[] = leagueIndexJson as LeagueIndexEntry[];

export function getLeague(id: string): League | null {
  return LEAGUE_MAP[id] ?? null;
}

export function getAllLeagues(): League[] {
  return Object.values(LEAGUE_MAP);
}

export function getTeam(teamId: string): { league: League; team: League["teams"][number] } | null {
  for (const league of getAllLeagues()) {
    const team = league.teams.find(t => t.id === teamId);
    if (team) return { league, team };
  }
  return null;
}

export const NATIONAL_TEAMS: NationalTeam[] = (nationalTeamsJson as { teams: NationalTeam[] }).teams;

export function getNationalTeam(id: string): NationalTeam | null {
  return NATIONAL_TEAMS.find(t => t.id === id) ?? null;
}

export function flagUrl(code: string, size: 40 | 80 | 160 | 320 = 80): string {
  return `https://flagcdn.com/w${size}/${code}.png`;
}

export function flagSvgUrl(code: string): string {
  return `https://flagcdn.com/${code}.svg`;
}
