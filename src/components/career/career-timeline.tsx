"use client";
import Image from "next/image";
import type { CareerSeasonStats } from "@/lib/data/types";
import { getTeam } from "@/lib/data/loader";
import { TrophyCase } from "./trophy-art";
import { cn, fmt } from "@/lib/utils";

/**
 * Línea temporal de la carrera, temporada a temporada.
 *
 * En escritorio es una tabla (edad · club · media · PJ · GLS · AST · trofeos).
 * En móvil, la misma información en tarjetas apiladas, porque una tabla de
 * siete columnas es ilegible a 390 px.
 */
export function CareerTimeline({ history }: { history: CareerSeasonStats[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no has cerrado ninguna temporada. Toma tus decisiones y pulsa
        «Terminar temporada» para empezar a construir tu carrera.
      </p>
    );
  }

  return (
    <>
      {/* Móvil */}
      <ul className="space-y-2 md:hidden">
        {history.map(s => <MobileRow key={s.seasonNumber} s={s} />)}
      </ul>

      {/* Escritorio */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-2 py-2 text-left font-semibold">Edad</th>
              <th className="px-2 py-2 text-left font-semibold">Club</th>
              <th className="px-2 py-2 text-center font-semibold">Media</th>
              <th className="px-2 py-2 text-center font-semibold">PJ</th>
              <th className="px-2 py-2 text-center font-semibold">Gls</th>
              <th className="px-2 py-2 text-center font-semibold">Ast</th>
              <th className="px-2 py-2 text-center font-semibold">Nota</th>
              <th className="px-2 py-2 text-left font-semibold">Títulos</th>
            </tr>
          </thead>
          <tbody>
            {history.map(s => <DesktopRow key={s.seasonNumber} s={s} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}

function trophiesOf(s: CareerSeasonStats): string[] {
  return [...s.trophies, ...s.individualAwards];
}

function DesktopRow({ s }: { s: CareerSeasonStats }) {
  const team = getTeam(s.teamId);
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-2 py-2.5">
        <span className="inline-grid h-8 w-8 place-items-center rounded-lg bg-secondary text-xs font-black">
          {s.age ?? "—"}
        </span>
      </td>
      <td className="px-2 py-2.5">
        <span className="flex items-center gap-2">
          {team && (
            <Image
              src={team.team.crest} alt="" width={22} height={22}
              unoptimized className="h-[22px] w-[22px] shrink-0 object-contain"
            />
          )}
          <span className="truncate font-semibold">{s.teamName}</span>
        </span>
      </td>
      <td className="px-2 py-2.5 text-center">
        <OverallChip value={s.overallAfter} />
      </td>
      <td className="px-2 py-2.5 text-center tabular-nums">{s.apps}</td>
      <td className="px-2 py-2.5 text-center font-bold tabular-nums text-primary">{s.goals}</td>
      <td className="px-2 py-2.5 text-center font-bold tabular-nums text-sky-300">{s.assists}</td>
      <td className="px-2 py-2.5 text-center tabular-nums">{fmt(s.avgRating)}</td>
      <td className="px-2 py-2.5">
        <TrophyCase trophies={trophiesOf(s)} size="sm" />
      </td>
    </tr>
  );
}

function MobileRow({ s }: { s: CareerSeasonStats }) {
  const team = getTeam(s.teamId);
  return (
    <li className="rounded-xl border border-border bg-black/20 p-3">
      <div className="flex items-center gap-2.5">
        <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-black">
          {s.age ?? "—"}
        </span>
        {team && (
          <Image
            src={team.team.crest} alt="" width={24} height={24}
            unoptimized className="h-6 w-6 shrink-0 object-contain"
          />
        )}
        <span className="min-w-0 flex-1 truncate font-bold">{s.teamName}</span>
        <OverallChip value={s.overallAfter} />
      </div>

      <dl className="mt-2.5 grid grid-cols-4 gap-1.5 text-center">
        <Cell label="PJ" value={s.apps} />
        <Cell label="Gls" value={s.goals} tone="text-primary" />
        <Cell label="Ast" value={s.assists} tone="text-sky-300" />
        <Cell label="Nota" value={fmt(s.avgRating)} />
      </dl>

      {trophiesOf(s).length > 0 && (
        <div className="mt-2.5 border-t border-border/60 pt-2.5">
          <TrophyCase trophies={trophiesOf(s)} size="sm" />
        </div>
      )}
    </li>
  );
}

function Cell({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-lg bg-black/30 py-1.5">
      <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-black tabular-nums", tone)}>{value}</dd>
    </div>
  );
}

/** Chip de media con color según nivel, como en las fichas de jugador. */
function OverallChip({ value }: { value?: number }) {
  if (value === undefined) return <span className="text-xs text-muted-foreground">—</span>;
  const tone =
    value >= 85 ? "bg-sky-400/20 text-sky-300 border-sky-400/40"
    : value >= 78 ? "bg-gold/20 text-gold border-gold/40"
    : value >= 68 ? "bg-primary/15 text-primary border-primary/40"
    : "bg-accent/15 text-accent border-accent/40";
  return (
    <span className={cn("inline-block rounded-md border px-2 py-0.5 text-xs font-black tabular-nums", tone)}>
      {value}
    </span>
  );
}
