"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, Dices, Sparkles } from "lucide-react";
import type { CareerSeasonStats } from "@/lib/data/types";
import { getTeam } from "@/lib/data/loader";
import { ATTRIBUTE_LABEL, type AttributeKey } from "@/lib/engine/attributes";
import { TrophyCase } from "./trophy-art";
import { cn } from "@/lib/utils";

/**
 * Cierre de temporada. Arriba, la ficha de un vistazo (edad, club, media,
 * partidos, goles, asistencias, trofeos). Debajo, plegable, el porqué: qué
 * factores empujaron esos goles y qué movió tus atributos.
 *
 * Una sola columna en móvil, rejilla en escritorio; el diálogo hace scroll
 * dentro de sí mismo para no desbordar pantallas pequeñas.
 */
export function SeasonSummaryDialog({
  summary, onClose,
}: { summary: CareerSeasonStats; onClose: () => void }) {
  const [showWhy, setShowWhy] = useState(false);
  const teamInfo = getTeam(summary.teamId);
  const allTrophies = [...summary.trophies, ...summary.individualAwards];

  return (
    <Dialog open>
      <DialogContent className="flex max-h-[92dvh] max-w-2xl flex-col gap-4 overflow-y-auto">
        <DialogHeader>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Fin de temporada {summary.seasonNumber}
          </p>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {teamInfo && (
              <Image
                src={teamInfo.team.crest} alt="" width={28} height={28}
                unoptimized className="h-7 w-7 object-contain"
              />
            )}
            <span>{summary.teamName}</span>
            {summary.age !== undefined && (
              <span className="text-sm font-normal text-muted-foreground">
                · {summary.age} años
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <Metric label="PJ" value={summary.apps} />
          <Metric label="Goles" value={summary.goals} accent />
          <Metric label="Asist." value={summary.assists} accent />
          <Metric label="Nota" value={summary.avgRating.toFixed(2)} />
          <Metric
            label="Media"
            value={summary.overallAfter ?? "—"}
            hint={summary.teamLeagueFinish ? `${summary.teamLeagueFinish}º en liga` : undefined}
          />
        </dl>

        {(summary.nationalTeamApps ?? 0) > 0 && (
          <div className="rounded-xl border border-border bg-black/20 p-3">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Selección
            </p>
            <p className="text-sm">
              {summary.nationalTeamApps} partidos · {summary.nationalTeamGoals ?? 0} goles
              {summary.worldCupParticipated && (
                <span className="ml-2 font-bold text-gold">{summary.worldCupParticipated}</span>
              )}
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-black/20 p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {allTrophies.length > 0 ? "Lo que ganaste" : "Sin títulos esta temporada"}
          </p>
          <TrophyCase trophies={allTrophies} showLabels />
        </div>

        <button
          type="button"
          onClick={() => setShowWhy(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-white/5"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            ¿Por qué estos números?
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", showWhy && "rotate-180")} />
        </button>

        {showWhy && <WhyPanel summary={summary} />}

        <Button className="w-full" size="lg" onClick={onClose} autoFocus>
          Continuar <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Metric({
  label, value, accent, hint,
}: { label: string; value: number | string; accent?: boolean; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-black/20 px-2 py-2.5 text-center">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("text-xl font-black tabular-nums", accent ? "text-primary" : "text-foreground")}>
        {value}
      </dd>
      {hint && <p className="text-[10px] leading-tight text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* El desglose                                                         */
/* ------------------------------------------------------------------ */

function WhyPanel({ summary }: { summary: CareerSeasonStats }) {
  const b = summary.breakdown;
  if (!b) {
    return (
      <p className="rounded-xl border border-border bg-black/20 p-4 text-sm text-muted-foreground">
        Esta temporada se jugó con una versión anterior del motor y no guardó el
        desglose. A partir de la siguiente ya lo verás.
      </p>
    );
  }

  // Solo los factores que de verdad mueven la aguja.
  const relevant = b.factors.filter(
    f => Math.abs(f.goalsDelta) >= 0.4 || Math.abs(f.assistsDelta) >= 0.4,
  );
  const maxAbs = Math.max(1, ...relevant.map(f => Math.abs(f.goalsDelta + f.assistsDelta)));

  return (
    <div className="space-y-4 rounded-xl border border-border bg-black/20 p-4">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          De dónde salen tus goles
        </p>
        <ul className="space-y-1.5 text-sm">
          <Line
            label="Lo que se esperaba de ti"
            value={`${b.expectedGoals} G · ${b.expectedAssists} A`}
          />
          <Line
            label="El azar de cada remate"
            value={`${fmt(b.luckGoals)} G · ${fmt(b.luckAssists)} A`}
            tone={b.luckGoals + b.luckAssists >= 0 ? "good" : "bad"}
          />
          {((summary.eventGoals ?? 0) !== 0 || (summary.eventAssists ?? 0) !== 0) && (
            <Line
              label="Tus decisiones de la temporada"
              value={`${fmt(summary.eventGoals ?? 0)} G · ${fmt(summary.eventAssists ?? 0)} A`}
              tone={(summary.eventGoals ?? 0) + (summary.eventAssists ?? 0) >= 0 ? "good" : "bad"}
            />
          )}
          <Line label="Total real" value={`${summary.goals} G · ${summary.assists} A`} strong />
        </ul>
      </div>

      <div className="border-t border-border pt-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Dices className="h-3.5 w-3.5 shrink-0" /> Qué te sumó y qué te restó
        </p>
        <ul className="space-y-2.5">
          {relevant.map(f => {
            const total = f.goalsDelta + f.assistsDelta;
            const positive = total >= 0;
            return (
              <li key={f.key} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{f.label}</span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-black tabular-nums",
                      positive ? "text-primary" : "text-destructive",
                    )}
                  >
                    {positive ? "+" : ""}{total.toFixed(1)} G+A
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full", positive ? "bg-primary" : "bg-destructive")}
                    style={{ width: `${Math.min(100, (Math.abs(total) / maxAbs) * 100)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{f.detail}</p>
              </li>
            );
          })}
        </ul>
      </div>

      {(summary.attributeChanges?.length ?? 0) > 0 && (
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Cómo te cambió la temporada
          </p>
          <ul className="space-y-1">
            {summary.attributeChanges!.map((c, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span className={cn("font-black", c.delta > 0 ? "text-primary" : "text-destructive")}>
                  {c.delta > 0 ? "+" : ""}{c.delta}
                </span>
                <span className="font-semibold text-foreground">
                  {ATTRIBUTE_LABEL[c.key as AttributeKey] ?? c.key}
                </span>
                <span>· {c.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Tu nota media parte de {b.ratingBase} y sube con cada gol o asistencia por
        partido. La <strong>forma física</strong> decide cuántos partidos aguantas;
        la <strong>moral</strong>, cuánto rindes en ellos.
      </p>
    </div>
  );
}

function fmt(v: number): string {
  return `${v >= 0 ? "+" : ""}${v}`;
}

function Line({
  label, value, tone, strong,
}: { label: string; value: string; tone?: "good" | "bad"; strong?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className={cn("text-muted-foreground", strong && "font-bold text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "shrink-0 tabular-nums",
          strong && "font-black",
          tone === "good" && "text-primary",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </span>
    </li>
  );
}
