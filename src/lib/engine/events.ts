import type {
  AppliedEventOutcome, CareerState, ChoiceRisk, EventChoice, EventTemplate, RollResult,
} from "../data/types";
import { normal, clamp, pickWeighted, type Rng } from "./rng";

/**
 * Biblioteca de eventos narrativos.
 * Cada evento tiene 3-5 elecciones. Cada elección define un `qualityBias`
 * (favorable o no) que se traduce en el mu de una distribución normal
 * de la que sacamos los deltas (goles/asistencias/moral/reputación/overall/fitness).
 */
export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    key: "coach_role",
    title: "El técnico redefine tu rol",
    description: "El entrenador te llama al despacho. Está pensando en cambiar tu función táctica esta temporada.",
    weight: 10,
    choices: [
      { key: "accept", label: "Aceptar el nuevo rol y adaptarme", qualityBias: 0.5, description: "Corres riesgo pero puedes crecer.", outcomeSummary: "+overall, +moral, ±goles" },
      { key: "negotiate", label: "Negociar un rol híbrido", qualityBias: 0.2, description: "Zona segura.", outcomeSummary: "Cambios moderados" },
      { key: "refuse", label: "Rechazar de plano", qualityBias: -0.7, description: "El técnico se enfada. Menos minutos posibles.", outcomeSummary: "-moral, -reputación" },
      { key: "team_meeting", label: "Reunir al vestuario para decidir", qualityBias: 0.35, description: "Ganas influencia en el grupo.", outcomeSummary: "+reputación" },
    ],
  },
  {
    key: "renewal_offer",
    title: "El club te ofrece renovación",
    description: "Llega una oferta de renovación a mitad de temporada. Tu agente quiere saber tu postura.",
    weight: 8,
    choices: [
      { key: "sign_now", label: "Firmar ya, tranquilidad total", qualityBias: 0.4, description: "Enfoque en lo deportivo.", outcomeSummary: "+moral, +fitness" },
      { key: "counter", label: "Pedir mejora salarial y cláusula", qualityBias: 0.1, description: "Puede salir bien o generar tensión.", outcomeSummary: "±moral" },
      { key: "delay", label: "Esperar al mercado", qualityBias: -0.2, description: "Presión mediática asegurada.", outcomeSummary: "-moral" },
      { key: "reject", label: "Rechazar y pedir la salida", qualityBias: -0.4, description: "Vestuario dividido.", outcomeSummary: "-moral, -reputación" },
    ],
  },
  {
    key: "press_criticism",
    title: "La prensa te ataca",
    description: "Un rendimiento discreto te pone en el ojo del huracán mediático.",
    weight: 10,
    choices: [
      { key: "silence", label: "Silencio y trabajo", qualityBias: 0.3, description: "Clásico y efectivo.", outcomeSummary: "+overall" },
      { key: "respond", label: "Responder públicamente", qualityBias: -0.3, description: "Puede volverse contra ti.", outcomeSummary: "±reputación" },
      { key: "social", label: "Publicar en redes con ironía", qualityBias: -0.5, description: "Cortoplacista.", outcomeSummary: "-moral" },
      { key: "extra_training", label: "Doblar entrenamientos", qualityBias: 0.55, description: "Método puro.", outcomeSummary: "+overall, -fitness" },
    ],
  },
  {
    key: "injury_risk",
    title: "Molestias musculares",
    description: "El fisio detecta sobrecarga en el isquiotibial. Toca decidir.",
    weight: 12,
    choices: [
      { key: "rest", label: "Parar dos semanas", qualityBias: 0.5, description: "Prevención inteligente.", outcomeSummary: "+fitness" },
      { key: "play_pain", label: "Jugar infiltrado", qualityBias: -0.6, description: "Alto riesgo de lesión grave.", outcomeSummary: "-fitness" },
      { key: "load_manage", label: "Rotación pactada con el míster", qualityBias: 0.25, description: "Punto medio.", outcomeSummary: "+fitness leve" },
    ],
  },
  {
    key: "captaincy",
    title: "El brazalete te elige",
    description: "El capitán se lesiona. El técnico piensa en ti como sustituto.",
    weight: 5,
    conditions: { minSeason: 2, minOverall: 75 },
    choices: [
      { key: "accept_lead", label: "Aceptar y liderar", qualityBias: 0.6, description: "Salto de reputación.", outcomeSummary: "+reputación, +overall" },
      { key: "share", label: "Aceptar y compartir con veterano", qualityBias: 0.35, description: "Vestuario contento.", outcomeSummary: "+moral" },
      { key: "decline", label: "Rechazar humildemente", qualityBias: -0.1, description: "Neutro.", outcomeSummary: "sin cambio" },
    ],
  },
  {
    key: "transfer_rumor",
    title: "Un grande te llama",
    description: "Un club de élite pregunta por tu situación. Tu agente monta la operación.",
    weight: 7,
    conditions: { minSeason: 2 },
    choices: [
      { key: "push_move", label: "Forzar la salida", qualityBias: -0.2, description: "Puede acabar bien o muy mal.", outcomeSummary: "±reputación" },
      { key: "stay_focus", label: "Cortar rumores y seguir", qualityBias: 0.35, description: "Vestuario respira.", outcomeSummary: "+moral" },
      { key: "leak_info", label: "Filtrar información a un medio", qualityBias: -0.6, description: "Corto plazo, ganas foco. Largo plazo, pierdes credibilidad.", outcomeSummary: "-reputación" },
      { key: "meet_pres", label: "Reunirte con el presidente actual", qualityBias: 0.5, description: "Diálogo directo.", outcomeSummary: "+reputación" },
    ],
  },
  {
    key: "champions_night",
    title: "Noche de Champions",
    description: "Partido a matar o morir de fase de grupos. El míster te consulta la estrategia personal.",
    weight: 7,
    conditions: { minOverall: 72 },
    choices: [
      { key: "shoot_more", label: "Buscar el gol a toda costa", qualityBias: 0.5, description: "Estilo protagonista.", outcomeSummary: "+goles, -asistencias" },
      { key: "assist_mode", label: "Ser el conductor de juego", qualityBias: 0.4, description: "Sacrificio táctico.", outcomeSummary: "+asistencias" },
      { key: "defensive", label: "Retrasarte y defender", qualityBias: -0.1, description: "Anulas riesgo pero no brillas.", outcomeSummary: "-goles" },
      { key: "showboat", label: "Buscar el highlight", qualityBias: -0.4, description: "Bonito, pero arriesgado.", outcomeSummary: "±reputación" },
    ],
  },
  {
    key: "national_call",
    title: "Convocatoria de la selección",
    description: "El seleccionador te llama por primera vez a la absoluta.",
    weight: 6,
    conditions: { minOverall: 74 },
    choices: [
      { key: "go_all_in", label: "Ir y jugarme todo", qualityBias: 0.5, description: "Puedes debutar por todo lo alto.", outcomeSummary: "+reputación" },
      { key: "cautious", label: "Ir cauteloso, pedir minutos suaves", qualityBias: 0.1, description: "Neutro.", outcomeSummary: "leve +reputación" },
      { key: "reject", label: "Rechazar por lesión discutible", qualityBias: -0.6, description: "La prensa te crucifica.", outcomeSummary: "-reputación, -moral" },
    ],
  },
  {
    key: "locker_conflict",
    title: "Conflicto en el vestuario",
    description: "Un compañero clave te acusa de no defender. La situación puede explotar.",
    weight: 6,
    choices: [
      { key: "mediate", label: "Ejercer de mediador", qualityBias: 0.5, description: "Ganas puntos de líder.", outcomeSummary: "+reputación" },
      { key: "confront", label: "Encararle en el vestuario", qualityBias: -0.3, description: "Rompes o refuerzas la relación.", outcomeSummary: "±moral" },
      { key: "ignore", label: "Ignorar y demostrar en el campo", qualityBias: 0.15, description: "Neutro con upside.", outcomeSummary: "leve +overall" },
      { key: "leak", label: "Contárselo a un periodista amigo", qualityBias: -0.7, description: "Muy arriesgado.", outcomeSummary: "-reputación" },
    ],
  },
  {
    key: "sponsor_deal",
    title: "Marca deportiva llama a la puerta",
    description: "Una marca global te ofrece patrocinio personal si aceptas participar en su campaña.",
    weight: 5,
    conditions: { minOverall: 76 },
    choices: [
      { key: "sign_big", label: "Firmar el gran contrato", qualityBias: 0.35, description: "Reputación global.", outcomeSummary: "+reputación" },
      { key: "small_deal", label: "Firmar contrato menor pero flexible", qualityBias: 0.25, description: "Cómodo.", outcomeSummary: "leve +reputación" },
      { key: "decline", label: "Rechazar por foco deportivo", qualityBias: 0.15, description: "Muy profesional.", outcomeSummary: "+overall" },
    ],
  },
  {
    key: "youth_mentor",
    title: "Tutorizar a la joya del filial",
    description: "El club te pide ejercer de mentor de una promesa del filial.",
    weight: 5,
    conditions: { minSeason: 3 },
    choices: [
      { key: "full_mentor", label: "Volcarte al 100%", qualityBias: 0.4, description: "Ganas influencia interna.", outcomeSummary: "+reputación" },
      { key: "part_time", label: "Ayudar cuando puedas", qualityBias: 0.2, description: "Balance.", outcomeSummary: "leve +reputación" },
      { key: "decline", label: "Rechazar, no es tu rol", qualityBias: -0.1, description: "Sin coste real.", outcomeSummary: "neutro" },
    ],
  },
  {
    key: "birthday_party",
    title: "Fiesta post-partido",
    description: "Ganáis un partido clave y el vestuario organiza celebración hasta tarde.",
    weight: 5,
    choices: [
      { key: "go_all_night", label: "Ir hasta el final", qualityBias: -0.6, description: "Fitness castigado.", outcomeSummary: "-fitness" },
      { key: "brief", label: "Aparecer un rato y volver a casa", qualityBias: 0.2, description: "Equilibrio.", outcomeSummary: "+moral" },
      { key: "skip", label: "Quedarte descansando", qualityBias: 0.35, description: "Profesionalidad.", outcomeSummary: "+fitness" },
    ],
  },
];

