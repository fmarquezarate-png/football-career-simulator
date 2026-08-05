/**
 * Genera `public/data/leagues/*.json`, el índice de ligas y los escudos.
 *
 *  - Ligas europeas (`repoDir`): nombres y escudos reales del repositorio de
 *    logos. Se copian a `public/crests/`.
 *  - Ligas del resto del mundo (`teams`): el escudo se dibuja a partir de los
 *    colores reales del club y sus iniciales, y se guarda como SVG.
 *
 * Las valoraciones salen de la fuerza de la liga y de la posición del equipo
 * dentro de ella, con ruido determinista para que dos ejecuciones den lo mismo.
 *
 * Uso:
 *   git clone --depth 1 https://github.com/luukhopman/football-logos /tmp/fl
 *   node scripts/build-leagues.mjs /tmp/fl
 */
import { readdirSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LEAGUES } from "./leagues.config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = process.argv[2];
const OUT_DATA = join(ROOT, "public/data/leagues");
const OUT_CRESTS = join(ROOT, "public/crests");

if (!SOURCE || !existsSync(join(SOURCE, "logos"))) {
  console.error("Uso: node scripts/build-leagues.mjs <ruta-al-clon-de-football-logos>");
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** Hash estable de una cadena: mismo nombre → mismo ruido siempre. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function slug(name) {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Iniciales para el escudo generado: 1-3 letras significativas. */
function initials(name) {
  const STOP = new Set(["de", "del", "la", "el", "fc", "cf", "ac", "sc", "cd", "club", "atletico", "atlético"]);
  const words = name.replace(/[^\p{L}\s'-]/gu, " ").split(/[\s'-]+/).filter(Boolean);
  const strong = words.filter(w => !STOP.has(w.toLowerCase()));
  const pool = strong.length ? strong : words;
  if (pool.length === 1) return pool[0].slice(0, 3).toUpperCase();
  return pool.slice(0, 3).map(w => w[0]).join("").toUpperCase();
}

function shortName(name) {
  const clean = name.replace(/\b(FC|CF|AC|AS|SC|CD|UD|RC|RCD|CA|SS|SSC|US|SK|JK|KV)\b/g, "").trim();
  return (clean.split(/\s+/)[0] || name).slice(0, 12);
}

/* ------------------------------------------------------------------ */
/* Escudo generado (ligas sin escudo real disponible)                  */
/* ------------------------------------------------------------------ */

function crestSvg(name, [primary, secondary]) {
  const txt = initials(name);
  const size = txt.length >= 3 ? 26 : 32;
  // Blasón clásico: banda superior en el color secundario e iniciales encima.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 88">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${primary}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity=".78"/>
    </linearGradient>
  </defs>
  <path d="M4 4h72v46c0 18-14 28-36 34C18 78 4 68 4 50z" fill="url(#g)" stroke="${secondary}" stroke-width="4"/>
  <path d="M4 26h72v14H4z" fill="${secondary}" opacity=".92"/>
  <text x="40" y="${txt.length >= 3 ? 62 : 64}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-weight="700"
        font-size="${size}" fill="${secondary}">${txt}</text>
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* Índice de escudos reales                                            */
/* ------------------------------------------------------------------ */

const LOGO_ROOTS = [join(SOURCE, "logos")];
const HISTORY = join(SOURCE, "history");
if (existsSync(HISTORY)) {
  for (const season of readdirSync(HISTORY).sort().reverse()) LOGO_ROOTS.push(join(HISTORY, season));
}

/** Devuelve los ficheros de una liga del repo, buscando en todas las temporadas. */
function repoTeams(dir) {
  for (const root of LOGO_ROOTS) {
    const path = join(root, dir);
    if (existsSync(path)) {
      return readdirSync(path)
        .filter(f => f.endsWith(".png"))
        .map(f => ({ name: f.replace(/\.png$/, ""), file: join(path, f) }));
    }
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Construcción                                                        */
/* ------------------------------------------------------------------ */

mkdirSync(OUT_DATA, { recursive: true });
mkdirSync(OUT_CRESTS, { recursive: true });
// Se regenera entero para que no queden escudos huérfanos de ligas retiradas.
rmSync(OUT_CRESTS, { recursive: true, force: true });
mkdirSync(OUT_CRESTS, { recursive: true });

const index = [];
const seenIds = new Set();
let totalTeams = 0;
let generated = 0;

for (const league of LEAGUES) {
  /** @type {{name:string, city?:string, colors?:string[], file?:string}[]} */
  let roster;

  if (league.repoDir) {
    const found = repoTeams(league.repoDir);
    if (found.length === 0) {
      console.error(`  ⚠ ${league.id}: no se encontró "${league.repoDir}" en el repositorio de logos`);
      continue;
    }
    // Los `top` primero en el orden dado; el resto alfabético, para que la
    // jerarquía de la liga sea creíble y estable entre ejecuciones.
    const top = (league.top ?? []);
    const rest = found.filter(t => !top.includes(t.name)).sort((a, b) => a.name.localeCompare(b.name));
    roster = [...top.map(n => found.find(t => t.name === n)).filter(Boolean), ...rest];
  } else {
    roster = league.teams;
  }

  const n = roster.length;
  const teams = roster.map((t, i) => {
    const id = `${league.id}-${slug(t.name)}`;
    if (seenIds.has(id)) throw new Error(`id duplicado: ${id}`);
    seenIds.add(id);

    // El primero de la liga está ~8 puntos por encima de su fuerza media y el
    // último ~10 por debajo.
    const spread = 8 - (i / Math.max(n - 1, 1)) * 18;
    const noise = (hash(t.name) - 0.5) * 3;
    const overall = Math.round(Math.max(38, Math.min(92, league.strength + spread + noise)));

    const vary = (seed) => Math.round(overall + (hash(t.name + seed) - 0.5) * 6);
    const attack = Math.max(35, Math.min(95, vary("a")));
    const midfield = Math.max(35, Math.min(95, vary("m")));
    const defense = Math.max(35, Math.min(95, vary("d")));

    let crest;
    if (t.file) {
      copyFileSync(t.file, join(OUT_CRESTS, `${id}.png`));
      crest = `/crests/${id}.png`;
    } else {
      writeFileSync(join(OUT_CRESTS, `${id}.svg`), crestSvg(t.name, t.colors ?? ["#1f2937", "#e5e7eb"]));
      crest = `/crests/${id}.svg`;
      generated++;
    }

    // Presupuesto y tope salarial crecen muy rápido con el nivel: la brecha
    // entre una liga top y una modesta tiene que notarse en los contratos.
    const money = Math.pow(Math.max(overall - 40, 1), 2.35) * (league.strength / 60);
    return {
      id,
      name: t.name,
      shortName: shortName(t.name),
      city: t.city ?? league.country,
      overall, attack, midfield, defense,
      prestige: Math.round(Math.max(20, Math.min(99, overall + (league.strength - 65) * 0.35))),
      budget: Math.round(money * 55000),
      wageCeiling: Math.round(money * 95),
      crest,
    };
  });

  totalTeams += teams.length;

  writeFileSync(
    join(OUT_DATA, `${league.id}.json`),
    JSON.stringify({
      id: league.id,
      name: league.name,
      country: league.country,
      countryCode: league.countryCode,
      confederation: league.confederation,
      strength: league.strength,
      season: "2026",
      rounds: league.rounds,
      teams,
    }, null, 2) + "\n",
  );

  index.push({
    id: league.id, name: league.name, country: league.country,
    countryCode: league.countryCode, confederation: league.confederation,
    strength: league.strength, teams: teams.length, rounds: league.rounds,
  });
  console.log(`  ${league.id.padEnd(5)} ${String(teams.length).padStart(2)} equipos · ${league.country}`);
}

writeFileSync(join(OUT_DATA, "index.json"), JSON.stringify(index, null, 2) + "\n");

console.log(`\nligas: ${index.length} · equipos: ${totalTeams} · escudos generados: ${generated} · reales: ${totalTeams - generated}`);
