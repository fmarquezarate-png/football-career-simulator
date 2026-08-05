"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Download, Link2, RotateCcw, Trophy } from "lucide-react";
import type { CareerState } from "@/lib/data/types";
import { POSITION_LABEL } from "@/lib/data/types";
import { flagUrl, getTeam } from "@/lib/data/loader";
import { formatValue, marketValue } from "@/lib/engine/marketValue";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TrophyCase, TrophyIcon } from "./trophy-art";
import { formatNumber } from "@/lib/utils";

/**
 * El final de la carrera, al pie de la tabla como todo lo demás: los cuatro
 * números que resumen quince años y la vitrina. Desde aquí se abre la ficha
 * para compartir.
 */
export function CareerEnd({ state, onShare }: { state: CareerState; onShare: () => void }) {
  const titles = state.trophies.length + state.awards.length;

  return (
    <section className="rounded-2xl border border-white/10 bg-card/60 p-5 text-center">
      <h2 className="text-xl font-black">Tu carrera llegó a su fin</h2>

      <dl className="mt-4 grid grid-cols-4 divide-x divide-white/10">
        <Total label="PJ" value={state.totals.apps} />
        <Total label="Gls" value={state.totals.goals} />
        <Total label="Ast" value={state.totals.assists} />
        <Total label="Títulos" value={titles} />
      </dl>

      {titles > 0 && (
        <div className="mt-5 flex justify-center">
          <TrophyCase trophies={[...state.awards, ...state.trophies]} size="lg" />
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={onShare}>
          <Trophy className="h-4 w-4" /> Ver resumen
        </Button>
        <Button variant="outline" asChild>
          <a href="/career/new"><RotateCcw className="h-4 w-4" /> Volver a jugar</a>
        </Button>
      </div>
    </section>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-1">
      <dt className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-black tabular-nums sm:text-3xl">{formatNumber(value)}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ficha para compartir                                                */
/* ------------------------------------------------------------------ */

/**
 * La ficha de la carrera terminada. Se enseña la **mejor versión** del
 * jugador, no la última: la media y el valor del pico, no los de los 39 años
 * cuando ya estaba de vuelta en su club de siempre. Es lo que uno cuenta.
 */
export function ShareCareerDialog({
  state, onClose, shareUrl, onCopyLink, busy,
}: {
  state: CareerState;
  onClose: () => void;
  shareUrl: string | null;
  onCopyLink: () => void;
  busy: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const peak = useMemo(() => {
    const best = state.history.reduce(
      (acc, s) => Math.max(acc, s.overallAfter ?? 0),
      state.overall,
    );
    const bestSeason = state.history.find(s => s.overallAfter === best);
    const value = marketValue({
      ...state,
      overall: best,
      age: bestSeason?.age ?? 27,
      currentLeagueId: bestSeason
        ? getTeam(bestSeason.teamId)?.league.id ?? state.currentLeagueId
        : state.currentLeagueId,
    });
    return { overall: best, value };
  }, [state]);

  /** Un escudo por club, en orden de carrera y sin repetir los regresos. */
  const trajectory = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; name: string; crest: string }[] = [];
    for (const s of state.history) {
      if (seen.has(s.teamId)) continue;
      seen.add(s.teamId);
      const t = getTeam(s.teamId);
      if (t) out.push({ id: s.teamId, name: t.team.name, crest: t.team.crest });
    }
    return out;
  }, [state.history]);

  const trophies = [...state.awards, ...state.trophies];

  async function copy() {
    onCopyLink();
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-accent">
          Carrera finalizada
        </p>
        <h2 className="mb-3 text-center text-2xl font-black">Comparte tu carrera</h2>

        {/* La tarjeta en sí, pensada para verse bien en una captura. */}
        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
          <div className="flex items-stretch gap-2">
            <div className="grid h-[74px] w-[74px] shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-lg">
              <div className="text-center">
                <div className="text-[8px] font-bold uppercase tracking-wider opacity-80">OVR</div>
                <div className="text-3xl font-black leading-none tabular-nums">{peak.overall}</div>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Image
                  src={flagUrl(state.nationality, 40)} alt="" width={28} height={20}
                  unoptimized className="h-5 w-7 shrink-0 rounded-[2px] object-cover"
                />
                <Chip label="Valor" value={formatValue(peak.value)} />
                <Chip value={POSITION_LABEL[state.position]} />
              </div>
              <dl className="grid grid-cols-3 divide-x divide-white/10 rounded-lg bg-white/5 py-1.5">
                <CardStat label="PJ" value={state.totals.apps} />
                <CardStat label="Gls" value={state.totals.goals} />
                <CardStat label="Ast" value={state.totals.assists} />
              </dl>
            </div>
          </div>

          <p className="mb-2 mt-5 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Trayectoria
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {trajectory.map(t => (
              <Image
                key={t.id} src={t.crest} alt={t.name} title={t.name}
                width={26} height={26} unoptimized className="h-[26px] w-[26px] object-contain"
              />
            ))}
          </div>

          {trophies.length > 0 && (
            <>
              <p className="mb-2 mt-5 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Títulos
              </p>
              <div className="flex flex-wrap items-end justify-center gap-3">
                {trophies.map((t, i) => (
                  <TrophyIcon key={`${t}-${i}`} name={t} className="h-11 w-11" />
                ))}
              </div>
            </>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
            <span className="text-muted-foreground">Juega tu carrera en</span>
            <span className="font-bold text-primary">Football Career Simulator</span>
          </div>
        </div>

        <div className="mt-3 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={copy} disabled={busy}>
            <Link2 className="h-4 w-4" />
            {copied ? "¡Copiado!" : shareUrl ? "Copiar enlace" : "Crear enlace"}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/career/new"><Download className="h-4 w-4" /> Nueva carrera</a>
          </Button>
        </div>
        {!shareUrl && !busy && (
          <p className="text-center text-[11px] text-muted-foreground">
            El enlace público necesita que hayas iniciado sesión.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Chip({ label, value }: { label?: string; value: string }) {
  return (
    <span className="flex min-w-0 items-baseline gap-1 rounded-md border border-white/15 px-1.5 py-0.5">
      {label && (
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</span>
      )}
      <span className="truncate text-[11px] font-bold">{value}</span>
    </span>
  );
}

function CardStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-1 text-center">
      <dt className="text-[8px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-base font-black leading-tight tabular-nums">{formatNumber(value)}</dd>
    </div>
  );
}
