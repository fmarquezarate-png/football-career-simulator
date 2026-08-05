"use client";
import Image from "next/image";
import type { CareerSeasonStats, CareerState } from "@/lib/data/types";
import { POSITION_LABEL } from "@/lib/data/types";
import { flagUrl, getTeam } from "@/lib/data/loader";
import { resolveNationalTeam } from "@/lib/engine/nationalTeam";
import { formatValue, marketValue } from "@/lib/engine/marketValue";
import { TrophyCase } from "./trophy-art";
import { cn, fmt } from "@/lib/utils";

/**
 * La carrera entera en una sola tabla.
 *
 * Las temporadas que quedan por jugar aparecen dibujadas en gris desde el
 * principio: se ve el hueco que falta por llenar, y cada temporada cerrada lo
 * va ocupando. Es lo que convierte una lista de números en una carrera.
 *
 * Sustituye a las pestañas: los datos están siempre a la vista, sin abrir nada.
 */
const FIRST_AGE = 18;
const LAST_AGE = 38;

/** Una sola rejilla para cabecera, filas y pie: las columnas cuadran siempre. */
const GRID =
  "grid grid-cols-[2.2rem_1fr_2.4rem_2.6rem_2.4rem_2.4rem] items-center gap-1 px-2.5 sm:grid-cols-[2.6rem_1fr_3rem_3.2rem_3rem_3rem]";