/**
 * Apuestas: las opciones listadas aquí dejan de tener un resultado de una sola
 * dirección y pasan por un sorteo. Se declaran aparte para poder leer de un
 * vistazo qué decisiones del juego son un órdago y cuáles son terreno seguro.
 *
 * Clave: `"<eventKey>.<choiceKey>"`.
 */
const RISKS: Record<string, ChoiceRisk> = {
  "coach_role.accept": {
    successChance: 0.55, successBias: 0.95, failureBias: -0.45, modifier: "overall",
    successLabel: "Te adaptas de maravilla.", failureLabel: "El rol no te sale y pierdes minutos.",
  },
  "coach_role.refuse": {
    successChance: 0.28, successBias: 0.5, failureBias: -0.95, modifier: "reputation",
    successLabel: "El técnico traga y respeta tu criterio.", failureLabel: "Te manda al banquillo sin contemplaciones.",
  },
  "renewal_offer.counter": {
    successChance: 0.5, successBias: 0.85, failureBias: -0.6, modifier: "reputation",
    successLabel: "El club acepta tus condiciones.", failureLabel: "La negociación se enquista y trasciende.",
  },
  "renewal_offer.delay": {
    successChance: 0.4, successBias: 0.7, failureBias: -0.65,
    successLabel: "Aparece una oferta mejor y ganas la mano.", failureLabel: "Nadie pregunta por ti y pierdes fuerza.",
  },
  "press_criticism.respond": {
    successChance: 0.42, successBias: 0.75, failureBias: -0.8, modifier: "reputation",
    successLabel: "Tu respuesta te gana al vestuario y a la afición.", failureLabel: "Se te va de las manos y la lías.",
  },
  "press_criticism.extra_training": {
    successChance: 0.58, successBias: 0.9, failureBias: -0.55, modifier: "fitness",
    successLabel: "El trabajo extra da resultado.", failureLabel: "Te sobrecargas y lo pagas físicamente.",
  },
  "injury_risk.play_pain": {
    successChance: 0.35, successBias: 0.7, failureBias: -1, modifier: "fitness",
    successLabel: "Aguantas y eres decisivo.", failureLabel: "La rotura llega. Semanas fuera.",
  },
  "captaincy.accept_lead": {
    successChance: 0.6, successBias: 1, failureBias: -0.4, modifier: "reputation",
    successLabel: "El brazalete te hace más grande.", failureLabel: "La presión del liderazgo te pesa.",
  },
  "transfer_rumor.push_move": {
    successChance: 0.45, successBias: 0.9, failureBias: -0.85, modifier: "reputation",
    successLabel: "La operación sale y todos ganan.", failureLabel: "El traspaso se cae y quedas señalado.",
  },
  "transfer_rumor.leak_info": {
    successChance: 0.3, successBias: 0.6, failureBias: -0.95,
    successLabel: "La filtración acelera tu salida.", failureLabel: "Te pillan. El club te aparta.",
  },
  "champions_night.shoot_more": {
    successChance: 0.5, successBias: 1, failureBias: -0.5, modifier: "overall",
    successLabel: "Noche redonda: te comes el partido.", failureLabel: "Fallas lo imposible y te crucifican.",
  },
  "champions_night.showboat": {
    successChance: 0.38, successBias: 0.95, failureBias: -0.75, modifier: "overall",
    successLabel: "El caño da la vuelta al mundo.", failureLabel: "Te sale mal y el rival castiga.",
  },
  "national_call.go_all_in": {
    successChance: 0.55, successBias: 1, failureBias: -0.45, modifier: "overall",
    successLabel: "Debut soñado con la absoluta.", failureLabel: "Debut gris. Tocará esperar otra lista.",
  },
  "locker_conflict.confront": {
    successChance: 0.45, successBias: 0.8, failureBias: -0.8, modifier: "morale",
    successLabel: "Os aclaráis y salís reforzados.", failureLabel: "La bronca parte el vestuario en dos.",
  },
  "locker_conflict.leak": {
    successChance: 0.22, successBias: 0.5, failureBias: -1,
    successLabel: "Nadie rastrea la filtración y ganas el relato.", failureLabel: "Se sabe que fuiste tú. Vestuario perdido.",
  },
  "birthday_party.go_all_night": {
    successChance: 0.35, successBias: 0.55, failureBias: -0.9, modifier: "fitness",
    successLabel: "El grupo se une y llegas entero al finde.", failureLabel: "Fotos a las 5 de la mañana y multa del club.",
  },
};

