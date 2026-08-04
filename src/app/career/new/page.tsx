import { NewCareerForm } from "@/components/career/new-career-form";
import { getAllLeagues, LEAGUES_INDEX } from "@/lib/data/loader";
import { NATIONALITIES } from "@/lib/data/nationalities";

export default function NewCareerPage() {
  const leagues = getAllLeagues().map(l => ({
    id: l.id,
    name: l.name,
    country: l.country,
    countryCode: l.countryCode,
    teams: l.teams.map(t => ({ id: t.id, name: t.name, crest: t.crest, overall: t.overall })),
  }));
  return (
    <main className="pitch-bg min-h-dvh">
      <div className="container max-w-2xl py-8">
        <h1 className="text-3xl font-black mb-2">Empieza tu carrera</h1>
        <p className="text-muted-foreground mb-8">Crea tu jugador y elige el club donde debutar.</p>
        <NewCareerForm leagues={leagues} nationalities={NATIONALITIES.map(n => ({ id: n.id, name: n.name, code: n.code }))} leagueIndex={LEAGUES_INDEX} />
      </div>
    </main>
  );
}
