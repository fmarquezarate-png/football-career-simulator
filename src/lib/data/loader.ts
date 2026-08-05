import type { League, LeagueIndexEntry, NationalTeam } from "./types";
import leagueIndexJson from "../../../public/data/leagues/index.json";
import nationalTeamsJson from "../../../public/data/national-teams.json";

// Europa
import en1 from "../../../public/data/leagues/en1.json";
import es1 from "../../../public/data/leagues/es1.json";
import it1 from "../../../public/data/leagues/it1.json";
import de1 from "../../../public/data/leagues/de1.json";
import fr1 from "../../../public/data/leagues/fr1.json";
import pt1 from "../../../public/data/leagues/pt1.json";
import nl1 from "../../../public/data/leagues/nl1.json";
import tr1 from "../../../public/data/leagues/tr1.json";
import be1 from "../../../public/data/leagues/be1.json";
import at1 from "../../../public/data/leagues/at1.json";
import ch1 from "../../../public/data/leagues/ch1.json";
import gr1 from "../../../public/data/leagues/gr1.json";
import sco1 from "../../../public/data/leagues/sco1.json";
import cz1 from "../../../public/data/leagues/cz1.json";
import dk1 from "../../../public/data/leagues/dk1.json";
import pl1 from "../../../public/data/leagues/pl1.json";
import hr1 from "../../../public/data/leagues/hr1.json";
import ua1 from "../../../public/data/leagues/ua1.json";
import rs1 from "../../../public/data/leagues/rs1.json";
import no1 from "../../../public/data/leagues/no1.json";
import se1 from "../../../public/data/leagues/se1.json";
import ro1 from "../../../public/data/leagues/ro1.json";
import il1 from "../../../public/data/leagues/il1.json";
import bg1 from "../../../public/data/leagues/bg1.json";

// Resto del mundo
import br1 from "../../../public/data/leagues/br1.json";
import ar1 from "../../../public/data/leagues/ar1.json";
import mx1 from "../../../public/data/leagues/mx1.json";
import sa1 from "../../../public/data/leagues/sa1.json";
import us1 from "../../../public/data/leagues/us1.json";
import jp1 from "../../../public/data/leagues/jp1.json";
import co1 from "../../../public/data/leagues/co1.json";
import cl1 from "../../../public/data/leagues/cl1.json";
import uy1 from "../../../public/data/leagues/uy1.json";

const LEAGUE_MAP: Record<string, League> = {
  en1, es1, it1, de1, fr1, pt1, nl1, tr1, be1, at1, ch1, gr1, sco1,
  cz1, dk1, pl1, hr1, ua1, rs1, no1, se1, ro1, il1, bg1,
  br1, ar1, mx1, sa1, us1, jp1, co1, cl1, uy1,
} as unknown as Record<string, League>;

export const LEAGUES_INDEX: LeagueIndexEntry[] = leagueIndexJson as unknown as LeagueIndexEntry[];

export const LEAGUE_IDS: string[] = Object.keys(LEAGUE_MAP);

export function getLeague(id: string): League | null {
  return LEAGUE_MAP[id] ?? null;
}

export function getAllLeagues(): League[] {
  return Object.values(LEAGUE_MAP);
}

/** Fuerza de la liga (0-100). Gobierna el salto entre competiciones. */
export function leagueStrength(id: string): number {
  return LEAGUES_INDEX.find(l => l.id === id)?.strength ?? 60;
}

const TEAM_INDEX = new Map<string, { league: League; team: League["teams"][number] }>();
for (const league of getAllLeagues()) {
  for (const team of league.teams) TEAM_INDEX.set(team.id, { league, team });
}

export function getTeam(teamId: string): { league: League; team: League["teams"][number] } | null {
  return TEAM_INDEX.get(teamId) ?? null;
}

/**
 * Busca un equipo por nombre. Sirve para recuperar carreras guardadas con un
 * catálogo de ligas anterior, cuyos identificadores ya no existen.
 */
export function findTeamByName(name: string): { league: League; team: League["teams"][number] } | null {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const target = norm(name);
  for (const entry of TEAM_INDEX.values()) {
    if (norm(entry.team.name) === target) return entry;
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
