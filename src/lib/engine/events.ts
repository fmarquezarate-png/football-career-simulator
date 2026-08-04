import type {
  AppliedEventOutcome, CareerState, EventChoice, EventTemplate,
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
export function applyChoice(
  rng: Rng, template: EventTemplate, choice: EventChoice, state: CareerState,
): AppliedEventOutcome {
  const q = choice.qualityBias;

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
    goalsBoost, assistsBoost, moraleDelta, reputationDelta, overallDelta, fitnessDelta, message,
  };
}

function buildMessage(
  t: EventTemplate, c: EventChoice,
  d: { goalsBoost: number; assistsBoost: number; moraleDelta: number; reputationDelta: number; overallDelta: number; fitnessDelta: number },
): string {
  const parts: string[] = [];
  if (d.overallDelta !== 0) parts.push(`overall ${d.overallDelta >= 0 ? "+" : ""}${d.overallDelta}`);
  if (d.moraleDelta !== 0) parts.push(`moral ${d.moraleDelta >= 0 ? "+" : ""}${d.moraleDelta}`);
  if (d.reputationDelta !== 0) parts.push(`reputación ${d.reputationDelta >= 0 ? "+" : ""}${d.reputationDelta}`);
  if (d.fitnessDelta !== 0) parts.push(`fitness ${d.fitnessDelta >= 0 ? "+" : ""}${d.fitnessDelta}`);
  if (d.goalsBoost !== 0) parts.push(`goles temporada ${d.goalsBoost >= 0 ? "+" : ""}${d.goalsBoost}`);
  if (d.assistsBoost !== 0) parts.push(`asist. temporada ${d.assistsBoost >= 0 ? "+" : ""}${d.assistsBoost}`);
  return `${t.title} · ${c.label}${parts.length ? " → " + parts.join(", ") : ""}`;
}
