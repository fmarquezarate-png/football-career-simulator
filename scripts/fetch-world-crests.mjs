/**
 * Descarga los escudos oficiales de las ligas de fuera de Europa.
 *
 * Las 24 ligas europeas ya usan escudos reales (ver `build-leagues.mjs`). Este
 * script cubre las nueve restantes —Chile, Argentina, Brasil, México, Estados
 * Unidos, Japón, Colombia, Uruguay y Arabia Saudí— sustituyendo los blasones
 * generados por el escudo real de cada club.
 *
 * Dos fuentes, en cascada:
 *   1. **TheSportsDB** — API abierta con insignias en PNG transparente.
 *   2. **Wikipedia / Wikimedia Commons** — imagen principal del artículo del
 *      club, que en la práctica es siempre su escudo oficial.
 *
 * Si un club no aparece en ninguna, conserva su escudo generado y se avisa al
 * final para poder añadir un `search` manual en `leagues.config.mjs`.
 *
 * ⚠️ Hay que ejecutarlo desde una máquina con salida a internet sin filtrar.
 *    No funciona dentro de entornos que bloqueen esos dominios.
 *
 * Uso:
 *   node scripts/fetch-world-crests.mjs            # descarga y actualiza
 *   node scripts/fetch-world-crests.mjs --dry      # solo informa, no escribe
 *   THESPORTSDB_KEY=tuclave node scripts/fetch-world-crests.mjs
 *
 * Después:
 *   git add public/crests public/data && git commit -m "escudos reales"
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LEAGUES } from "./leagues.config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_CRESTS = join(ROOT, "public/crests");
const OUT_DATA = join(ROOT, "public/data/leagues");
const DRY = process.argv.includes("--dry");
// `3` es la clave pública de pruebas de TheSportsDB. Con una propia hay menos
// límite de peticiones.
const SDB_KEY = process.env.THESPORTSDB_KEY || "3";

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Nombre del país tal y como lo escribe TheSportsDB. */
const SDB_COUNTRY = {
  cl1: "Chile", ar1: "Argentina", br1: "Brazil", mx1: "Mexico",
  us1: "USA", jp1: "Japan", co1: "Colombia", uy1: "Uruguay", sa1: "Saudi Arabia",
};

/** Sufijo para desambiguar en Wikipedia cuando el nombre es genérico. */
const WIKI_HINT = {
  cl1: "club de fútbol Chile", ar1: "club de fútbol Argentina",
  br1: "clube de futebol Brasil", mx1: "club de fútbol México",
  us1: "soccer club", jp1: "football club Japan",
  co1: "club de fútbol Colombia", uy1: "club de fútbol Uruguay",
  sa1: "football club Saudi Arabia",
};

function normalize(s) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/* ------------------------------------------------------------------ */
/* Fuente 1 · TheSportsDB                                              */
/* ------------------------------------------------------------------ */