for (const template of EVENT_TEMPLATES) {
  for (const choice of template.choices) {
    const risk = RISKS[`${template.key}.${choice.key}`];
    if (risk) choice.risk = risk;
  }
}

export function pickSeasonEvents(rng: Rng, state: CareerState, count: number): EventTemplate[] {
  const eligible = EVENT_TEMPLATES.filter(t => {
    const c = t.conditions;
    if (!c) return true;
    if (c.minSeason && state.seasonNumber < c.minSeason) return false;
    if (c.minOverall && state.overall < c.minOverall) return false;
    if (c.maxOverall && state.overall > c.maxOverall) return false;
    if (c.positions && !c.positions.includes(state.position)) return false;
    return true;
  });
  const picked: EventTemplate[] = [];
  const pool = [...eligible];
  for (let i = 0; i < count && pool.length; i++) {
    const weights = pool.map(t => t.weight);
    const chosen = pickWeighted(rng, pool, weights);
    picked.push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
  }
  return picked;
}

/**
 * Aplica la elección: cada delta se muestrea de una normal cuyo mu
 * depende del `qualityBias` de la elección (positivo = mejor mu).
 * `sigma` fijo por eje para mantener aleatoriedad realista.
 */
/**
 * Probabilidad de éxito efectiva: la base de la opción, corregida por el
 * atributo relevante del jugador. Un delantero con media 88 convierte una
 * apuesta del 45% en algo cercano al 60%; uno de 55, en un 33%.
 */
