"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { CareerState, EventTemplate } from "@/lib/data/types";
import { FOOT_LABEL, POSITION_LABEL } from "@/lib/data/types";
import { clearLocalCareer, saveLocalCareer } from "@/lib/storage/local";
import {
  endSeason, nextSeasonEvents, resolveEvent, acceptOffer, stayCurrentTeam,
  penaltyChance, applyPenalty, EVENTS_PER_SEASON, type ContractOffer,
} from "@/lib/engine/careerEngine";
import { shootPenalty, type PenaltyContext, type PenaltyResult } from "@/lib/engine/penalty";
import { makeRng } from "@/lib/engine/rng";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fmt, fmtDelta, formatMoney, formatNumber } from "@/lib/utils";
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABEL, type AttributeKey } from "@/lib/engine/attributes";
import { safestChoice } from "@/lib/engine/events";
import { CareerTable } from "./career-table";
import { DecisionPanel } from "./decision-panel";
import { TrophyCase } from "./trophy-art";
import { PenaltyDialog } from "./penalty-dialog";
import { OffersDialog } from "./offers-dialog";
import { SeasonSummaryDialog } from "./season-summary-dialog";
import { SyncButton } from "./sync-button";
import { ChevronDown, Home, RefreshCcw } from "lucide-react";

/**
 * La carrera, en una sola pantalla.
 *
 * No hay modal de decisiones: la tabla de carrera manda y la decisión vive a su
 * pie. Así el jugador tiene delante sus números —media, goles, club, valor—
 * justo mientras elige, que es cuando sirven de algo. Y desaparece de paso la
 * necesidad de «aparcar» el diálogo para ir a mirar la temporada.
 *
 * Siguen siendo modales los tres momentos que sí merecen parar el mundo: el
 * penalti, el resumen de temporada y las ofertas de fichaje.
 */
