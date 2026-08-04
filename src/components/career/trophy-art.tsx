/**
 * Trofeos dibujados, no escritos.
 *
 * Cada competición tiene su silueta reconocible (la orejona, la copa del
 * Mundial, el balón de oro, la bota…) dibujada como SVG inline: escalan a
 * cualquier tamaño, funcionan sin red y no dependen de imágenes con derechos.
 *
 * `trophyArtFor()` resuelve el nombre que produce `awards.ts` a su dibujo.
 */

export type TrophyKind =
  | "league" | "cup" | "supercup" | "champions" | "worldcup"
  | "ballon" | "boot" | "playmaker" | "mvp" | "generic";

export interface TrophyArt {
  kind: TrophyKind;
  /** Nombre completo, para el tooltip. */
  label: string;
  /** Color dominante, para la vitrina. */
  tone: string;
}

const RULES: { match: RegExp; kind: TrophyKind; tone: string }[] = [
  { match: /balón de oro/i, kind: "ballon", tone: "text-gold" },
  { match: /bota de oro/i, kind: "boot", tone: "text-gold" },
  { match: /rey de las asistencias/i, kind: "playmaker", tone: "text-sky-300" },
  { match: /^mvp/i, kind: "mvp", tone: "text-gold" },
  { match: /mundial/i, kind: "worldcup", tone: "text-gold" },
  { match: /champions|libertadores|europa league/i, kind: "champions", tone: "text-slate-200" },
  { match: /supercopa|supercup|community shield|trophée des champions/i, kind: "supercup", tone: "text-slate-300" },
  { match: /copa|cup|pokal|coppa/i, kind: "cup", tone: "text-slate-300" },
  { match: /laliga|premier|bundesliga|serie a|ligue 1|liga|league|campeonato/i, kind: "league", tone: "text-amber-300" },
];

export function trophyArtFor(name: string): TrophyArt {
  for (const r of RULES) {
    if (r.match.test(name)) return { kind: r.kind, label: name, tone: r.tone };
  }
  return { kind: "generic", label: name, tone: "text-slate-300" };
}