export function effectiveSuccessChance(choice: EventChoice, state: CareerState): number {
  const risk = choice.risk;
  if (!risk) return 1;
  if (!risk.modifier) return clamp(risk.successChance, 0.05, 0.95);

  const value = state[risk.modifier];
  // Pivote 70 para overall (media decente) y 60 para el resto: moral y forma
  // arrancan altas, así que un pivote de 50 regalaba casi todas las apuestas.
  const pivot = risk.modifier === "overall" ? 70 : 60;
  const adjust = ((value - pivot) / 100) * 0.4;
  // Nunca por debajo del 10% ni por encima del 85%: una apuesta que no puede
  // fallar deja de ser una apuesta.
  return clamp(risk.successChance + adjust, 0.1, 0.85);
}

export function applyChoice(
  rng: Rng, template: EventTemplate, choice: EventChoice, state: CareerState,
): AppliedEventOutcome {
  let q = choice.qualityBias;
  let roll: RollResult | undefined;

  if (choice.risk) {
    const successChance = effectiveSuccessChance(choice, state);
    const rolled = rng();
    const success = rolled < successChance;
    q = success ? choice.risk.successBias : choice.risk.failureBias;
    roll = {
      successChance,
      rolled,
      success,
      label: success ? choice.risk.successLabel : choice.risk.failureLabel,
    };
  }

  // Deltas de rendimiento acumulables durante la temporada.
  const goalsBoost = Math.round(clamp(normal(rng, q * 2.2, 1.5), -5, 8));
  const assistsBoost = Math.round(clamp(normal(rng, q * 1.6, 1.2), -4, 6));

  // Cambios permanentes en atributos del jugador.
  const moraleDelta = Math.round(clamp(normal(rng, q * 8, 4), -25, 25));
  const reputationDelta = Math.round(clamp(normal(rng, q * 5, 3), -15, 20));
  const overallDelta = Math.round(clamp(normal(rng, q * 1.2, 0.8), -3, 4));
  const fitnessDelta = Math.round(clamp(normal(rng, q * 3, 3), -20, 15));

  const message = buildMessage(template, choice, {
    goalsBoost, assistsBoost, moraleDelta, reputationDelta, overallDelta, fitnessDelta,
  });

  return {
    eventKey: template.key, choiceKey: choice.key, choiceLabel: choice.label,
    goalsBoost, assistsBoost, moraleDelta, reputationDelta, overallDelta, fitnessDelta,
    message,
    roll,
  };
}

function buildMessage(
  t: EventTemplate, c: EventChoice,
  d: { goalsBoost: number; assistsBoost: number; moraleDelta: number; reputationDelta: number; overallDelta: number; fitnessDelta: number },
): string {
  // Los números los enseña el panel de efectos con barras; aquí solo el titular
  // y el tono general, para no repetir la misma información dos veces.
  const net = d.overallDelta + d.reputationDelta * 0.4 + d.moraleDelta * 0.2
    + d.goalsBoost + d.assistsBoost + d.fitnessDelta * 0.15;
  const tone = net > 1.5 ? "Sale bien." : net < -1.5 ? "Sale caro." : "Sin grandes cambios.";
  return `${t.title} · ${c.label}. ${tone}`;
}
