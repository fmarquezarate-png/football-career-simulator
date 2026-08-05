"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Activity, ArrowRight, Check, Dices, Goal, Heart, Star, X, Zap,
} from "lucide-react";
import type { AppliedEventOutcome, CareerState, EventChoice, EventTemplate } from "@/lib/data/types";
import { effectiveSuccessChance } from "@/lib/engine/events";
import { cn, fmtDelta } from "@/lib/utils";

type Phase = "choosing" | "rolling" | "result";

interface Props {
  event: EventTemplate;
  state: CareerState;
  /** Resuelve la elección en el motor y devuelve el resultado ya sorteado. */
  onResolve: (choiceKey: string) => AppliedEventOutcome;
  /** Cierra el evento y pasa al siguiente. */
  onContinue: (outcome: AppliedEventOutcome) => void;
  /** Posición dentro de la tanda de la temporada, para el progreso. */
  index: number;
  total: number;
}

export function EventChoiceDialog({ event, state, onResolve, onContinue, index, total }: Props) {
  const [phase, setPhase] = useState<Phase>("choosing");
  const [outcome, setOutcome] = useState<AppliedEventOutcome | null>(null);
  const [chosen, setChosen] = useState<EventChoice | null>(null);

  // Cada evento reinicia el diálogo.
  useEffect(() => {
    setPhase("choosing");
    setOutcome(null);
    setChosen(null);
  }, [event.key]);

  function choose(choice: EventChoice) {
    const result = onResolve(choice.key);
    setChosen(choice);
    setOutcome(result);
    setPhase(result.roll ? "rolling" : "result");
  }

  return (
    <Dialog open>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Decisión {index + 1} de {total}
            </span>
            <span className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-4 rounded-full",
                    i < index ? "bg-primary" : i === index ? "bg-primary/60" : "bg-secondary",
                  )}
                />
              ))}
            </span>
          </div>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 shrink-0 text-primary" />
            {event.title}
          </DialogTitle>
          <DialogDescription>{event.description}</DialogDescription>
        </DialogHeader>

        {phase === "choosing" && (
          <ChoiceList event={event} state={state} onChoose={choose} />
        )}

        {phase === "rolling" && outcome?.roll && (
          <RollAnimation
            roll={outcome.roll}
            choiceLabel={chosen?.label ?? ""}
            onDone={() => setPhase("result")}
          />
        )}

        {phase === "result" && outcome && (
          <OutcomePanel outcome={outcome} onContinue={() => onContinue(outcome)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Fase 1 · elección                                                   */
/* ------------------------------------------------------------------ */

function ChoiceList({
  event, state, onChoose,
}: { event: EventTemplate; state: CareerState; onChoose: (c: EventChoice) => void }) {
  return (
    <>
      <div className="mt-1 space-y-2">
        {event.choices.map(c => {
          // Solo se muestra la probabilidad de las apuestas. El resultado de
          // cada opción NO se adelanta: ninguna es la "correcta" y todas
          // cuestan algo.
          const chance = c.risk ? Math.round(effectiveSuccessChance(c, state) * 100) : null;

          return (
            <button
              key={c.key}
              onClick={() => onChoose(c)}
              className="w-full rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-white/5"
            >
              <div className="font-semibold">{c.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.description}</div>

              {chance !== null && (
                <div className="mt-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                    <Dices className="h-3.5 w-3.5 text-accent" />
                    <span className="text-accent">Apuesta</span>
                    <span className="text-muted-foreground">·</span>
                    <span className={chanceTone(chance)}>{chance}% de éxito</span>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-destructive/40">
                    <div className="bg-primary" style={{ width: `${chance}%` }} />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        Ninguna opción es gratis: todas dan algo y quitan algo. Las marcadas
        como <span className="font-bold text-accent">apuesta</span> pasan además
        por un sorteo que tu media, reputación, moral o forma inclinan.
      </p>
    </>
  );
}

function chanceTone(pct: number): string {
  if (pct >= 60) return "text-primary";
  if (pct >= 40) return "text-gold";
  return "text-destructive";
}

/* ------------------------------------------------------------------ */
/* Fase 2 · sorteo                                                     */
/* ------------------------------------------------------------------ */

function RollAnimation({
  roll, choiceLabel, onDone,
}: {
  roll: NonNullable<AppliedEventOutcome["roll"]>;
  choiceLabel: string;
  onDone: () => void;
}) {
  // `lit` alterna entre las dos caras; se frena hasta detenerse en el resultado.
  const [lit, setLit] = useState<"success" | "failure">("success");
  const [settled, setSettled] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLit(roll.success ? "success" : "failure");
      setSettled(true);
      const t = setTimeout(onDone, 900);
      timers.current.push(t);
      return () => timers.current.forEach(clearTimeout);
    }

    // Intervalos crecientes: efecto ruleta que desacelera.
    const steps: number[] = [];
    let delay = 70;
    let elapsed = 0;
    while (elapsed < 1700) {
      steps.push(delay);
      elapsed += delay;
      delay *= 1.16;
    }

    let acc = 0;
    steps.forEach((d, i) => {
      acc += d;
      timers.current.push(
        setTimeout(() => setLit(i % 2 === 0 ? "failure" : "success"), acc),
      );
    });

    timers.current.push(
      setTimeout(() => {
        setLit(roll.success ? "success" : "failure");
        setSettled(true);
      }, acc + 240),
    );
    timers.current.push(setTimeout(onDone, acc + 1250));

    return () => timers.current.forEach(clearTimeout);
  }, [roll.success, onDone]);

  return (
    <div className="py-2">
      <p className="mb-1 text-center text-sm text-muted-foreground">{choiceLabel}</p>
      <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-widest text-accent">
        <Dices className="mr-1 inline h-3.5 w-3.5" />
        Sorteo · {Math.round(roll.successChance * 100)}% de éxito
      </p>

      <div className="grid grid-cols-2 gap-3" aria-live="polite">
        <RollFace
          kind="success"
          active={lit === "success"}
          settled={settled}
          isWinner={roll.success}
          label="ÉXITO"
        />
        <RollFace
          kind="failure"
          active={lit === "failure"}
          settled={settled}
          isWinner={!roll.success}
          label="FALLO"
        />
      </div>

      {settled && (
        <p className="mt-5 text-center text-base font-bold">{roll.label}</p>
      )}
    </div>
  );
}

function RollFace({
  kind, active, settled, isWinner, label,
}: {
  kind: "success" | "failure";
  active: boolean;
  settled: boolean;
  isWinner: boolean;
  label: string;
}) {
  const on = settled ? isWinner : active;
  const dim = settled && !isWinner;
  const Icon = kind === "success" ? Check : X;

  return (
    <div
      className={cn(
        "grid place-items-center gap-2 rounded-2xl border-2 py-8 transition-all duration-150",
        on && kind === "success" && "border-primary bg-primary/20 text-primary scale-[1.03] shadow-[0_0_36px_-6px_hsl(var(--primary))]",
        on && kind === "failure" && "border-destructive bg-destructive/20 text-destructive scale-[1.03] shadow-[0_0_36px_-6px_hsl(var(--destructive))]",
        !on && "border-border text-muted-foreground",
        dim && "opacity-35 scale-95",
      )}
    >
      <Icon className="h-9 w-9" />
      <span className="text-sm font-black tracking-widest">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fase 3 · efectos                                                    */
/* ------------------------------------------------------------------ */

const METRICS = [
  { key: "goalsBoost", label: "Goles", icon: Goal, unit: "" },
  { key: "assistsBoost", label: "Asistencias", icon: ArrowRight, unit: "" },
  { key: "overallDelta", label: "Media", icon: Star, unit: "" },
  { key: "reputationDelta", label: "Reputación", icon: Zap, unit: "" },
  { key: "moraleDelta", label: "Moral", icon: Heart, unit: "" },
  { key: "fitnessDelta", label: "Forma", icon: Activity, unit: "" },
] as const;

function OutcomePanel({
  outcome, onContinue,
}: { outcome: AppliedEventOutcome; onContinue: () => void }) {
  // Anima las barras al montar.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 40);
    return () => clearTimeout(t);
  }, []);

  const rows = useMemo(
    () => METRICS.map(m => ({ ...m, value: outcome[m.key] as number })),
    [outcome],
  );
  const changed = rows.filter(r => r.value !== 0);

  return (
    <div className="pt-1">
      {outcome.roll && (
        <div
          className={cn(
            "mb-4 flex items-center gap-2.5 rounded-xl border p-3",
            outcome.roll.success
              ? "border-primary/40 bg-primary/10"
              : "border-destructive/40 bg-destructive/10",
          )}
        >
          {outcome.roll.success
            ? <Check className="h-5 w-5 shrink-0 text-primary" />
            : <X className="h-5 w-5 shrink-0 text-destructive" />}
          <p className="text-sm font-semibold">{outcome.roll.label}</p>
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">{outcome.message}</p>

      {changed.length === 0 ? (
        <p className="rounded-xl border border-border bg-black/20 p-4 text-center text-sm text-muted-foreground">
          Sin efectos apreciables. La temporada sigue su curso.
        </p>
      ) : (
        <ul className="space-y-2 rounded-xl border border-border bg-black/20 p-4">
          {changed.map(r => {
            const positive = r.value > 0;
            // Escala relativa: el mayor cambio ocupa el ancho completo.
            const max = Math.max(...changed.map(c => Math.abs(c.value)));
            const width = shown ? `${(Math.abs(r.value) / max) * 100}%` : "0%";
            return (
              <li key={r.key} className="flex items-center gap-3">
                <r.icon className={cn("h-4 w-4 shrink-0", positive ? "text-primary" : "text-destructive")} />
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{r.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span
                    className={cn(
                      "block h-full rounded-full transition-[width] duration-700 ease-out",
                      positive ? "bg-primary" : "bg-destructive",
                    )}
                    style={{ width }}
                  />
                </span>
                <span
                  className={cn(
                    "w-10 shrink-0 text-right text-sm font-black tabular-nums",
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

      <Button className="mt-5 w-full" size="lg" onClick={onContinue} autoFocus>
        Continuar <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