/** Dibujo del trofeo. `title` lo hace accesible y muestra el nombre al pasar. */
export function TrophyIcon({
  name, className = "h-10 w-10",
}: { name: string; className?: string }) {
  const art = trophyArtFor(name);
  return (
    <span className={art.tone} title={art.label}>
      <svg viewBox="0 0 48 64" className={className} role="img" aria-label={art.label}>
        <defs>
          <linearGradient id={`sheen-${art.kind}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity=".85" />
            <stop offset="100%" stopColor="currentColor" stopOpacity=".9" />
          </linearGradient>
        </defs>
        <Shape kind={art.kind} />
      </svg>
    </span>
  );
}

function Shape({ kind }: { kind: TrophyKind }) {
  const fill = `url(#sheen-${kind})`;

  switch (kind) {
    /* Orejona: copa alta con asas curvas enormes. */
    case "champions":
      return (
        <g fill={fill}>
          <path d="M15 10h18v14c0 7-4 12-9 12s-9-5-9-12V10z" />
          <path d="M15 12c-6 0-9 4-9 9s3 10 8 11v-4c-3-1-4-4-4-7s1-5 5-5v-4z" />
          <path d="M33 12c6 0 9 4 9 9s-3 10-8 11v-4c3-1 4-4 4-7s-1-5-5-5v-4z" />
          <rect x="21" y="35" width="6" height="9" />
          <path d="M13 44h22l-2 6H15z" />
          <rect x="10" y="50" width="28" height="6" rx="1.5" />
        </g>
      );

    /* Mundial: dos figuras sosteniendo el globo. */
    case "worldcup":
      return (
        <g fill={fill}>
          <circle cx="24" cy="17" r="9" />
          <path d="M24 26c-5 0-9 3-10 8l-2 12h24l-2-12c-1-5-5-8-10-8z" />
          <path d="M18 21c-2 6-3 15-2 25h-4c-1-11 1-20 6-25z" />
          <path d="M30 21c2 6 3 15 2 25h4c1-11-1-20-6-25z" />
          <rect x="9" y="48" width="30" height="5" rx="1.5" />
          <rect x="12" y="53" width="24" height="5" rx="1.5" />
        </g>
      );

    /* Liga: copa clásica ancha con asas redondas. */
    case "league":
      return (
        <g fill={fill}>
          <path d="M13 9h22v13c0 8-5 13-11 13s-11-5-11-13V9z" />
          <path d="M13 12H8c-3 0-4 3-3 6 1 4 4 7 8 8v-4c-2-1-4-3-4-6h4v-4z" />
          <path d="M35 12h5c3 0 4 3 3 6-1 4-4 7-8 8v-4c2-1 4-3 4-6h-4v-4z" />
          <rect x="21" y="34" width="6" height="8" />
          <path d="M14 42h20l-2 6H16z" />
          <rect x="11" y="48" width="26" height="7" rx="2" />
        </g>
      );

    /* Copa nacional: copa esbelta con tapa. */
    case "cup":
      return (
        <g fill={fill}>
          <path d="M18 6h12l1 4H17z" />
          <path d="M16 11h16v12c0 7-4 11-8 11s-8-4-8-11V11z" />
          <path d="M16 13h-4c-2 0-3 2-2 5 1 3 3 5 6 6v-4c-1-1-2-2-2-3h2v-4z" />
          <path d="M32 13h4c2 0 3 2 2 5-1 3-3 5-6 6v-4c1-1 2-2 2-3h-2v-4z" />
          <rect x="22" y="33" width="4" height="9" />
          <path d="M16 42h16l-1 5H17z" />
          <rect x="13" y="47" width="22" height="6" rx="1.5" />
        </g>
      );

    /* Supercopa: plato / bandeja. */
    case "supercup":
      return (
        <g fill={fill}>
          <ellipse cx="24" cy="26" rx="17" ry="15" />
          <ellipse cx="24" cy="26" rx="11" ry="9" fillOpacity=".35" />
          <rect x="21" y="41" width="6" height="7" />
          <rect x="14" y="48" width="20" height="6" rx="1.5" />
        </g>
      );

    /* Balón de Oro: balón sobre pedestal. */
    case "ballon":
      return (
        <g fill={fill}>
          <circle cx="24" cy="20" r="13" />
          <path d="M24 10l5 3.6-1.9 5.9h-6.2L19 13.6z" fillOpacity=".35" />
          <rect x="21" y="33" width="6" height="8" />
          <path d="M15 41h18l-2 6H17z" />
          <rect x="12" y="47" width="24" height="7" rx="2" />
        </g>
      );

    /* Bota de Oro. */
    case "boot":
      return (
        <g fill={fill}>
          <path d="M8 30c0-6 3-11 9-12l10-2c3-.5 5 1 5 4v6h6c4 0 6 3 6 6v6H10c-1.5 0-2-1.5-2-3v-5z" />
          <rect x="8" y="44" width="34" height="5" rx="1.5" />
          <circle cx="16" cy="49" r="2" fillOpacity=".5" />
          <circle cx="24" cy="49" r="2" fillOpacity=".5" />
          <circle cx="32" cy="49" r="2" fillOpacity=".5" />
        </g>
      );

    /* Rey de las asistencias: bota con estela de pase. */
    case "playmaker":
      return (
        <g fill={fill}>
          <path d="M10 26c0-5 3-9 8-10l8-1.6c2.5-.4 4 .8 4 3.2v5h5c3.4 0 5 2.4 5 5v5H12c-1.3 0-2-1.2-2-2.4V26z" />
          <rect x="10" y="38" width="28" height="4" rx="1.5" />
          <path d="M6 50h36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 4" fill="none" />
        </g>
      );

    /* MVP: estrella sobre pedestal. */
    case "mvp":
      return (
        <g fill={fill}>
          <path d="M24 6l5.3 10.8 11.9 1.7-8.6 8.4 2 11.9L24 33.2l-10.6 5.6 2-11.9-8.6-8.4 11.9-1.7z" />
          <rect x="21" y="40" width="6" height="7" />
          <rect x="13" y="47" width="22" height="7" rx="2" />
        </g>
      );

    default:
      return (
        <g fill={fill}>
          <path d="M15 10h18v13c0 7-4 12-9 12s-9-5-9-12V10z" />
          <rect x="21" y="35" width="6" height="8" />
          <rect x="12" y="43" width="24" height="7" rx="2" />
        </g>
      );
  }
}

/**
 * Vitrina de trofeos. En móvil envuelve y reduce el tamaño; en escritorio
 * muestra el nombre bajo cada pieza.
 */
export function TrophyCase({
  trophies, size = "md", showLabels = false,
}: { trophies: string[]; size?: "sm" | "md" | "lg"; showLabels?: boolean }) {
  if (trophies.length === 0) {
    return <p className="text-xs text-muted-foreground">Vitrina vacía</p>;
  }
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-14 w-14" : "h-10 w-10";

  return (
    <ul className="flex flex-wrap items-end gap-x-3 gap-y-2">
      {trophies.map((t, i) => (
        <li key={`${t}-${i}`} className="flex flex-col items-center gap-1">
          <TrophyIcon name={t} className={dim} />
          {showLabels && (
            <span className="max-w-[5.5rem] text-center text-[10px] leading-tight text-muted-foreground">
              {t.replace(/^🏆\s*/, "")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
