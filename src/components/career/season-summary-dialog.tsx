"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CareerSeasonStats } from "@/lib/data/types";
import { Trophy } from "lucide-react";

export function SeasonSummaryDialog({ summary, onClose }: { summary: CareerSeasonStats; onClose: () => void }) {
  return (
    <Dialog open>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Resumen temporada {summary.seasonNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 text-center my-2">
          <SumStat label="Goles" v={summary.goals} />
          <SumStat label="Asist." v={summary.assists} />
          <SumStat label="Partidos" v={summary.apps} />
          <SumStat label="MOTM" v={summary.motm} />
          <SumStat label="Rating" v={summary.avgRating} />
          <SumStat label="Pos. equipo" v={`${summary.teamLeagueFinish}º`} />
        </div>
        {(summary.nationalTeamApps ?? 0) > 0 && (
          <div className="text-sm text-center">
            Selección: <b>{summary.nationalTeamApps}</b> partidos, <b>{summary.nationalTeamGoals}</b> goles
            {summary.worldCupParticipated && <> · <Badge variant="gold">{summary.worldCupParticipated}</Badge></>}
          </div>
        )}
        {(summary.trophies.length + summary.individualAwards.length) > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {summary.trophies.map((t, i) => <Badge key={"t" + i}><Trophy className="h-3 w-3 mr-1" />{t}</Badge>)}
            {summary.individualAwards.map((t, i) => <Badge key={"a" + i} variant="gold"><Trophy className="h-3 w-3 mr-1" />{t}</Badge>)}
          </div>
        )}
        <div className="flex justify-end pt-3">
          <Button onClick={onClose}>Continuar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SumStat({ label, v }: { label: string; v: number | string }) {
  return (
    <div className="rounded-lg border border-border/50 p-3">
      <div className="text-2xl font-black">{v}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
