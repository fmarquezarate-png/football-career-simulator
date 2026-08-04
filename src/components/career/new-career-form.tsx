"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dices, Loader2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryPicker, type CountryOption } from "./country-picker";
import { POSITION_LABEL, POSITIONS, type Difficulty, type Position } from "@/lib/data/types";
import { DIFFICULTY_ORDER, DIFFICULTY_PROFILES } from "@/lib/data/difficulty";
import { TIER_LABEL, tierOdds } from "@/lib/engine/clubAssignment";
import { newCareer } from "@/lib/engine/careerEngine";
import { findNationality } from "@/lib/data/nationalities";
import { saveLocalCareer } from "@/lib/storage/local";
import { flagUrl } from "@/lib/data/loader";
import { cn } from "@/lib/utils";

const TIER_COLOR: Record<string, string> = {
  elite: "bg-gold",
  grande: "bg-primary",
  media: "bg-sky-400",
  modesto: "bg-muted-foreground",
};

export function NewCareerForm({ countries }: { countries: CountryOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("es");
  const [position, setPosition] = useState<Position>("ST");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [submitting, setSubmitting] = useState(false);

  const profile = DIFFICULTY_PROFILES[difficulty];
  const odds = useMemo(() => tierOdds(difficulty), [difficulty]);

  /** Nombre aleatorio del pool de la nacionalidad elegida. */
  function randomName() {
    const pool = findNationality(nationality);
    const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    setName(`${pick(pool.firstNames)} ${pick(pool.lastNames)}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    const state = newCareer({
      playerName: name.trim(),
      nationality,
      position,
      difficulty,
    });
    saveLocalCareer(state);
    router.push("/career");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 1 · Identidad */}
      <section className="card-glass rounded-2xl p-6">
        <StepTitle n={1} title="¿Quién eres?" />

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del jugador</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Álvaro García"
                required
                autoFocus
                maxLength={40}
              />
              <Button type="button" variant="outline" size="icon" onClick={randomName} title="Nombre aleatorio">
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nacionalidad</Label>
              <div className="mt-1.5">
                <CountryPicker countries={countries} value={nationality} onChange={setNationality} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Define tu selección y el estilo de tu nombre. {countries.length} países disponibles.
              </p>
            </div>

            <div>
              <Label>Posición</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {POSITIONS.map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPosition(p)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-left text-xs transition-colors",
                      position === p
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:bg-white/5",
                    )}
                  >
                    <span className="block font-bold">{p}</span>
                    <span className="block truncate text-[10px] opacity-80">{POSITION_LABEL[p]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 · Dificultad */}
      <section className="card-glass rounded-2xl p-6">
        <StepTitle n={2} title="¿Cuánto quieres sufrir?" />

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {DIFFICULTY_ORDER.map(d => {
            const p = DIFFICULTY_PROFILES[d];
            const active = difficulty === d;
            return (
              <button
                type="button"
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  active ? "border-primary bg-primary/10" : "border-border hover:bg-white/5",
                )}
              >
                <span className={cn("block text-sm font-black", p.accent)}>{p.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {p.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explicación del nivel activo */}
        <div className="mt-5 rounded-xl border border-border bg-black/20 p-4">
          <p className={cn("mb-3 text-sm font-black", profile.accent)}>
            Qué implica «{profile.label}»
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {profile.bullets.map(b => (
              <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                <span className={profile.accent}>▸</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Dices className="h-3.5 w-3.5" /> Probabilidad de tu club de debut
            </p>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
              {odds.map(o => (
                o.pct > 0 && (
                  <div key={o.tier} className={TIER_COLOR[o.tier]} style={{ width: `${o.pct}%` }} />
                )
              ))}
            </div>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
              {odds.map(o => (
                <li key={o.tier} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", TIER_COLOR[o.tier])} />
                  {TIER_LABEL[o.tier]} <span className="font-bold text-foreground">{o.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3 · Sorteo */}
      <section className="card-glass rounded-2xl p-6">
        <StepTitle n={3} title="El sorteo decide tu club" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          No eliges equipo. Al empezar, el motor sortea tu club de debut entre
          las 5 grandes ligas siguiendo las probabilidades de arriba. Puede
          tocarte un gigante europeo o un modesto peleando por no bajar — a
          partir de ahí, los traspasos te los ganas en el campo.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/")}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={!name.trim() || submitting} className="glow-primary">
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sorteando club…</>
          ) : (
            <>
              <Image src={flagUrl(nationality, 40)} alt="" width={20} height={14} unoptimized className="rounded-[2px]" />
              Empezar carrera →
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 text-lg font-black">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
        {n}
      </span>
      {title}
    </h2>
  );
}
