"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRightLeft } from "lucide-react";
import type { ContractOffer } from "@/lib/engine/contracts";
import { getLeague, getTeam } from "@/lib/data/loader";
import { cn, formatMoney } from "@/lib/utils";

/**
 * El mercado de pases, al pie de la tabla y con el mismo lenguaje que las
 * decisiones: se elige una tarjeta, se enciende, las demás se apagan.
 *
 * Tampoco es un modal. Es la última decisión de la temporada y merece verse
 * junto a la carrera que la ha provocado: si vienes de marcar 20 goles en
 * Primera de Chile, la oferta del Brasileirão se lee de otra manera.
 */
export function TransferMarket({
  offers, currentTeamId, currentTeamName, onChoose,
}: {
  offers: ContractOffer[];
  currentTeamId: string;
  currentTeamName: string;
  onChoose: (offer: ContractOffer | null) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Como mucho tres ofertas: con más, la elección se vuelve un formulario.
  const shown = offers.filter(o => o.team.id !== currentTeamId).slice(0, 3);
  const stayTeam = getTeam(currentTeamId);

  function pick(key: string, offer: ContractOffer | null) {
    if (picked) return;
    setPicked(key);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => onChoose(offer), reduce ? 120 : 650);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-card/60 p-4">
      <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent">
        <ArrowRightLeft className="h-3 w-3" /> Mercado de pases
      </p>
      <h2 className="text-lg font-black leading-tight">¿Dónde juegas la temporada que viene?</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {shown.length === 0
          ? "Ningún club se ha movido por ti. Sigues donde estás."
          : "Llegaron ofertas tras tu temporada. Puedes aceptar una o quedarte en tu club."}
      </p>

      <div className={cn("grid gap-2", shown.length >= 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2")}>
        {shown.map(o => (
          <ClubCard
            key={o.team.id}
            kicker="Fichar por"
            name={o.team.name}
            crest={o.team.crest}
            league={getLeague(o.leagueId)?.name ?? ""}
            detail={`${formatMoney(o.wageWeekly)}/sem · ${o.contractYears} años`}
            selected={picked === o.team.id}
            dimmed={picked !== null && picked !== o.team.id}
            onPick={() => pick(o.team.id, o)}
          />
        ))}
        <ClubCard
          kicker="Quedarse en"
          name={stayTeam?.team.name ?? currentTeamName}
          crest={stayTeam?.team.crest}
          league={stayTeam?.league.name ?? ""}
          detail="Sigues con tu contrato"
          selected={picked === "stay"}
          dimmed={picked !== null && picked !== "stay"}
          onPick={() => pick("stay", null)}
        />
      </div>
    </section>
  );
}

function ClubCard({
  kicker, name, crest, league, detail, selected, dimmed, onPick,
}: {
  kicker: string;
  name: string;
  crest?: string;
  league: string;
  detail: string;
  selected: boolean;
  dimmed: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all duration-300",
        "border-white/10 bg-black/25 hover:border-white/40 hover:bg-white/5",
        selected && "border-white bg-white/10",
        dimmed && "border-white/5 opacity-25",
      )}
    >
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kicker}</span>
      <span className="text-sm font-black leading-tight">{name}</span>
      {crest && (
        <Image
          src={crest} alt="" width={44} height={44}
          unoptimized className="my-1 h-11 w-11 object-contain"
        />
      )}
      <span className="text-[10px] leading-tight text-muted-foreground">{league}</span>
      <span className="text-[10px] leading-tight text-muted-foreground/70">{detail}</span>
    </button>
  );
}
