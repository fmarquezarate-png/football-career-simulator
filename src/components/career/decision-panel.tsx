"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Dices, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppliedEventOutcome, CareerState, EventChoice, EventTemplate } from "@/lib/data/types";
import { effectiveSuccessChance } from "@/lib/engine/events";
import { cn, fmtDelta } from "@/lib/utils";

/**
 * La decisión, al pie de la tabla de carrera. **No es un modal**: el jugador
 * sigue viendo sus números, su club y su progresión mientras decide, que es
 * justo el contexto que necesita para elegir.
 *
 * Tres fases encadenadas en el mismo sitio, sin saltos de pantalla:
 * elegir → (sorteo, si la opción es una apuesta) → efectos.
 */
type Phase = "choosing" | "rolling" | "result";

export function DecisionPanel({
  event, state, onResolve, onContinue, index, total,
}: {
  event: EventTemplate;
  state: CareerState;
  onResolve: (choiceKey: string) => AppliedEventOutcome;
  onContinue: () => void;
  index: number;
  total: number;
}) {
  const [phase, setPhase] = useState<Phase>("choosing");
  const [chosen, setChosen] = useState<EventChoice | null>(null);
  const [outcome, setOutcome] = useState<AppliedEventOutcome | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setPhase("choosing"); setChosen(null); setOutcome(null);
  }, [event.key]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function choose(choice: EventChoice) {
    const result = onResolve(choice.key);
    setChosen(choice);
    setOutcome(result);
    if (!result.roll) { setPhase("result"); return; }
    setPhase("rolling");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(setTimeout(() => setPhase("result"), reduce ? 350 : 1250));
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-card/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Zap className="h-3 w-3" /> Decisión {index + 1} de {total}
          </p>
          <h2 className="text-lg font-black leading-tight">{event.title}</h2>
        </div>
        <span className="mt-1 flex shrink-0 gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 w-4 rounded-full",
                i < index ? "bg-primary" : i === index ? "bg-primary/60" : "bg-white/10",
              )}
            />
          ))}
        </span>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{event.description}</p>

      {phase === "choosing" && (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            {event.choices.map(c => (
              <OptionCard key={c.key} choice={c} state={state} onPick={() => choose(c)} />
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Ninguna opción es gratis: todas dan algo y quitan algo.
          </p>
        </>
      )}

      {phase !== "choosing" && chosen && outcome && (
        <div className="grid gap-2 sm:grid-cols-3">
          {event.choices.map(c => (
            <OptionCard
              key={c.key}
              choice={c}
              state={state}
              selected={c.key === chosen.key}
              dimmed={c.key !== chosen.key}
            />
          ))}
        </div>
      )}

      {phase === "rolling" && outcome?.roll && <Roll roll={outcome.roll} />}

      {phase === "result" && outcome && (
        <Effects outcome={outcome} onContinue={onContinue} />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta de opción                                                   */
/* ------------------------------------------------------------------ */

function OptionCard({
  choice, state, onPick, selected, dimmed,
}: {
  choice: EventChoice;
  state: CareerState;
  onPick?: () => void;
  selected?: boolean;
  dimmed?: boolean;
}) {
  const chance = choice.risk ? Math.round(effectiveSuccessChance(choice, state) * 100) : null;
  const Tag = onPick ? "button" : "div";

  return (
    <Tag
      {...(onPick ? { type: "button" as const, onClick: onPick } : {})}
      className={cn(
        "flex flex-col rounded-xl border p-3 text-left transition-all duration-300",
        onPick && "border-white/10 bg-black/25 hover:border-white/40 hover:bg-white/5",
        selected && "border-white bg-white/10",
        dimmed && "border-white/5 opacity-30",
      )}
    >
      <span className="text-sm font-bold leading-tight">{choice.label}</span>
      <span className="mt-1 flex-1 text-[11px] leading-snug text-muted-foreground">
        {choice.description}
      </span>

      {chance !== null && (
        <span className="mt-2.5 block">
          <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
            <Dices className="h-3 w-3 text-accent" />
            <span className={chanceTone(chance)}>{chance}%</span>
          </span>
          <span className="flex h-1 overflow-hidden rounded-full bg-destructive/40">
            <span className="bg-primary" style={{ width: `${chance}%` }} />
          </span>
        </span>
      )}
    </Tag>
  );
}

function chanceTone(pct: number): string {
  if (pct >= 60) return "text-primary";
  if (pct >= 40) return "text-gold";
  return "text-destructive";
}

/* ------------------------------------------------------------------ */
/* Sorteo                                                              */
/* ------------------------------------------------------------------ */

function Roll({ roll }: { roll: NonNullable<AppliedEventOutcome["roll"]> }) {
  const [lit, setLit] = useState<"success" | "failure">("success");
  const [settled, setSettled] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setLit(roll.success ? "success" : "failure"); setSettled(true); return; }

    // Ruleta que desacelera. Más corta que antes: encadenar decisiones con dos
    // segundos de espera cada una se hacía pesado.
    let delay = 60, acc = 0, i = 0;
    while (acc < 950) {
      acc += delay;
      const step = i++;
      timers.current.push(setTimeout(() => setLit(step % 2 === 0 ? "failure" : "success"), acc));
      delay *= 1.18;
    }
    timers.current.push(setTimeout(() => {
      setLit(roll.success ? "success" : "failure");
      setSettled(true);
    }, acc + 160));
    return () => timers.current.forEach(clearTimeout);
  }, [roll.success]);

  return (
    <div className="mt-3 grid grid-cols-2 gap-2" aria-live="polite">
      {(["success", "failure"] as const).map(kind => {
        const on = settled ? (kind === "success") === roll.success : lit === kind;
        const Icon = kind === "success" ? Check : X;
        return (
          <div
            key={kind}
            className={cn(
              "grid place-items-center gap-1 rounded-xl border-2 py-4 transition-all duration-150",
              on && kind === "success" && "border-primary bg-primary/20 text-primary",
              on && kind === "failure" && "border-destructive bg-destructive/20 text-destructive",
              !on && "border-white/10 text-muted-foreground",
              settled && !on && "opacity-25",
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-black tracking-widest">
              {kind === "success" ? "ÉXITO" : "FALLO"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Efectos                                                             */
/* ------------------------------------------------------------------ */

const METRICS = [
  { key: "goalsBoost", label: "Goles" },
  { key: "assistsBoost", label: "Asistencias" },
  { key: "overallDelta", label: "Media" },
  { key: "reputationDelta", label: "Reputación" },
  { key: "moraleDelta", label: "Moral" },
  { key: "fitnessDelta", label: "Forma" },
] as const;

function Effects({
  outcome, onContinue,
}: { outcome: AppliedEventOutcome; onContinue: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 40); return () => clearTimeout(t); }, []);

  const changed = METRICS
    .map(m => ({ ...m, value: outcome[m.key] as number }))
    .filter(r => r.value !== 0);
  const max = Math.max(1, ...changed.map(c => Math.abs(c.value)));

  return (
    <div className="mt-3">
      {outcome.roll && (
        <p
          className={cn(
            "mb-3 rounded-xl border px-3 py-2 text-sm font-semibold",
            outcome.roll.success
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {outcome.roll.label}
        </p>
      )}

      {changed.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-black/25 p-3 text-center text-sm text-muted-foreground">
          Sin efectos apreciables.
        </p>
      ) : (
        <ul className="grid gap-1.5 rounded-xl border border-white/10 bg-black/25 p-3 sm:grid-cols-2">
          {changed.map(r => {
            const positive = r.value > 0;
            return (
              <li key={r.key} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] text-muted-foreground">{r.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className={cn(
                      "block h-full rounded-full transition-[width] duration-500 ease-out",
                      positive ? "bg-primary" : "bg-destructive",
                    )}
                    style={{ width: shown ? `${(Math.abs(r.value) / max) * 100}%` : "0%" }}
                  />
                </span>
                <span
                  className={cn(
                    "w-9 shrink-0 text-right text-xs font-black tabular-nums",
                    positive ? "text-primary" : "text-destructive",
                  )}
                >
                  {fmtDelta(r.value)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Button className="mt-3 w-full" onClick={onContinue} autoFocus>
        Continuar <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
