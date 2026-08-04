"use client";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import type { ContractOffer } from "@/lib/engine/careerEngine";

export function OffersDialog({ offers, currentTeamId, onChoose }: {
  offers: ContractOffer[];
  currentTeamId: string;
  onChoose: (offer: ContractOffer | null) => void;
}) {
  return (
    <Dialog open>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mercado de fichajes</DialogTitle>
          <DialogDescription>Estas son las mejores ofertas que ha recibido tu agente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {offers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Ningún club se ha movido esta temporada. Sigues en tu club actual.</p>
          )}
          {offers.map((o, i) => (
            <div key={i} className="flex items-center gap-3 border border-border/50 rounded-md p-3">
              <Image src={o.team.crest} alt="" width={40} height={40} className="h-10 w-10 object-contain" unoptimized />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{o.team.name} {o.team.id === currentTeamId && <span className="text-xs text-primary">(renovación)</span>}</div>
                <div className="text-xs text-muted-foreground">Overall {o.team.overall} · Prestigio {o.team.prestige}</div>
                <div className="text-xs mt-1 flex gap-3">
                  <span>Salario <b>{formatMoney(o.wageWeekly)}</b>/sem</span>
                  {o.transferFee > 0 && <span>Traspaso <b>{formatMoney(o.transferFee)}</b></span>}
                  <span>{o.contractYears} años</span>
                </div>
              </div>
              <Button size="sm" onClick={() => onChoose(o)}>Aceptar</Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onChoose(null)}>Quedarme en mi club</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
