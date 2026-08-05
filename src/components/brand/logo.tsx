/**
 * Identidad de Football Career Simulator.
 *
 * `BallMark` es el isotipo (balón metálico, SVG inline: escala sin pérdida y
 * no añade peticiones de red) y `Logo` el lockup con el nombre en degradado
 * dorado sobre el balón, replicando el arte original.
 */

export function BallMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="fcs-ball" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#f2f4f7" />
          <stop offset="42%" stopColor="#9aa3ad" />
          <stop offset="78%" stopColor="#3a4048" />
          <stop offset="100%" stopColor="#0d1014" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#fcs-ball)" />
      <path d="M32 13l9 6.5-3.4 10.6h-11.2L23 19.5z" fill="#12161b" />
      <path d="M13.5 27.5l8.6 3.2 1 11-9 3.3-4.6-8.7z" fill="#12161b" opacity=".92" />
      <path d="M50.5 27.5l4 8.8-4.6 8.7-9-3.3 1-11z" fill="#12161b" opacity=".92" />
      <path d="M26.4 47.2h11.2l3 8.6-8.6 3.4-8.6-3.4z" fill="#12161b" opacity=".85" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="2" />
      <ellipse cx="22" cy="17" rx="10" ry="6" fill="#fff" opacity=".28" transform="rotate(-28 22 17)" />
    </svg>
  );
}

/** Órbita dorada que en el arte original cruza por debajo de «Simulator». */
function Orbit({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 40" className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fcs-orbit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b07c22" />
          <stop offset="45%" stopColor="#f6e7b4" />
          <stop offset="100%" stopColor="#b07c22" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M4 8C-6 24 24 36 96 33c48-2 84-12 100-24"
        fill="none" stroke="url(#fcs-orbit)" strokeWidth="3" strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Lockup de marca.
 * - `compact`: isotipo + «FCS», para la barra de navegación.
 * - completo: nombre en dos líneas con la órbita, para portada y cabeceras.
 */
export function Logo({
  compact = false,
  className = "",
}: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <span className={`flex items-center gap-2 ${className}`}>
        <BallMark className="h-7 w-7 shrink-0" />
        <span className="text-gradient-gold text-lg font-black tracking-tight">FCS</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <span className="text-gradient-gold font-serif text-3xl font-bold leading-none tracking-tight sm:text-4xl">
        Football Career
      </span>
      <span className="relative mt-1 pl-8">
        <span className="text-gradient-gold font-serif text-3xl font-bold leading-none tracking-tight sm:text-4xl">
          Simulator
        </span>
        <Orbit className="absolute -bottom-2 left-0 h-4 w-full" />
      </span>
    </span>
  );
}
