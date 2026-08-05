/**
 * De dónde sale cada futbolista.
 *
 * En la vida real un chileno de 18 años debuta casi siempre en Chile. Puede
 * dar el salto a Argentina o Brasil por cercanía y contactos, y solo unos
 * pocos aterrizan directamente en Europa. Este módulo modela esa realidad:
 *
 *  1. `HOME_LEAGUE` asocia cada país con su liga, si el juego la incluye.
 *  2. `NEIGHBOURS` define a qué otras ligas puede saltar un canterano de ese
 *     país sin ser un fenómeno: fútbol vecino o vínculo histórico.
 *  3. `originWeights()` reparte la probabilidad entre casa, vecinos y el resto
 *     del mundo, y la dificultad decide cuánto empuja hacia arriba.
 *
 * Un jugador de un país sin liga en el juego (pongamos Senegal) se comporta
 * como lo hacen de verdad esos futbolistas: sale fuera desde el principio,
 * hacia las ligas con las que su país tiene vía de entrada.
 */

/** País → liga doméstica del juego. */
export const HOME_LEAGUE: Record<string, string> = {
  "gb-eng": "en1", es: "es1", it: "it1", de: "de1", fr: "fr1",
  pt: "pt1", nl: "nl1", tr: "tr1", be: "be1", at: "at1", ch: "ch1",
  gr: "gr1", "gb-sct": "sco1", cz: "cz1", dk: "dk1", pl: "pl1",
  hr: "hr1", ua: "ua1", rs: "rs1", no: "no1", se: "se1", ro: "ro1",
  il: "il1", bg: "bg1",
  br: "br1", ar: "ar1", mx: "mx1", sa: "sa1", us: "us1", jp: "jp1",
  co: "co1", cl: "cl1", uy: "uy1",
};

/**
 * Ligas de salida natural por país. Primero las más probables.
 * Para países sin liga propia, esta lista *es* su punto de partida.
 */
export const NEIGHBOURS: Record<string, string[]> = {
  // Sudamérica: el circuito interno manda, después Portugal y España.
  cl: ["ar1", "br1", "mx1", "pt1", "us1"],
  uy: ["ar1", "br1", "mx1", "pt1", "es1"],
  co: ["ar1", "br1", "mx1", "pt1", "us1"],
  ar: ["br1", "mx1", "pt1", "es1", "it1"],
  br: ["pt1", "ar1", "mx1", "it1", "es1"],
  pe: ["cl1", "ar1", "br1", "mx1", "co1"],
  bo: ["cl1", "ar1", "br1", "co1"],
  py: ["ar1", "br1", "cl1", "mx1"],
  ec: ["ar1", "br1", "mx1", "co1", "cl1"],
  ve: ["co1", "ar1", "br1", "mx1", "us1"],

  // Centroamérica y Caribe hacia México y MLS.
  cr: ["mx1", "us1", "co1"], pa: ["mx1", "us1", "co1"],
  hn: ["mx1", "us1"], gt: ["mx1", "us1"], sv: ["mx1", "us1"],
  jm: ["us1", "en1"], ca: ["us1", "mx1"], do: ["us1", "mx1"], cu: ["mx1", "us1"],

  // Europa: las grandes ligas absorben a sus vecinas.
  pt: ["es1", "en1", "fr1", "br1"],
  es: ["en1", "it1", "pt1", "fr1"],
  fr: ["en1", "be1", "es1", "it1"],
  de: ["at1", "ch1", "nl1", "en1"],
  it: ["en1", "es1", "fr1", "ch1"],
  nl: ["be1", "de1", "en1", "pt1"],
  be: ["nl1", "fr1", "de1", "en1"],
  at: ["de1", "ch1", "it1"], ch: ["de1", "fr1", "it1", "at1"],
  "gb-sct": ["en1", "be1", "nl1"],
  "gb-wls": ["en1", "sco1"], "gb-nir": ["en1", "sco1"], ie: ["en1", "sco1"],
  dk: ["se1", "no1", "nl1", "de1"], no: ["se1", "dk1", "nl1", "en1"],
  se: ["dk1", "no1", "nl1", "en1"], fi: ["se1", "no1", "dk1"],
  pl: ["cz1", "de1", "nl1"], cz: ["pl1", "at1", "de1"],
  hr: ["rs1", "at1", "it1"], rs: ["hr1", "at1", "gr1"],
  ba: ["hr1", "rs1", "at1"], si: ["hr1", "at1", "it1"],
  mk: ["rs1", "gr1", "hr1"], me: ["rs1", "hr1", "gr1"], al: ["gr1", "it1", "hr1"],
  gr: ["it1", "tr1", "cy"], tr: ["gr1", "de1", "be1"],
  ro: ["bg1", "hr1", "it1"], bg: ["ro1", "gr1", "tr1"],
  ua: ["pl1", "tr1", "cz1"], ru: ["tr1", "rs1", "ua1"], by: ["ua1", "pl1", "ru"],
  hu: ["at1", "cz1", "pl1"], sk: ["cz1", "at1", "pl1"],
  ee: ["se1", "no1", "pl1"], lv: ["pl1", "se1", "ua1"], lt: ["pl1", "se1", "ua1"],
  il: ["gr1", "be1", "nl1"], cy: ["gr1", "il1"],

  // África: rutas históricas hacia Francia, Bélgica, Portugal y Turquía.
  ma: ["fr1", "be1", "es1", "pt1", "tr1"],
  dz: ["fr1", "be1", "tr1", "pt1"], tn: ["fr1", "be1", "tr1"],
  sn: ["fr1", "be1", "pt1", "tr1"], ci: ["fr1", "be1", "tr1", "pt1"],
  cm: ["fr1", "be1", "tr1", "pt1"], ml: ["fr1", "be1", "pt1"],
  bf: ["fr1", "be1", "pt1"], gn: ["fr1", "be1", "pt1"],
  cd: ["be1", "fr1", "pt1"], cg: ["fr1", "be1", "pt1"],
  ga: ["fr1", "be1", "tr1"], tg: ["fr1", "be1"], bj: ["fr1", "be1"],
  ng: ["be1", "nl1", "pt1", "en1"], gh: ["be1", "nl1", "pt1", "en1"],
  eg: ["tr1", "sa1", "be1", "pt1"], za: ["be1", "nl1", "pt1"],
  ao: ["pt1", "be1", "fr1"], mz: ["pt1", "be1"], cv: ["pt1", "nl1", "be1"],
  ke: ["be1", "se1", "tr1"], ug: ["be1", "se1"], tz: ["be1", "se1"],
  zm: ["be1", "za" ], zw: ["za", "be1"], et: ["sa1", "tr1"],
  ly: ["tr1", "sa1", "eg"], sd: ["sa1", "eg"], so: ["sa1", "tr1"],

  // Asia y Oceanía.
  jp: ["de1", "be1", "nl1", "pt1"], kr: ["de1", "be1", "pt1", "jp1"],
  cn: ["jp1", "pt1", "be1"], au: ["en1", "sco1", "jp1", "us1"],
  nz: ["au", "us1", "en1"], id: ["jp1", "nl1"], th: ["jp1", "be1"],
  vn: ["jp1", "th"], my: ["jp1"], ph: ["jp1", "us1"],
  ir: ["sa1", "tr1", "pt1"], iq: ["sa1", "tr1"], sy: ["sa1", "tr1"],
  sa: ["tr1", "pt1", "es1"], ae: ["sa1", "tr1"], qa: ["sa1", "tr1"],
  kw: ["sa1", "tr1"], jo: ["sa1", "tr1"], lb: ["sa1", "tr1"],
  uz: ["ru", "tr1", "sa1"], kz: ["ru", "tr1"], in: ["jp1", "sa1"],
  am: ["ru", "tr1", "gr1"], ge: ["ua1", "tr1", "ru"], az: ["tr1", "ru"],

  // Norteamérica.
  us: ["mx1", "en1", "nl1", "be1"],
};

