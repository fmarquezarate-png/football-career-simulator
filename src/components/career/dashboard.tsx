"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CareerState, EventTemplate } from "@/lib/data/types";
import { POSITION_LABEL } from "@/lib/data/types";
import { flagUrl, getTeam } from "@/lib/data/loader";
import { clearLocalCareer, saveLocalCareer } from "@/lib/storage/local";
import {
  endSeason, nextSeasonEvents, resolveEvent, acceptOffer, stayCurrentTeam, EVENTS_PER_SEASON, type ContractOffer,
} from "@/lib/engine/careerEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney, formatNumber } from "@/lib/utils";
import { EventChoiceDialog } from "./event-dialog";
import { OffersDialog } from "./offers-dialog";
import { SeasonSummaryDialog } from "./season-summary-dialog";
import { SyncButton } from "./sync-button";
import { Trophy, Home, RefreshCcw, Zap } from "lucide-react";

export function CareerDashboard({ initialState, onChange }: {
  initialState: CareerState;
  onChange: (s: CareerState) => void;
}) {
  const [state, setState] = useState<CareerState>(initialState);
  const [queue, setQueue] = useState<EventTemplate[]>([]);
  /**
   * Posición de la decisión actual dentro de la temporada. Vive aparte del
   * estado de la carrera para que el diálogo no se remonte —y pierda el
   * sorteo ya mostrado— cuando el motor descuenta el evento resuelto.
   */
  const [eventIndex, setEventIndex] = useState(0);
  const [offers, setOffers] = useState<ContractOffer[] | null>(null);
  const [lastSummary, setLastSummary] = useState<CareerState["history"][number] | null>(null);

  const teamInfo = useMemo(() => getTeam(state.currentTeamId), [state.currentTeamId]);

  const update = useCallback((next: CareerState) => {
    setState(next);
    saveLocalCareer(next);
    onChange(next);
  }, [onChange]);

  useEffect(() => {
    if (queue.length === 0 && state.currentSeasonEventsRemaining > 0) {
      setQueue(nextSeasonEvents(state));
    }
  }, [state, queue.length]);

  /**
   * Resuelve la elección en el motor y persiste el nuevo estado, pero **no**
   * avanza de evento: el diálogo se queda enseñando el sorteo y los efectos
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

  function handleEndSeason() {
    if (state.currentSeasonEventsRemaining > 0) {
      // Auto-resolver eventos pendientes con la opción más segura (menor riesgo).
      let s = state;
      let pending = queue.length ? queue : nextSeasonEvents(state, state.currentSeasonEventsRemaining);
      for (const t of pending) {
        const safest = [...t.choices].sort((a, b) => Math.abs(a.qualityBias) - Math.abs(b.qualityBias))[0];
        s = resolveEvent(s, t, safest.key).state;
      }
      const result = endSeason(s);
      update(result.state);
      setQueue([]);
      setEventIndex(0);
      setOffers(result.offers);
      setLastSummary(result.season);
      return;
    }
    const result = endSeason(state);
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

  const currentEvent = queue[0];

  return (
    <div className="container py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <aside className="space-y-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-2xl mb-2">⚽</div>
            <div className="font-black text-lg">{state.playerName}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-2 mt-1">
              <Image src={flagUrl(state.nationality)} alt="" width={20} height={14} unoptimized />
              {POSITION_LABEL[state.position]} · {state.age} años
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="OVR" value={state.overall} color="primary" />
              <Stat label="POT" value={state.potential} color="gold" />
              <Stat label="REP" value={state.reputation} color="secondary" />
            </div>
          </CardContent>
        </Card>

        {teamInfo && (
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Image src={teamInfo.team.crest} alt="" width={40} height={40} className="h-10 w-10 object-contain" unoptimized />
              <div className="min-w-0">
                <div className="font-bold truncate">{teamInfo.team.name}</div>
                <div className="text-xs text-muted-foreground">{teamInfo.league.name}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Temporada {state.seasonNumber}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Moral"><Progress value={state.morale} /><span className="text-xs ml-2">{state.morale}</span></Row>
            <Row label="Fitness"><Progress value={state.fitness} /><span className="text-xs ml-2">{state.fitness}</span></Row>
            <div className="text-xs text-muted-foreground pt-1">Eventos restantes: {state.currentSeasonEventsRemaining}</div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/"><Home className="h-4 w-4" /> Inicio</Link></Button>
          <Button variant="destructive" size="sm" onClick={resetCareer}><RefreshCcw className="h-4 w-4" /> Reset</Button>
        </div>
      </aside>

      <section className="space-y-4">
        <Card>
          <CardContent className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Temporada actual</div>
              <div className="font-black text-xl">Goles {state.seasonStats.goals} · Asist. {state.seasonStats.assists}</div>
              <div className="text-sm text-muted-foreground">Ganancia acumulada eventos: aplicada a tus stats de fin de temporada.</div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {currentEvent && (
                <Badge className="animate-pulse"><Zap className="h-3 w-3 mr-1" />Evento pendiente</Badge>
              )}
              <SyncButton state={state} onSaved={update} />
              <Button onClick={handleEndSeason}>Terminar temporada →</Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">Palmarés</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="attrs">Atributos</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="events">Historial eventos</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card><CardContent className="pt-6 space-y-4">
              {state.trophies.length === 0 && state.awards.length === 0 && (
                <p className="text-sm text-muted-foreground">Aún sin trofeos. Termina una temporada para empezar a levantar títulos.</p>
              )}
              {state.awards.length > 0 && (
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-2">Premios individuales</div>
                  <div className="flex flex-wrap gap-2">
                    {state.awards.map((a, i) => <Badge key={i} variant="gold"><Trophy className="h-3 w-3 mr-1" />{a}</Badge>)}
                  </div>
                </div>
              )}
              {state.trophies.length > 0 && (
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-2">Trofeos de club</div>
                  <div className="flex flex-wrap gap-2">
                    {state.trophies.map((t, i) => <Badge key={i}>{t}</Badge>)}
                  </div>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card><CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-3 text-center mb-4">
                <StatBig label="Goles totales" value={formatNumber(state.totals.goals)} />
                <StatBig label="Asistencias" value={formatNumber(state.totals.assists)} />
                <StatBig label="Partidos" value={formatNumber(state.totals.apps)} />
                <StatBig label="MOTM" value={formatNumber(state.totals.motm)} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr><th className="text-left py-2">T</th><th className="text-left">Club</th><th>Pos.</th><th>Part.</th><th>G</th><th>A</th><th>MOTM</th><th>Rating</th><th className="text-left">Trofeos</th></tr>
                  </thead>
                  <tbody>
                    {state.history.slice().reverse().map(s => (
                      <tr key={s.seasonNumber} className="border-t border-border/50">
                        <td className="py-2">T{s.seasonNumber}</td>
                        <td>{s.teamName}</td>
                        <td className="text-center">{s.teamLeagueFinish}º</td>
                        <td className="text-center">{s.apps}</td>
                        <td className="text-center font-semibold">{s.goals}</td>
                        <td className="text-center">{s.assists}</td>
                        <td className="text-center">{s.motm}</td>
                        <td className="text-center">{s.avgRating}</td>
                        <td className="text-xs">{[...s.trophies, ...s.individualAwards].join(", ") || "—"}</td>
                      </tr>
                    ))}
                    {state.history.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Aún sin temporadas jugadas.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="attrs">
            <Card><CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(state.attributes).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1"><span className="capitalize">{k}</span><span className="font-bold">{v}</span></div>
                  <Progress value={v} />
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card><CardContent className="pt-6 space-y-3">
              {state.contracts.map((c, i) => (
                <div key={i} className="flex justify-between items-center border-b border-border/50 py-2 text-sm">
                  <div>
                    <div className="font-semibold">{c.teamName}</div>
                    <div className="text-xs text-muted-foreground">T{c.seasonStart}–T{c.seasonEnd}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatMoney(c.wageWeekly)}/sem</div>
                    {c.transferFee > 0 && <div className="text-xs text-muted-foreground">Fichaje {formatMoney(c.transferFee)}</div>}
                  </div>
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="events">
            <Card><CardContent className="pt-6 space-y-2 text-sm">
              {state.events.length === 0 && <p className="text-muted-foreground">Sin eventos resueltos aún esta temporada.</p>}
              {state.events.slice().reverse().map((e, i) => (
                <div key={i} className="border-b border-border/50 py-2">
                  <div className="font-medium">{e.message}</div>
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </section>

      {currentEvent && (
        <EventChoiceDialog
          key={`${state.seasonNumber}-${eventIndex}`}
          event={currentEvent}
          state={state}
          onResolve={(key) => handleResolve(currentEvent, key)}
          onContinue={handleContinue}
          index={eventIndex}
          total={EVENTS_PER_SEASON}
        />
      )}
      {offers && (
        <OffersDialog offers={offers} currentTeamId={state.currentTeamId} onChoose={chooseOffer} />
      )}
      {lastSummary && !offers && (
        <SeasonSummaryDialog summary={lastSummary} onClose={() => setLastSummary(null)} />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = { primary: "text-primary", gold: "text-gold", secondary: "text-muted-foreground" };
  return (
    <div>
      <div className={`font-black text-2xl ${colorMap[color]}`}>{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function StatBig({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 p-3">
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
