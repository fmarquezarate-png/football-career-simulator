import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { CareerState } from "@/lib/data/types";
import { flagUrl, getTeam } from "@/lib/data/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Row {
  id: string;
  slug: string;
  playerName: string;
  state: CareerState;
}

async function fetchBySlug(slug: string | undefined): Promise<Row | null> {
  if (!slug) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("careers")
    .select("id, share_slug, player_name, state")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, slug: data.share_slug, playerName: data.player_name, state: data.state as CareerState };
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) {
    return <div className="container py-10">Supabase no está configurado.</div>;
  }
  const [a, b] = await Promise.all([fetchBySlug(params.a), fetchBySlug(params.b)]);

  return (
    <main className="pitch-bg min-h-dvh">
      <div className="container py-8 max-w-5xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Volver</Link>
        <h1 className="text-3xl font-black mt-3 mb-6">Comparador de carreras</h1>

        {!a || !b ? (
          <Card><CardContent className="pt-6 text-sm">
            Pega el <b>share slug</b> de dos carreras públicas en la URL: <code>/compare?a=SLUG_A&b=SLUG_B</code>
          </CardContent></Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <PlayerHeader row={a} />
              <PlayerHeader row={b} />
            </div>

            <Card className="mt-6"><CardHeader><CardTitle>Totales</CardTitle></CardHeader><CardContent>
              <ComparisonRow label="Goles" a={a.state.totals.goals} b={b.state.totals.goals} />
              <ComparisonRow label="Asistencias" a={a.state.totals.assists} b={b.state.totals.assists} />
              <ComparisonRow label="Partidos" a={a.state.totals.apps} b={b.state.totals.apps} />
              <ComparisonRow label="MOTM" a={a.state.totals.motm} b={b.state.totals.motm} />
              <ComparisonRow label="Trofeos" a={a.state.trophies.length} b={b.state.trophies.length} />
              <ComparisonRow label="Premios individuales" a={a.state.awards.length} b={b.state.awards.length} />
              <ComparisonRow label="OVR actual" a={a.state.overall} b={b.state.overall} />
              <ComparisonRow label="Reputación" a={a.state.reputation} b={b.state.reputation} />
            </CardContent></Card>

            <SharedWorldCups a={a} b={b} />

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <PalmaresList row={a} />
              <PalmaresList row={b} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function PlayerHeader({ row }: { row: Row }) {
  const teamInfo = getTeam(row.state.currentTeamId);
  return (
    <Card>
      <CardContent className="pt-6 flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-secondary grid place-items-center text-2xl">⚽</div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg">{row.playerName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Image src={flagUrl(row.state.nationality)} alt="" width={16} height={11} unoptimized />
            OVR {row.state.overall} · {row.state.age} años
          </div>
          {teamInfo && <div className="text-xs text-muted-foreground truncate">{teamInfo.team.name} · {teamInfo.league.name}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonRow({ label, a, b }: { label: string; a: number; b: number }) {
  const winnerA = a > b, winnerB = b > a;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 border-b border-border/50 last:border-none">
      <div className={`text-right font-bold ${winnerA ? "text-primary" : "text-muted-foreground"}`}>{a}</div>
      <div className="text-xs text-muted-foreground text-center">{label}</div>
      <div className={`text-left font-bold ${winnerB ? "text-primary" : "text-muted-foreground"}`}>{b}</div>
    </div>
  );
}

function PalmaresList({ row }: { row: Row }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Palmarés · {row.playerName}</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {row.state.awards.map((a, i) => <Badge key={"a" + i} variant="gold">{a}</Badge>)}
        {row.state.trophies.map((t, i) => <Badge key={"t" + i}>{t}</Badge>)}
        {row.state.awards.length + row.state.trophies.length === 0 && <span className="text-xs text-muted-foreground">Sin trofeos.</span>}
      </CardContent>
    </Card>
  );
}

function SharedWorldCups({ a, b }: { a: Row; b: Row }) {
  const wcA = new Set(a.state.history.map(h => h.worldCupParticipated).filter(Boolean) as string[]);
  const shared = b.state.history.map(h => h.worldCupParticipated).filter(w => w && wcA.has(w)) as string[];
  if (shared.length === 0) return null;
  return (
    <Card className="mt-4"><CardHeader><CardTitle className="text-sm">Coincidisteis en Mundiales</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {shared.map((w, i) => <Badge key={i} variant="gold">🌍 {w}</Badge>)}
      </CardContent>
    </Card>
  );
}