export function CareerDashboard({ initialState, onChange }: {
  initialState: CareerState;
  onChange: (s: CareerState) => void;
}) {
  const [state, setState] = useState<CareerState>(initialState);
  const [queue, setQueue] = useState<EventTemplate[]>([]);
  /**
   * Posición de la decisión actual dentro de la temporada. Vive aparte del
   * estado de la carrera para que el panel no se remonte —y pierda el sorteo
   * ya mostrado— cuando el motor descuenta el evento resuelto.
   */
  const [eventIndex, setEventIndex] = useState(0);
  const [offers, setOffers] = useState<ContractOffer[] | null>(null);
  /**
   * Penalti decisivo de la temporada. Se comprueba una vez agotadas las
   * decisiones y antes de cerrar, para que sea el clímax de la temporada.
   */
  const [penalty, setPenalty] = useState<PenaltyContext | null>(null);
  const [lastSummary, setLastSummary] = useState<CareerState["history"][number] | null>(null);

  const update = useCallback((next: CareerState) => {
    setState(next);
    saveLocalCareer(next);
    onChange(next);
  }, [onChange]);

  useEffect(() => {
    // No cargar las decisiones de la temporada siguiente mientras siga abierto
    // el cierre de la anterior: si no, las ofertas de fichaje asoman de fondo
    // antes de que toque decidirlas.
    if (offers || lastSummary || penalty) return;
    if (queue.length === 0 && state.currentSeasonEventsRemaining > 0) {
      setQueue(nextSeasonEvents(state));
    }
  }, [state, queue.length, offers, lastSummary, penalty]);

  /**
   * El penalti decisivo cierra la temporada, justo cuando ya no quedan
   * decisiones.
   */
  useEffect(() => {
    if (penalty || offers || lastSummary) return;
    if (state.currentSeasonEventsRemaining > 0) return;
    if (state.penaltyTakenSeason === state.seasonNumber) return;
    setPenalty(penaltyChance(state));
  }, [state, penalty, offers, lastSummary]);

  /**
   * Resuelve la elección en el motor y persiste el nuevo estado, pero **no**
   * avanza de evento: el panel se queda enseñando el sorteo y los efectos
   * hasta que el jugador pulsa «Continuar».
   */
  function handleResolve(template: EventTemplate, choiceKey: string) {
    const { state: next, outcome } = resolveEvent(state, template, choiceKey);
    update(next);
    return outcome;
  }

  function handleContinue() {
    setQueue(q => q.slice(1));
    setEventIndex(i => i + 1);
  }

  function handlePenaltyShot(zone: Parameters<typeof shootPenalty>[1], power: Parameters<typeof shootPenalty>[2]) {
    const rng = makeRng(`pk-${state.playerName}-${state.seasonNumber}-${Date.now()}`);
    return shootPenalty(rng, zone, power, state, penalty!);
  }

  function handlePenaltyDone(result: PenaltyResult) {
    update(applyPenalty(state, result));
    setPenalty(null);
  }

  function handleEndSeason() {
    let s = state;
    if (s.currentSeasonEventsRemaining > 0) {
      // Auto-resolver lo que quede con la opción más conservadora.
      const pending = queue.length ? queue : nextSeasonEvents(s, s.currentSeasonEventsRemaining);
      for (const t of pending) s = resolveEvent(s, t, safestChoice(t).key).state;
    }
    const result = endSeason(s);
    update(result.state);
    setQueue([]);
    setEventIndex(0);
    setOffers(result.offers);
    setLastSummary(result.season);
  }

  function chooseOffer(offer: ContractOffer | null) {
    const next = offer ? acceptOffer(state, offer) : stayCurrentTeam(state);
    update(next);
    setOffers(null);
  }

  function resetCareer() {
    if (!confirm("¿Seguro que quieres borrar tu carrera guardada?")) return;
    clearLocalCareer();
    window.location.href = "/";
  }

  // Mientras un modal esté en pantalla, la decisión espera su turno.
  const blocked = Boolean(offers || lastSummary || penalty);
  const currentEvent = blocked ? undefined : queue[0];

  return (
    <div className="container max-w-5xl py-4 sm:py-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black leading-tight sm:text-2xl">
                {state.playerName}
              </h1>
              <p className="text-xs text-muted-foreground">
                Temporada {state.seasonNumber} · {POSITION_LABEL[state.position]}
                {state.preferredFoot ? ` · ${FOOT_LABEL[state.preferredFoot]}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <SyncButton state={state} onSaved={update} />
              <Button asChild variant="ghost" size="icon" aria-label="Inicio">
                <Link href="/"><Home className="h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Borrar carrera" onClick={resetCareer}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CareerTable state={state} />

          {/* La zona de acción, siempre justo bajo la tabla. */}
          {currentEvent ? (
            <DecisionPanel
              key={`${state.seasonNumber}-${eventIndex}`}
              event={currentEvent}
              state={state}
              onResolve={(key) => handleResolve(currentEvent, key)}
              onContinue={handleContinue}
              index={eventIndex}
              total={EVENTS_PER_SEASON}
            />
          ) : state.isRetired ? (
            <section className="rounded-2xl border border-white/10 bg-card/60 p-6 text-center">
              <p className="text-lg font-black">Carrera terminada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.totals.goals} goles y {state.totals.assists} asistencias en {state.history.length} temporadas.
              </p>
            </section>
          ) : !blocked ? (
            <Button size="lg" className="w-full" onClick={handleEndSeason}>
              Jugar la temporada {state.seasonNumber} →
            </Button>
          ) : null}

          {!currentEvent && !state.isRetired && state.currentSeasonEventsRemaining > 0 && !blocked && (
            <p className="text-center text-xs text-muted-foreground">
              Te quedan {state.currentSeasonEventsRemaining} decisiones; si cierras ahora se resuelven solas por la vía conservadora.
            </p>
          )}
        </div>

        <Details state={state} />
      </div>

      {penalty && (
        <PenaltyDialog
          state={state}
          context={penalty}
          onShoot={handlePenaltyShot}
          onContinue={handlePenaltyDone}
        />
      )}

      {/* Cierre de temporada: primero el resumen, y solo al cerrarlo, las ofertas. */}
      {lastSummary && (
        <SeasonSummaryDialog summary={lastSummary} onClose={() => setLastSummary(null)} />
      )}
      {offers && !lastSummary && (
        <OffersDialog offers={offers} currentTeamId={state.currentTeamId} onChoose={chooseOffer} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detalle                                                             */
/* ------------------------------------------------------------------ */

/**
 * Lo secundario, plegado. En escritorio queda en la columna de al lado; en
 * móvil, debajo de la decisión, que es donde debe estar el foco.
 */
function Details({ state }: { state: CareerState }) {
  const lastChanges = state.history.at(-1)?.attributeChanges ?? [];

  return (
    <aside className="space-y-3">
      <section className="rounded-2xl border border-white/10 bg-card/60 p-3">
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Estado
        </h2>
        <Gauge label="Moral" value={state.morale} />
        <Gauge label="Forma" value={state.fitness} />
        <Gauge label="Reputación" value={state.reputation} />
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Mini label="Goles" value={formatNumber(state.totals.goals)} />
          <Mini label="Asist." value={formatNumber(state.totals.assists)} />
          <Mini label="Part." value={formatNumber(state.totals.apps)} />
        </div>
      </section>

      <Panel title={`Atributos · media ${fmt(state.overall)}`} defaultOpen>
        <div className="grid gap-2">
          {ATTRIBUTE_KEYS.map(k => {
            const last = lastChanges.find(c => c.key === k);
            return (
              <div key={k}>
                <div className="mb-0.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">{ATTRIBUTE_LABEL[k]}</span>
                  <span className="flex items-center gap-1.5">
                    {last && (
                      <span className={last.delta > 0 ? "text-primary" : "text-destructive"}>
                        {fmtDelta(last.delta)}
                      </span>
                    )}
                    <span className="font-bold tabular-nums">{fmt(state.attributes[k])}</span>
                  </span>
                </div>
                <Progress value={state.attributes[k]} />
              </div>
            );
          })}
        </div>
        {lastChanges.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-2">
            {groupByReason(lastChanges).map(([reason, items]) => (
              <li key={reason} className="text-[11px] leading-snug">
                <span className="text-muted-foreground">{reason}</span>{" "}
                {items.map((c, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-muted-foreground">, </span>}
                    <span className={c.delta > 0 ? "font-bold text-primary" : "font-bold text-destructive"}>
                      {fmtDelta(c.delta)}
                    </span>{" "}
                    <span className="font-semibold">
                      {ATTRIBUTE_LABEL[c.key as AttributeKey] ?? c.key}
                    </span>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {(state.trophies.length > 0 || state.awards.length > 0) && (
        <Panel title={`Vitrina · ${state.trophies.length + state.awards.length}`} defaultOpen>
          <TrophyCase trophies={[...state.awards, ...state.trophies]} showLabels />
        </Panel>
      )}

      <Panel title="Contratos">
        <div className="space-y-2">
          {state.contracts.slice().reverse().map((c, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <div className="truncate font-semibold">{c.teamName}</div>
                <div className="text-muted-foreground">T{c.seasonStart}–T{c.seasonEnd}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-bold">{formatMoney(c.wageWeekly)}/sem</div>
                {c.transferFee > 0 && (
                  <div className="text-muted-foreground">Fichaje {formatMoney(c.transferFee)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Lo que ha pasado">
        <ul className="space-y-1.5">
          {state.events.length === 0 && (
            <li className="text-xs text-muted-foreground">Sin eventos resueltos aún esta temporada.</li>
          )}
          {state.events.slice().reverse().slice(0, 20).map((e, i) => (
            <li key={i} className="border-b border-white/5 pb-1.5 text-xs last:border-0">
              {e.message}
            </li>
          ))}
        </ul>
      </Panel>
    </aside>
  );
}

/**
 * Agrupa los cambios de atributo por su motivo. Sin esto, el desarrollo normal
 * de la temporada escupe seis líneas idénticas de «Desarrollo a los 19».
 */
type AttrChange = NonNullable<CareerState["history"][number]["attributeChanges"]>[number];

function groupByReason(changes: AttrChange[]): [string, AttrChange[]][] {
  const groups = new Map<string, AttrChange[]>();
  for (const c of changes) {
    const list = groups.get(c.reason);
    if (list) list.push(c);
    else groups.set(c.reason, [c]);
  }
  return [...groups.entries()];
}

/** Bloque plegable nativo: sin JS, funciona igual en móvil y en escritorio. */
function Panel({ title, children, defaultOpen }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-white/10 bg-card/60">
      <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}

function Gauge({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-0.5 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums">{fmt(value)}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/25 py-1.5">
      <div className="text-sm font-black tabular-nums">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
