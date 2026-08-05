"use client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target } from "lucide-react";
import type { CareerState } from "@/lib/data/types";
import {
  PENALTY_POWERS, PENALTY_ZONES, penaltyOdds,
  type PenaltyContext, type PenaltyPower, type PenaltyResult, type PenaltyZone,
} from "@/lib/engine/penalty";
import { cn } from "@/lib/utils";

type Phase = "aim" | "shooting" | "result";

/**
 * El penalti decisivo. Eliges esquina y tipo de disparo sobre una portería
 * dibujada; el portero elige a la vez. La animación muestra su estirada y el
 * recorrido del balón antes de cantar el resultado.
 *
 * La portería es SVG con `viewBox`, así que escala sola: ocupa el ancho
 * disponible tanto en móvil como en escritorio.
 */
export function PenaltyDialog({
  state, context, onShoot, onContinue,
}: {
  state: CareerState;
  context: PenaltyContext;
  onShoot: (zone: PenaltyZone, power: PenaltyPower) => PenaltyResult;
  onContinue: (result: PenaltyResult) => void;
}) {
  const [phase, setPhase] = useState<Phase>("aim");
  const [zone, setZone] = useState<PenaltyZone | null>(null);
  const [power, setPower] = useState<PenaltyPower>("placed");
  const [result, setResult] = useState<PenaltyResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function shoot(z: PenaltyZone) {
    const r = onShoot(z, power);
    setZone(z);
    setResult(r);
    setPhase("shooting");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(setTimeout(() => setPhase("result"), reduce ? 400 : 1500));
  }

  const odds = zone ? null : PENALTY_ZONES.map(z => ({
    zone: z.zone,
    pct: Math.round(penaltyOdds(z.zone, power, state, context).scoreChance * 100),
  }));

  return (
    <Dialog open>
      <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
            {context.competition}
          </p>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 shrink-0 text-accent" />
            El penalti decisivo
          </DialogTitle>
          <DialogDescription>{context.stakes}</DialogDescription>
        </DialogHeader>

        <Goal
          phase={phase}
          shotZone={zone}
          keeperGuess={result?.keeperGuess ?? null}
          scored={result?.scored ?? null}
          missedTarget={result?.missedTarget ?? false}
          odds={odds}
          onPick={phase === "aim" ? shoot : undefined}
        />

        {phase === "aim" && (
          <>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cómo la golpeas
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PENALTY_POWERS.map(p => (
                  <button
                    key={p.power}
                    type="button"
                    onClick={() => setPower(p.power)}
                    className={cn(
                      "rounded-xl border p-2.5 text-left transition-colors",
                      power === p.power
                        ? "border-accent bg-accent/15"
                        : "border-border hover:bg-white/5",
                    )}
                  >
                    <span className={cn("block text-sm font-bold", power === p.power && "text-accent")}>
                      {p.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">
                      {p.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Elige una esquina para tirar. El portero decide a la vez que tú:
              los porcentajes ya cuentan con eso, con tu tiro y con tu moral.
            </p>
          </>
        )}

        {phase === "result" && result && (
          <div
            className={cn(
              "rounded-xl border p-4 text-center",
              result.scored ? "border-primary/40 bg-primary/10" : "border-destructive/40 bg-destructive/10",
            )}
          >
            <p className={cn("text-2xl font-black", result.scored ? "text-primary" : "text-destructive")}>
              {result.headline}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{result.detail}</p>
          </div>
        )}

        {phase === "result" && result && (
          <Button className="w-full" size="lg" onClick={() => onContinue(result)} autoFocus>
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* La portería                                                         */
/* ------------------------------------------------------------------ */

const ZONE_X: Record<PenaltyZone, number> = { left: 62, center: 160, right: 258 };

function Goal({
  phase, shotZone, keeperGuess, scored, missedTarget, odds, onPick,
}: {
  phase: Phase;
  shotZone: PenaltyZone | null;
  keeperGuess: PenaltyZone | null;
  scored: boolean | null;
  missedTarget: boolean;
  odds: { zone: PenaltyZone; pct: number }[] | null;
  onPick?: (z: PenaltyZone) => void;
}) {
  const shooting = phase !== "aim";
  // Destino del balón: si se va fuera, por encima del larguero.
  const ballX = shotZone ? ZONE_X[shotZone] : 160;
  const ballY = missedTarget ? 8 : 74;

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-emerald-950/60 to-emerald-900/30 p-3">
      <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="Portería">
        {/* Red */}
        <defs>
          <pattern id="net" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0v10" fill="none" stroke="#ffffff" strokeOpacity=".18" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="20" y="16" width="280" height="98" fill="url(#net)" />
        {/* Palos */}
        <rect x="14" y="10" width="8" height="110" rx="3" fill="#f1f5f9" />
        <rect x="298" y="10" width="8" height="110" rx="3" fill="#f1f5f9" />
        <rect x="14" y="10" width="292" height="8" rx="3" fill="#f1f5f9" />
        {/* Césped */}
        <rect x="0" y="118" width="320" height="32" fill="#14532d" opacity=".55" />
        <ellipse cx="160" cy="140" rx="120" ry="8" fill="#166534" opacity=".5" />

        {/* Portero */}
        <g
          className="transition-transform duration-500 ease-out"
          style={{
            transform: shooting && keeperGuess
              ? `translateX(${ZONE_X[keeperGuess] - 160}px) ${keeperGuess !== "center" ? "rotate(-12deg)" : ""}`
              : "translateX(0)",
            transformOrigin: "160px 96px",
          }}
        >
          <circle cx="160" cy="76" r="8" fill="#fbbf24" />
          <rect x="151" y="85" width="18" height="28" rx="6" fill="#f59e0b" />
          <rect x="135" y="87" width="16" height="6" rx="3" fill="#fbbf24" />
          <rect x="169" y="87" width="16" height="6" rx="3" fill="#fbbf24" />
        </g>

        {/* Balón */}
        <circle
          className="transition-all duration-[900ms] ease-out"
          cx={shooting ? ballX : 160}
          cy={shooting ? ballY : 138}
          r={shooting ? 6 : 7}
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="1.5"
          opacity={shooting ? 1 : 0.95}
        />

        {/* Zonas seleccionables */}
        {onPick && PENALTY_ZONES.map(z => {
          const x = ZONE_X[z.zone];
          const pct = odds?.find(o => o.zone === z.zone)?.pct;
          return (
            <g key={z.zone} className="cursor-pointer" onClick={() => onPick(z.zone)}>
              <rect
                x={x - 46} y="24" width="92" height="82" rx="8"
                className="fill-white/5 stroke-white/25 transition-colors hover:fill-emerald-400/25 hover:stroke-emerald-300"
                strokeWidth="1.5"
              />
              <text x={x} y="52" textAnchor="middle" className="fill-white text-[13px] font-bold">
                {pct}%
              </text>
              <text x={x} y="67" textAnchor="middle" className="fill-white/70 text-[9px]">
                {z.label}
              </text>
            </g>
          );
        })}

        {phase === "result" && (
          <text
            x="160" y="100" textAnchor="middle"
            className={cn("text-[22px] font-black", scored ? "fill-emerald-400" : "fill-red-400")}
          >
            {scored ? "GOL" : missedTarget ? "FUERA" : "PARADA"}
          </text>
        )}
      </svg>
    </div>
  );
}