async function fromSportsDB(name, leagueId) {
  const url = `https://www.thesportsdb.com/api/v1/json/${SDB_KEY}/searchteams.php?t=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { "User-Agent": "football-career-simulator" } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.teams) return null;

  const country = SDB_COUNTRY[leagueId];
  const target = normalize(name);

  // Preferimos el equipo de fútbol del país correcto cuyo nombre encaje.
  const candidates = data.teams.filter(t => t.strSport === "Soccer" && t.strBadge);
  const best =
    candidates.find(t => t.strCountry === country && normalize(t.strTeam) === target) ??
    candidates.find(t => t.strCountry === country && normalize(t.strTeam).includes(target)) ??
    candidates.find(t => t.strCountry === country) ??
    null;

  return best ? { url: best.strBadge, via: `TheSportsDB · ${best.strTeam}` } : null;
}

/* ------------------------------------------------------------------ */
/* Fuente 2 · Wikipedia / Wikimedia Commons                            */
/* ------------------------------------------------------------------ */

async function fromWikipedia(name, leagueId) {
  const lang = ["br1"].includes(leagueId) ? "pt"
    : ["us1", "jp1", "sa1"].includes(leagueId) ? "en" : "es";
  const api = `https://${lang}.wikipedia.org/w/api.php`;

  // 1) Buscar el artículo del club.
  const searchUrl = `${api}?action=query&list=search&format=json&origin=*`
    + `&srsearch=${encodeURIComponent(`${name} ${WIKI_HINT[leagueId] ?? ""}`)}&srlimit=3`;
  const searchRes = await fetch(searchUrl, { headers: { "User-Agent": "football-career-simulator" } });
  if (!searchRes.ok) return null;
  const search = await searchRes.json().catch(() => null);
  const title = search?.query?.search?.[0]?.title;
  if (!title) return null;

  // 2) Imagen principal del artículo: en los clubes es el escudo.
  const imgUrl = `${api}?action=query&prop=pageimages&format=json&origin=*`
    + `&piprop=original&titles=${encodeURIComponent(title)}`;
  const imgRes = await fetch(imgUrl, { headers: { "User-Agent": "football-career-simulator" } });
  if (!imgRes.ok) return null;
  const img = await imgRes.json().catch(() => null);
  const pages = img?.query?.pages ?? {};
  const original = Object.values(pages)[0]?.original?.source;

  return original ? { url: original, via: `Wikipedia ${lang} · ${title}` } : null;
}

/* ------------------------------------------------------------------ */

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": "football-career-simulator" } });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") ?? "";
  if (!/image\//.test(type)) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  // Descartamos iconos diminutos o respuestas de error disfrazadas.
  if (buf.length < 1500) return null;
  const ext = /svg/.test(type) ? "svg" : /png/.test(type) ? "png" : /jpe?g/.test(type) ? "jpg" : null;
  return ext ? { buf, ext } : null;
}

const worldLeagues = LEAGUES.filter(l => !l.repoDir);
const found = [];
const missing = [];

for (const league of worldLeagues) {
  const path = join(OUT_DATA, `${league.id}.json`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  console.log(`\n${league.country} (${league.id})`);

  for (const team of data.teams) {
    const config = league.teams.find(t => t.name === team.name);
    const query = config?.search ?? team.name;

    let hit = null;
    try {
      hit = await fromSportsDB(query, league.id);
      if (!hit) hit = await fromWikipedia(query, league.id);
    } catch (e) {
      console.log(`  ⚠ ${team.name}: ${e.message}`);
    }

    if (!hit) {
      missing.push(`${league.id} · ${team.name}`);
      console.log(`  ✗ ${team.name} — se queda con el escudo generado`);
      await sleep(350);
      continue;
    }

    const file = await download(hit.url);
    if (!file) {
      missing.push(`${league.id} · ${team.name} (descarga fallida)`);
      console.log(`  ✗ ${team.name} — no se pudo descargar`);
      await sleep(350);
      continue;
    }

    if (!DRY) {
      // Fuera el SVG generado para que no queden dos escudos del mismo club.
      const old = join(OUT_CRESTS, `${team.id}.svg`);
      if (existsSync(old)) unlinkSync(old);
      writeFileSync(join(OUT_CRESTS, `${team.id}.${file.ext}`), file.buf);
      team.crest = `/crests/${team.id}.${file.ext}`;
    }
    found.push(team.name);
    console.log(`  ✓ ${team.name} — ${hit.via}`);
    await sleep(350);
  }

  if (!DRY) writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

console.log(`\n${DRY ? "[simulación] " : ""}escudos reales: ${found.length} · sin encontrar: ${missing.length}`);
if (missing.length) {
  console.log("\nEstos conservan su escudo generado. Para afinarlos, añade un");
  console.log("campo `search` con el nombre exacto en scripts/leagues.config.mjs:");
  missing.forEach(m => console.log("  " + m));
}
