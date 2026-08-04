"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POSITION_LABEL, POSITIONS } from "@/lib/data/types";
import { newCareer } from "@/lib/engine/careerEngine";
import { saveLocalCareer } from "@/lib/storage/local";
import { flagUrl } from "@/lib/data/loader";

type Difficulty = "easy" | "normal" | "hard" | "legendary";

interface Props {
  leagues: { id: string; name: string; country: string; countryCode: string; teams: { id: string; name: string; crest: string; overall: number }[] }[];
  nationalities: { id: string; name: string; code: string }[];
  leagueIndex: { id: string; countryCode: string; name: string }[];
}

export function NewCareerForm({ leagues, nationalities }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState(nationalities[0].code);
  const [position, setPosition] = useState<(typeof POSITIONS)[number]>("ST");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [leagueId, setLeagueId] = useState(leagues[0].id);
  const [teamId, setTeamId] = useState(leagues[0].teams[0].id);

  const currentLeague = useMemo(() => leagues.find(l => l.id === leagueId)!, [leagues, leagueId]);
  const currentTeam = useMemo(() => currentLeague.teams.find(t => t.id === teamId) ?? currentLeague.teams[0], [currentLeague, teamId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const state = newCareer({
      playerName: name.trim(),
      nationality,
      position,
      difficulty,
      teamId: currentTeam.id,
    });
    saveLocalCareer(state);
    router.push("/career");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="name">Nombre del jugador</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Álvaro García" required autoFocus className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nacionalidad</Label>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {nationalities.map(n => (
                    <SelectItem key={n.id} value={n.code}>
                      <span className="inline-flex items-center gap-2">
                        <Image src={flagUrl(n.code, 40)} alt="" width={20} height={14} unoptimized />
                        {n.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Posición</Label>
              <Select value={position} onValueChange={v => setPosition(v as typeof position)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(p => <SelectItem key={p} value={p}>{p} · {POSITION_LABEL[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Dificultad</Label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {(["easy", "normal", "hard", "legendary"] as Difficulty[]).map(d => (
                <button type="button" key={d} onClick={() => setDifficulty(d)}
                  className={`rounded-md border px-2 py-2 text-xs font-semibold capitalize ${difficulty === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                  {d === "easy" ? "Fácil" : d === "normal" ? "Normal" : d === "hard" ? "Difícil" : "Legendaria"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Liga</Label>
            <Select value={leagueId} onValueChange={v => { setLeagueId(v); setTeamId(leagues.find(l => l.id === v)!.teams[0].id); }}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {leagues.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    <span className="inline-flex items-center gap-2">
                      <Image src={flagUrl(l.countryCode, 40)} alt="" width={20} height={14} unoptimized />
                      {l.name} · {l.country}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Equipo</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-72 overflow-y-auto pr-1">
              {currentLeague.teams.map(t => (
                <button type="button" key={t.id} onClick={() => setTeamId(t.id)}
                  className={`flex items-center gap-2 rounded-md border p-2 text-left text-sm ${teamId === t.id ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"}`}>
                  <Image src={t.crest} alt="" width={28} height={28} className="object-contain h-7 w-7" unoptimized />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground">Overall {t.overall}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/")}>Cancelar</Button>
        <Button type="submit">Empezar carrera →</Button>
      </div>
    </form>
  );
}
