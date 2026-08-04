"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EventTemplate } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function EventChoiceDialog({ event, onChoose }: { event: EventTemplate; onChoose: (key: string) => void }) {
  return (
    <Dialog open>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />{event.title}</DialogTitle>
          <DialogDescription>{event.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {event.choices.map(c => {
            const q = c.qualityBias;
            const Icon = q > 0.2 ? TrendingUp : q < -0.2 ? TrendingDown : Minus;
            const colorClass = q > 0.2 ? "text-primary" : q < -0.2 ? "text-destructive" : "text-muted-foreground";
            return (
              <button key={c.key} onClick={() => onChoose(c.key)}
                className="w-full text-left rounded-md border border-border p-3 hover:bg-secondary transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{c.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
                    <div className="text-xs mt-2 text-muted-foreground italic">→ {c.outcomeSummary}</div>
                  </div>
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-1">
          Cada opción es estocástica: el resultado se muestrea de una normal cuyo mu depende del riesgo/beneficio.
        </p>
      </DialogContent>
    </Dialog>
  );
}