export function CareerTable({ state }: { state: CareerState }) {
  const byAge = new Map<number, CareerSeasonStats>();
  for (const s of state.history) if (s.age !== undefined) byAge.set(s.age, s);

  const nt = resolveNationalTeam(state.nationality);
  const ntTotals = state.history.reduce(
    (acc, s) => ({
      apps: acc.apps + (s.nationalTeamApps ?? 0),
      goals: acc.goals + (s.nationalTeamGoals ?? 0),
    }),
    { apps: 0, goals: 0 },
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/60">
      <Header state={state} />

      <div role="table" className="text-sm">
        <div
          role="row"
          className={cn(GRID, "border-b border-white/10 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]")}
        >
          <span>Edad</span>
          <span>Club</span>
          <span className="text-center">OVR</span>
          <span className="text-center">PJ</span>
          <span className="text-center">Gls</span>
          <span className="text-center">Ast</span>
        </div>

        {Array.from({ length: LAST_AGE - FIRST_AGE + 1 }, (_, i) => FIRST_AGE + i).map(age => {
          const season = byAge.get(age);
          const isCurrent = age === state.age;
          // La tabla se corta donde acaba la carrera, sin filas muertas.
          if (!season && age > state.age + (state.isRetired ? 0 : 9)) return null;
          return <Row key={age} age={age} season={season} current={isCurrent} state={state} />;
        })}
      </div>

      {/* La selección, fijada al pie como una fila más y en las mismas columnas. */}
      <div className={cn(GRID, "border-t border-white/10 bg-black/30 py-2")}>
        <Image
          src={flagUrl(nt.code, 40)} alt="" width={20} height={14}
          unoptimized className="h-[14px] w-[20px] shrink-0 rounded-[2px] object-cover"
        />
        <span className="min-w-0 truncate text-xs font-semibold sm:text-sm">{nt.name}</span>
        <span />
        <Metric value={ntTotals.apps} tone="text-emerald-400" />
        <Metric value={ntTotals.goals} tone="text-foreground" />
        <span />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Header({ state }: { state: CareerState }) {
  const team = getTeam(state.currentTeamId);
  const value = marketValue(state);

  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 p-3">
      <OverallBadge value={state.overall} />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase">
            <Image
              src={flagUrl(state.nationality, 40)} alt="" width={14} height={10}
              unoptimized className="rounded-[1px]"
            />
            {state.nationality.replace(/^gb-/, "").slice(0, 3)}
          </span>
          <span className="rounded-md bg-rose-500/25 px-1.5 py-0.5 text-[10px] font-bold text-rose-200">
            {POSITION_LABEL[state.position]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {team && (
            <Image
              src={team.team.crest} alt="" width={22} height={22}
              unoptimized className="h-[22px] w-[22px] shrink-0 object-contain"
            />
          )}
          <span className="truncate text-lg font-black leading-tight">
            {state.isRetired ? "Retirado" : team?.team.name ?? state.currentTeamName}
          </span>
        </div>
      </div>

      <dl className="shrink-0 text-right">
        <div className="flex items-baseline justify-end gap-1.5">
          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">Edad</dt>
          <dd className="text-base font-black tabular-nums">{state.age}</dd>
        </div>
        <div className="flex items-baseline justify-end gap-1.5">
          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">Valor</dt>
          <dd className="text-base font-black tabular-nums">{formatValue(value)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Row({
  age, season, current, state,
}: { age: number; season?: CareerSeasonStats; current: boolean; state: CareerState }) {
  const pending = !season;
  // En la temporada que se está jugando ya sabemos el club: se enseña en gris,
  // que es más informativo que un interrogante.
  const team = season ? getTeam(season.teamId) : current ? getTeam(state.currentTeamId) : null;
  const teamName = season?.teamName ?? (current ? state.currentTeamName : "");
  const trophies = season ? [...season.trophies, ...season.individualAwards] : [];

  return (
    <div
      role="row"
      className={cn(
        GRID,
        "border-b border-white/5 py-1.5 last:border-0",
        current && pending && "bg-primary/10",
      )}
    >
      <span
        className={cn(
          "grid h-6 w-6 place-items-center rounded-md text-[11px] font-black tabular-nums sm:h-7 sm:w-7 sm:text-xs",
          pending ? "bg-white/5 text-muted-foreground" : "bg-sky-500/25 text-sky-200",
        )}
      >
        {age}
      </span>

      <span className="flex min-w-0 items-center gap-1.5">
        {team ? (
          <Image
            src={team.team.crest} alt="" width={18} height={18}
            unoptimized
            className={cn("h-[18px] w-[18px] shrink-0 object-contain", pending && "opacity-60")}
          />
        ) : (
          <span className="h-[18px] w-[18px] shrink-0 rounded-full bg-white/5" />
        )}
        <span className={cn("truncate text-xs sm:text-sm", pending && "text-muted-foreground/60")}>
          {teamName}
        </span>
        {trophies.length > 0 && (
          <span className="shrink-0">
            <TrophyCase trophies={trophies} size="sm" />
          </span>
        )}
      </span>

      <span className="text-center">
        {season?.overallAfter !== undefined
          ? <OverallChip value={season.overallAfter} />
          : current
          ? <OverallChip value={state.overall} muted />
          : <span className="text-muted-foreground/30">·</span>}
      </span>

      <Metric value={season?.apps} tone="text-emerald-400" />
      <Metric value={season?.goals} tone="text-foreground" />
      <Metric value={season?.assists} tone="text-foreground" />
    </div>
  );
}

function Metric({ value, tone }: { value?: number; tone: string }) {
  if (value === undefined) return <span className="text-center text-muted-foreground/30">·</span>;
  return (
    <span className={cn("text-center text-xs font-bold tabular-nums sm:text-sm", tone)}>
      {fmt(value)}
    </span>
  );
}

/** Chapa grande de media, con color por tramo como en las fichas de jugador. */
function OverallBadge({ value }: { value: number }) {
  return (
    <div
      className={cn(
        "grid h-14 w-14 shrink-0 place-items-center rounded-xl text-center shadow-lg sm:h-16 sm:w-16",
        overallTone(value),
      )}
    >
      <div>
        <div className="text-[8px] font-bold uppercase tracking-wider opacity-80">OVR</div>
        <div className="text-2xl font-black leading-none tabular-nums sm:text-3xl">{value}</div>
      </div>
    </div>
  );
}

function OverallChip({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums sm:text-xs",
        overallTone(value),
        muted && "opacity-45",
      )}
    >
      {value}
    </span>
  );
}

function overallTone(v: number): string {
  if (v >= 85) return "bg-emerald-500 text-emerald-950";
  if (v >= 78) return "bg-amber-400 text-amber-950";
  if (v >= 68) return "bg-orange-500 text-orange-950";
  if (v >= 58) return "bg-orange-700 text-orange-100";
  return "bg-stone-600 text-stone-100";
}
