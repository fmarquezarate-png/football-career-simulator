/**
 * Descarga los escudos de los 96 clubes a `public/crests/` y reescribe el campo
 * `crest` de cada equipo en `public/data/leagues/*.json`.
 *
 * Por qué son locales y no enlazados:
 * `upload.wikimedia.org` responde 403 al hotlinking desde otro dominio, así que
 * los escudos enlazados nunca llegaban a cargar en producción. Sirviéndolos
 * desde `public/` van por el CDN de Vercel y no dependen de terceros.
 *
 * Fuente: https://github.com/luukhopman/football-logos (escudos de las 25 ligas
 * UEFA principales, temporadas 2021/22 a 2026/27). Los clubes que hoy están en
 * segunda división se recuperan del histórico de la última temporada en la que
 * jugaron en la máxima categoría.
 *
 * Uso:
 *   git clone --depth 1 https://github.com/luukhopman/football-logos /tmp/fl
 *   node scripts/sync-crests.mjs /tmp/fl
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = process.argv[2];

if (!SOURCE || !existsSync(join(SOURCE, "logos"))) {
  console.error("Uso: node scripts/sync-crests.mjs <ruta-al-clon-de-football-logos>");
  process.exit(1);
}

const OUT = join(ROOT, "public/crests");
const LEAGUES = ["es1", "en1", "de1", "it1", "fr1"];

// Temporada vigente primero; luego el histórico de más nueva a más antigua.
const HISTORY = join(SOURCE, "history");
const ROOTS = [join(SOURCE, "logos")];
if (existsSync(HISTORY)) {
  for (const season of readdirSync(HISTORY).sort().reverse()) ROOTS.push(join(HISTORY, season));
}

const INDEX = [];
const seen = new Set();
for (const root of ROOTS) {
  for (const dir of readdirSync(root)) {
    for (const file of readdirSync(join(root, dir))) {
      if (!file.endsWith(".png")) continue;
      const name = file.replace(/\.png$/, "");
      if (seen.has(name)) continue; // gana la aparición más reciente
      seen.add(name);
      INDEX.push({ path: join(root, dir, file), name });
    }
  }
}

/** Ruido societario que no aporta a la comparación de nombres. */
const STOP = new Set([
  "fc", "cf", "ac", "as", "sc", "cd", "ud", "rc", "rcd", "ca", "ss", "ssc", "us",
  "vfl", "vfb", "tsg", "sv", "afc", "sco", "hsc", "losc", "estac", "calcio",
  "club", "de", "the", "1", "04", "05", "07", "1846", "1848", "1899", "1907",
  "1909", "1913", "and", "&",
]);

function tokens(s) {
  return new Set(
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
      .filter(t => t && !STOP.has(t)),
  );
}

function score(a, b) {
  let hit = 0;
  for (const t of a) if (b.has(t)) hit++;
  if (hit === 0) return 0;
  return hit / Math.max(a.size, 1) - 0.05 * Math.max(0, b.size - hit);
}

/** Casos donde el parecido textual engaña y hay que forzar el emparejamiento. */
const FORCE = {
  "RC Celta": "Celta de Vigo",
  "Athletic Club": "Athletic Bilbao",
  "Inter": "Inter Milan",
  "Brighton": "Brighton & Hove Albion",
  "Bournemouth": "AFC Bournemouth",
  "Bayern München": "Bayern Munich",
  "Borussia M'gladbach": "Borussia Mönchengladbach",
  "Olympique de Marseille": "Olympique Marseille",
  "Olympique Lyonnais": "Olympique Lyon",
  "Lille OSC": "LOSC Lille",
  "PSG": "Paris Saint-Germain",
  "Stade Rennais": "Stade Rennais FC",
  "Stade Brestois": "Stade Brestois 29",
  "RC Strasbourg": "RC Strasbourg Alsace",
  "Toulouse FC": "FC Toulouse",
  "Hoffenheim": "TSG 1899 Hoffenheim",
  "Union Berlin": "1.FC Union Berlin",
};

const INDEXED = INDEX.map(e => ({ ...e, tk: tokens(e.name) }));
mkdirSync(OUT, { recursive: true });

const ids = new Map();
let matched = 0;
const missing = [];

for (const leagueId of LEAGUES) {
  const path = join(ROOT, "public/data/leagues", `${leagueId}.json`);
  const league = JSON.parse(readFileSync(path, "utf8"));

  for (const team of league.teams) {
    // Los ids deben ser únicos entre ligas: el motor busca equipos por id.
    if (ids.has(team.id)) {
      throw new Error(`id duplicado "${team.id}": ${ids.get(team.id)} y ${team.name}`);
    }
    ids.set(team.id, team.name);

    let best = FORCE[team.name]
      ? INDEXED.find(e => e.name === FORCE[team.name]) ?? null
      : null;

    if (!best) {
      const tk = tokens(team.name);
      let bestScore = 0;
      for (const entry of INDEXED) {
        const s = score(tk, entry.tk);
        if (s > bestScore) { bestScore = s; best = entry; }
      }
      if (bestScore < 0.6) best = null;
    }

    if (best) {
      copyFileSync(best.path, join(OUT, `${team.id}.png`));
      team.crest = `/crests/${team.id}.png`;
      matched++;
    } else {
      missing.push(`${leagueId} · ${team.name}`);
    }
  }
  writeFileSync(path, JSON.stringify(league, null, 2) + "\n");
}

console.log(`escudos sincronizados: ${matched}/${ids.size}`);
if (missing.length) {
  console.log(`\nSIN ESCUDO (${missing.length}):`);
  missing.forEach(m => console.log("  " + m));
  process.exitCode = 1;
}