/**
 * Reparto de probabilidad del club de debut.
 *
 * Devuelve pesos por liga. La dificultad no cambia el país de origen —
 * eso lo fija la nacionalidad— sino cuánto empuja hacia ligas mejores: un
 * «Promesa de oro» chileno puede debutar en Europa; un «Leyenda» chileno
 * empieza en Chile sí o sí.
 */
export function originWeights(
  nationality: string,
  difficulty: "easy" | "normal" | "hard" | "legendary",
  availableLeagues: string[],
): Record<string, number> {
  const home = HOME_LEAGUE[nationality];
  const neighbours = (NEIGHBOURS[nationality] ?? []).filter(l => availableLeagues.includes(l));

  // Cuánto empuja la dificultad hacia fuera de casa.
  const abroad = { easy: 0.55, normal: 0.28, hard: 0.14, legendary: 0.06 }[difficulty];

  const weights: Record<string, number> = {};
  const hasHome = Boolean(home && availableLeagues.includes(home));

  if (hasHome) {
    weights[home] = (1 - abroad) * 100;
  }

  // Los vecinos se reparten la salida, decreciendo por orden.
  //
  // Sin liga propia (un senegalés, un marroquí) las rutas de salida *son* su
  // punto de partida, así que se llevan casi todo el peso. De lo contrario, en
  // dificultades altas el 94% restante se repartía a partes iguales entre las
  // 33 ligas y un canterano senegalés acababa debutando en Chile o Japón.
  const neighbourShare = (hasHome ? abroad * 0.75 : 1 - abroad * 0.35) * 100;
  let acc = 0;
  const decay = neighbours.map((_, i) => 1 / (i + 1.4));
  const decaySum = decay.reduce((a, b) => a + b, 0) || 1;
  neighbours.forEach((league, i) => {
    const w = (neighbourShare * decay[i]) / decaySum;
    weights[league] = (weights[league] ?? 0) + w;
    acc += w;
  });

  // El resto se reparte por el mundo, favoreciendo ligas potentes: es la vía
  // del futbolista excepcional al que ficha un grande siendo un crío.
  const remaining = 100 - (hasHome ? weights[home] : 0) - acc;
  if (remaining > 0) {
    const others = availableLeagues.filter(l => l !== home && !neighbours.includes(l));
    others.forEach(l => { weights[l] = (weights[l] ?? 0) + remaining / others.length; });
  }

  // Sin país de origen ni vecinos conocidos, todo el peso al mundo.
  if (Object.keys(weights).length === 0) {
    availableLeagues.forEach(l => { weights[l] = 1; });
  }
  return weights;
}
