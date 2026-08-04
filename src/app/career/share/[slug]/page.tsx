import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { CareerState } from "@/lib/data/types";
import { POSITION_LABEL } from "@/lib/data/types";
import { flagUrl, getTeam } from "@/lib/data/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface DbCareer {
  id: string;
  share_slug: string;
  is_public: boolean;
  player_name: string;
  state: CareerState;
}

export default async function ShareCareerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) {
    return <ConfigMissing />;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("careers")
    .select("id, share_slug, is_public, player_name, state")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (error || !data) notFound();

  const career = (data as DbCareer).state;
  const teamInfo = getTeam(career.currentTeamId);

  return (
    <main className="pitch-bg min-h-dvh">
      <div className="container py-8 max-w-4xl">
        <div className="mb-4 flex justify-between items-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Volver al inicio</Link>
          <Button asChild size="sm" variant="outline"><Link href={`/compare?a=${slug}`}>Comparar con otro jugador</Link></Button>
        </div>
        <Card>
          <CardContent className="pt-6 flex flex-col md:flex-row md:items-center gap-6">
            <div className="mx-auto md:mx-0 h-24 w-24 rounded-full bg-secondary flex items-center justify-center text-4xl">⚽</div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black">{career.playerName}</h1>
              <div className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                <Image src={flagUrl(career.nationality)} alt="" width={20} height={14} unoptimized />
                {POSITION_LABEL[career.position]} · {career.age} años · OVR {career.overall} · POT {career.potential}
              </div>
              {teamInfo && (
                <div className="mt-3 inline-flex items-center gap-2 text-sm">
                  <Image src={teamInfo.team.crest} alt="" width={24} height={24} className="h-6 w-6 object-contain" unoptimized />
                  <span className="font-semibold">{teamInfo.team.name}</span>
                  <span className="text-muted-foreground">· {teamInfo.league.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-4 gap-3 mt-6">
          <TotalCard label="Goles totales" v={career.totals.goals} />
          <TotalCard label="Asistencias" v={career.totals.assists} />
          <TotalCard label="Partidos" v={career.totals.apps} />
          <TotalCard label="MOTM" v={career.totals.motm} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardHeader><CardTitle>Premios individuales</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {career.awards.length === 0 && <span className="text-sm text-muted-foreground">Aún sin premios.</span>}
              {career.awards.map((a, i) => <Badge key={i} variant="gold"><Trophy className="h-3 w-3 mr-1" />{a}</Badge>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Trofeos de club</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {career.trophies.length === 0 && <span className="text-sm text-muted-foreground">Aún sin trofeos.</span>}
              {career.trophies.map((t, i) => <Badge key={i}>{t}</Badge>)}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle>Temporadas</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr><th className="text-left py-2">T</th><th className="text-left">Club</th><th>Pos.</th><th>Part.</th><th>G</th><th>A</th><th>MOTM</th><th>Rating</th><th className="text-left">Trofeos</th><th>Mundial</th></tr>
              </thead>
              <tbody>
                {career.history.map(s => (
                  <tr key={s.seasonNumber} className="border-t border-border/50">
                    <td className="py-2">T{s.seasonNumber}</td>
                    <td>{s.teamName}</td>
                    <td className="text-center">{s.teamLeagueFinish}º</td>
                    <td className="text-center">{s.apps}</td>
                    <td className="text-center font-semibold">{s.goals}</td>
                    <td className="text-center">{s.assists}</td>
                    <td className="text-center">{s.motm}</td>
                    <td className="text-center">{s.avgRating}</td>
                    <td className="text-xs">{[...s.trophies, ...s.individualAwards].join(", ") || "—"}</td>
                    <td className="text-xs">{s.worldCupParticipated ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function TotalCard({ label, v }: { label: string; v: number }) {
  return <Card><CardContent className="pt-6 text-center"><div className="text-3xl font-black">{v}</div><div className="text-xs text-muted-foreground">{label}</div></CardContent></Card>;
}

function ConfigMissing() {
  return (
    <main className="pitch-bg min-h-dvh grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-black">Supabase no está configurado</h1>
        <p className="text-muted-foreground my-3">Sin credenciales no se puede leer una carrera compartida.</p>
        <Button asChild><Link href="/">Volver al inicio</Link></Button>
      </div>
    </main>
  );
}
