import type {
  AppliedEventOutcome, CareerState, ChoiceEffects, EffectMetric, EventChoice,
  EventTemplate, RollResult,
} from "../data/types";
import { tierOfTeam } from "./clubAssignment";
import { normal, clamp, pickWeighted, type Rng } from "./rng";

/**
 * Biblioteca de eventos narrativos.
 *
 * Dos reglas de diseño gobiernan este fichero:
 *
 * 1. **Ninguna opción es gratis.** Cada elección declara sus efectos por
 *    métrica y casi todas mezclan signo positivo y negativo. Ganar reputación
 *    suele costar moral, ganar media suele costar forma. Si una opción fuese
 *    mejor que las demás en todo, la decisión no existiría.
 *
 * 2. **El catálogo se adapta al momento de la carrera.** Las condiciones de
 *    cada evento (edad, media, reputación, franja del club, moral, forma)
 *    hacen que un canterano y un veterano vean repertorios casi disjuntos, y
 *    el motor evita repetir lo vivido recientemente.
 */

/* ================================================================== */
/* 1 · Debut y cantera                                                 */
/* ================================================================== */

const EARLY: EventTemplate[] = [
  {
    key: "first_training",
    title: "Primer entrenamiento con los mayores",
    description: "El míster te sube a la sesión del primer equipo. Los veteranos observan cada toque.",
    weight: 10,
    conditions: { maxSeason: 2, maxOverall: 72 },
    choices: [
      {
        key: "impress", label: "Salir a comerte el entrenamiento",
        description: "Entrar fuerte, pedir la pelota, buscar el uno contra uno.",
        effects: { overall: 1.1, reputation: 4, fitness: -6, morale: 3 },
      },
      {
        key: "humble", label: "Pasarla rápido y no destacar",
        description: "Toque simple, cero riesgos, dejar que los veteranos manden.",
        effects: { morale: 5, overall: 0.2, reputation: -1 },
      },
      {
        key: "study", label: "Quedarte después preguntando al capitán",
        description: "Menos protagonismo en el campo, más en el vestuario.",
        effects: { reputation: 3, morale: 4, fitness: -2, overall: 0.4 },
      },
    ],
  },
  {
    key: "debut_call",
    title: "Te sientas en el banquillo por primera vez",
    description: "Convocatoria para un partido de liga. Quedan veinte minutos y el míster te mira.",
    weight: 9,
    conditions: { maxSeason: 3, maxOverall: 74 },
    choices: [
      {
        key: "calm", label: "Salir a tocar y no perderla",
        description: "Debut sobrio. Nadie te recordará, pero nadie te señalará.",
        effects: { morale: 6, overall: 0.5, reputation: 2 },
      },
      {
        key: "risk_it", label: "Buscar la jugada que te ponga en el mapa",
        description: "Un regate, un disparo lejano, algo que salga en el resumen.",
        effects: { goals: 1, reputation: 9, overall: 1, morale: 6 },
        failureEffects: { morale: -10, reputation: -4, overall: -0.3 },
        risk: {
          successChance: 0.4, modifier: "overall",
          successLabel: "Te sale y el estadio se levanta.",
          failureLabel: "La pierdes en la frontal y el míster te fulmina con la mirada.",
        },
      },
    ],
  },
  {
    key: "loan_offer",
    title: "Un club menor pide tu cesión",
    description: "Jugarías todos los domingos, pero lejos del escaparate y del cuerpo técnico que te conoce.",
    weight: 8,
    conditions: { maxSeason: 4, maxOverall: 74 },
    choices: [
      {
        key: "accept_loan", label: "Aceptar la cesión y jugarlo todo",
        description: "Minutos garantizados en un contexto más pobre.",
        effects: { overall: 1.8, goals: 2, assists: 1, reputation: -3, morale: -4 },
      },
      {
        key: "stay_fight", label: "Quedarte a pelear por un hueco",
        description: "Entrenar con los mejores aunque juegues poco.",
        effects: { overall: 0.6, reputation: 3, morale: -6, fitness: -3 },
      },
      {
        key: "demand_plan", label: "Exigir al club un plan de minutos por escrito",
        description: "Poner al club contra las cuerdas siendo un chaval.",
        effects: { reputation: 6, morale: 4, overall: 0.3 },
        failureEffects: { reputation: -7, morale: -12 },
        risk: {
          successChance: 0.35, modifier: "reputation",
          successLabel: "El club se compromete y cumple.",
          failureLabel: "Te toman por creído y te congelan.",
        },
      },
    ],
  },
  {
    key: "agent_change",
    title: "Un agente potente quiere representarte",
    description: "Mueve a media plantilla de la Premier. Tu agente de siempre es un amigo de la familia.",
    weight: 7,
    conditions: { maxSeason: 5 },
    choices: [
      {
        key: "switch", label: "Cambiar de agencia",
        description: "Más puertas abiertas, menos confianza personal.",
        effects: { reputation: 8, morale: -7 },
      },
      {
        key: "loyal", label: "Seguir con quien te sacó de la nada",
        description: "Lealtad por encima del escaparate.",
        effects: { morale: 8, reputation: -3 },
      },
      {
        key: "both", label: "Proponer que trabajen juntos",
        description: "Solución diplomática que puede no contentar a nadie.",
        effects: { reputation: 5, morale: 3 },
        failureEffects: { reputation: -4, morale: -8 },
        risk: {
          successChance: 0.42,
          successLabel: "Aceptan el reparto y sales ganando por los dos lados.",
          failureLabel: "Se enfrentan entre ellos y quedas en medio del fuego.",
        },
      },
    ],
  },
];

/* ================================================================== */
/* 2 · Cuerpo técnico y táctica                                        */
/* ================================================================== */

const COACHING: EventTemplate[] = [
  {
    key: "coach_role",
    title: "El técnico redefine tu rol",
    description: "Quiere moverte de posición para encajar un fichaje. Tú llevas toda la vida jugando donde juegas.",
    weight: 9,
    choices: [
      {
        key: "accept", label: "Aceptar y reaprender el puesto",
        description: "Meses incómodos a cambio de un perfil más completo.",
        effects: { overall: 1.6, morale: 4, fitness: -5, goals: -2 },
        failureEffects: { overall: -0.8, morale: -9, goals: -3 },
        risk: {
          successChance: 0.55, modifier: "overall",
          successLabel: "El puesto nuevo te queda como un guante.",
          failureLabel: "No terminas de entenderlo y pierdes peso en el once.",
        },
      },
      {
        key: "negotiate", label: "Negociar un rol híbrido",
        description: "Ni una cosa ni la otra. Menos riesgo, menos recorrido.",
        effects: { overall: 0.4, morale: 2, reputation: -3, fitness: -2 },
      },
      {
        key: "refuse", label: "Negarte en redondo",
        description: "Defender tu puesto aunque el técnico se lo tome como un pulso.",
        effects: { morale: 6, reputation: 5 },
        failureEffects: { morale: -14, reputation: -8, goals: -3 },
        risk: {
          successChance: 0.3, modifier: "reputation",
          successLabel: "El técnico recula y te mantiene donde estabas.",
          failureLabel: "Pierdes el pulso y acabas en el banquillo.",
        },
      },
    ],
  },
  {
    key: "new_manager",
    title: "Destituyen al entrenador",
    description: "Llega uno nuevo con su propia idea y su propia lista de intocables. Tú no estás en ella.",
    weight: 9,
    conditions: { minSeason: 2 },
    choices: [
      {
        key: "adapt", label: "Adaptarte a su libro sin rechistar",
        description: "Entrenar el doble para entrar en los planes.",
        effects: { overall: 1.2, fitness: -8, morale: -2 },
      },
      {
        key: "confront_style", label: "Plantearle que su sistema te anula",
        description: "Hablar claro el primer día es jugársela.",
        effects: { reputation: 6, morale: 5, overall: 0.5 },
        failureEffects: { morale: -11, reputation: -6, assists: -2 },
        risk: {
          successChance: 0.38, modifier: "reputation",
          successLabel: "Te escucha y ajusta el plan a tus virtudes.",
          failureLabel: "Te marca como problemático desde la semana uno.",
        },
      },
      {
        key: "wait", label: "Esperar callado a que pasen las primeras jornadas",
        description: "Ni molestar ni destacar hasta ver por dónde sopla.",
        effects: { morale: -4, fitness: 5, reputation: -2 },
      },
    ],
  },
  {
    key: "tactical_homework",
    title: "El analista te manda vídeo extra",
    description: "Tres horas semanales de sala de vídeo, fuera del horario del resto del grupo.",
    weight: 7,
    choices: [
      {
        key: "commit", label: "Tragarte cada minuto de vídeo",
        description: "Menos descanso, más lectura de juego.",
        effects: { overall: 1.3, assists: 2, fitness: -7 },
      },
      {
        key: "selective", label: "Ver solo lo de tu posición",
        description: "Compromiso a medias.",
        effects: { overall: 0.5, assists: 1, fitness: -2 },
      },
      {
        key: "skip", label: "Saltártelo y descansar",
        description: "Llegas fresco al domingo, pero el analista lo apunta.",
        effects: { fitness: 8, morale: 3, overall: -0.4, reputation: -3 },
      },
    ],
  },
  {
    key: "bench_decision",
    title: "Te dejan fuera del once en un clásico",
    description: "El partido del año y el míster te sienta sin darte explicaciones.",
    weight: 8,
    conditions: { minSeason: 2, tiers: ["elite", "grande"] },
    choices: [
      {
        key: "support", label: "Animar desde el banquillo como el que más",
        description: "Tragarte el orgullo delante de las cámaras.",
        effects: { reputation: 5, morale: -5 },
      },
      {
        key: "cold", label: "Cara larga y calentar sin ganas",
        description: "Las cámaras lo cazan todo.",
        effects: { morale: 4, reputation: -7 },
      },
      {
        key: "talk_after", label: "Pedirle explicaciones al acabar",
        description: "En caliente, con el vestuario delante.",
        effects: { morale: 7, reputation: 3, overall: 0.4 },
        failureEffects: { morale: -12, reputation: -9 },
        risk: {
          successChance: 0.4, modifier: "reputation",
          successLabel: "Te da la razón y prometes ganártelo.",
          failureLabel: "Se monta un pollo que acaba en la prensa.",
        },
      },
    ],
  },
];

/* ================================================================== */
/* 3 · Vestuario                                                       */
/* ================================================================== */

const LOCKER: EventTemplate[] = [
  {
    key: "locker_conflict",
    title: "Conflicto en el vestuario",
    description: "Un compañero clave te acusa delante de todos de no ayudar en defensa.",
    weight: 8,
    choices: [
      {
        key: "mediate", label: "Bajar el tono y mediar",
        description: "Ejercer de adulto aunque tengas razón.",
        effects: { reputation: 6, morale: 2, overall: -0.2 },
      },
      {
        key: "confront", label: "Encararle allí mismo",
        description: "O se aclara todo o se parte el vestuario.",
        effects: { morale: 8, reputation: 4 },
        failureEffects: { morale: -15, reputation: -8, assists: -2 },
        risk: {
          successChance: 0.45, modifier: "morale",
          successLabel: "Os decís todo y salís más unidos.",
          failureLabel: "El vestuario se parte en dos bandos.",
        },
      },
      {
        key: "ignore", label: "Callarte y responder en el campo",
        description: "Nada de ruido, todo a la pizarra del domingo.",
        effects: { overall: 0.8, morale: -5, goals: 1 },
      },
    ],
  },
  {
    key: "captaincy",
    title: "El brazalete te elige",
    description: "El capitán se lesiona de gravedad y el técnico piensa en ti.",
    weight: 6,
    conditions: { minSeason: 2, minOverall: 75 },
    choices: [
      {
        key: "accept_lead", label: "Aceptar el brazalete",
        description: "Toda la responsabilidad, también la de los malos días.",
        effects: { reputation: 12, overall: 0.8, morale: 5 },
        failureEffects: { reputation: -6, morale: -12, overall: -0.5 },
        risk: {
          successChance: 0.55, modifier: "reputation",
          successLabel: "El brazalete te hace más grande.",
          failureLabel: "El peso del liderazgo te come el juego.",
        },
      },
      {
        key: "share", label: "Compartirlo con un veterano",
        description: "Menos foco, menos riesgo.",
        effects: { morale: 7, reputation: 4 },
      },
      {
        key: "decline", label: "Rechazarlo por ahora",
        description: "Aún no te sientes preparado y lo dices.",
        effects: { morale: 3, reputation: -4, overall: 0.3 },
      },
    ],
  },
  {
    key: "youth_mentor",
    title: "Tutorizar a la joya del filial",
    description: "El club te pide apadrinar a un chaval de 17 años que apunta a crack.",
    weight: 6,
    conditions: { minSeason: 3, minAge: 24 },
    choices: [
      {
        key: "full_mentor", label: "Volcarte con él",
        description: "Horas tuyas que no dedicas a lo tuyo.",
        effects: { reputation: 8, morale: 5, overall: -0.3, fitness: -4 },
      },
      {
        key: "part_time", label: "Echarle un cable cuando puedas",
        description: "Equilibrio razonable.",
        effects: { reputation: 3, morale: 2 },
      },
      {
        key: "decline", label: "Decir que no es tu trabajo",
        description: "Foco absoluto en tu rendimiento.",
        effects: { overall: 0.7, fitness: 4, reputation: -5 },
      },
    ],
  },
  {
    key: "teammate_scandal",
    title: "Un compañero la lía fuera del campo",
    description: "La prensa lo destroza y te preguntan a ti en zona mixta.",
    weight: 7,
    conditions: { minSeason: 2 },
    choices: [
      {
        key: "defend", label: "Defenderle públicamente",
        description: "El vestuario te lo agradece, la opinión pública no.",
        effects: { morale: 8, reputation: -6 },
      },
      {
        key: "distance", label: "Marcar distancias",
        description: "Quedas impecable de puertas afuera.",
        effects: { reputation: 6, morale: -8 },
      },
      {
        key: "dodge", label: "Escurrir la pregunta",
        description: "Ni contigo ni contra ti.",
        effects: { reputation: -1, morale: 1 },
      },
    ],
  },
  {
    key: "veteran_clash",
    title: "El veterano del vestuario te frena",
    description: "Lleva doce años en el club y no le gusta que un chaval le quite galones.",
    weight: 7,
    conditions: { maxAge: 26, minOverall: 74 },
    choices: [
      {
        key: "respect", label: "Ponerte a su sombra un tiempo",
        description: "Ganártelo con paciencia.",
        effects: { morale: 5, reputation: -2, overall: 0.4 },
      },
      {
        key: "outplay", label: "Quitarle el puesto en el campo",
        description: "Sin hablar, solo jugando.",
        effects: { overall: 1.2, goals: 2, reputation: 5, morale: -6 },
      },
      {
        key: "ally", label: "Buscar su respaldo abiertamente",
        description: "Pedirle consejo delante del grupo.",
        effects: { reputation: 7, morale: 6, overall: 0.3 },
        failureEffects: { reputation: -5, morale: -7 },
        risk: {
          successChance: 0.48, modifier: "reputation",
          successLabel: "Se convierte en tu mayor valedor.",
          failureLabel: "Lo lee como una maniobra y te cierra la puerta.",
        },
      },
    ],
  },
];

/* ================================================================== */
/* 4 · Prensa y redes                                                  */
/* ================================================================== */

const MEDIA: EventTemplate[] = [
  {
    key: "press_criticism",
    title: "La prensa te señala",
    description: "Un par de partidos grises y te has convertido en el tema de la semana.",
    weight: 9,
    choices: [
      {
        key: "silence", label: "Silencio y trabajo",
        description: "Ni una palabra hasta que hablen los números.",
        effects: { overall: 0.7, morale: -4, fitness: -3 },
      },
      {
        key: "respond", label: "Contestar en rueda de prensa",
        description: "Poner nombre y apellidos a quien te critica.",
        effects: { reputation: 8, morale: 7 },
        failureEffects: { reputation: -10, morale: -8 },
        risk: {
          successChance: 0.42, modifier: "reputation",
          successLabel: "Tu respuesta te gana a la grada.",
          failureLabel: "Se te va de las manos y das titulares para un mes.",
        },
      },
      {
        key: "extra_training", label: "Doblar entrenamientos",
        description: "Responder con horas de campo.",
        effects: { overall: 1.4, goals: 1 },
        failureEffects: { fitness: -16, overall: -0.4, morale: -5 },
        risk: {
          successChance: 0.58, modifier: "fitness",
          successLabel: "El trabajo extra se nota el domingo.",
          failureLabel: "Te sobrecargas y llegas fundido.",
        },
      },
    ],
  },
  {
    key: "viral_clip",
    title: "Un vídeo tuyo se hace viral",
    description: "Un gesto tuyo en el banquillo lleva dos millones de reproducciones. La lectura es ambigua.",
    weight: 7,
    choices: [
      {
        key: "own_it", label: "Reírte de ti mismo en redes",
        description: "Convertir el momento incómodo en marca personal.",
        effects: { reputation: 7, morale: 4, overall: -0.3 },
      },
      {
        key: "explain", label: "Publicar un comunicado serio",
        description: "Aclararlo formalmente, aunque le des importancia.",
        effects: { reputation: 2, morale: -3 },
      },
      {
        key: "ignore_it", label: "No entrar al trapo",
        description: "Dejar que se apague solo.",
        effects: { morale: 2, overall: 0.4, reputation: -2 },
      },
    ],
  },
  {
    key: "documentary",
    title: "Una plataforma quiere grabarte un documental",
    description: "Cámaras en tu casa, en el vestuario y en los días malos.",
    weight: 6,
    conditions: { minReputation: 55 },
    choices: [
      {
        key: "full_access", label: "Dar acceso total",
        description: "Exposición máxima, intimidad cero.",
        effects: { reputation: 14, morale: -8, overall: -0.4 },
      },
      {
        key: "limited", label: "Solo entrenamientos y partidos",
        description: "Control del relato a cambio de menos impacto.",
        effects: { reputation: 6, morale: -2 },
      },
      {
        key: "refuse_doc", label: "Decir que no",
        description: "Foco absoluto en el campo.",
        effects: { overall: 0.6, morale: 4, reputation: -3 },
      },
    ],
  },
  {
    key: "fan_incident",
    title: "Un aficionado te insulta a la salida",
    description: "Le tienes a un metro, hay veinte móviles grabando.",
    weight: 7,
    choices: [
      {
        key: "walk", label: "Seguir andando",
        description: "Ni mirarle.",
        effects: { reputation: 3, morale: -6 },
      },
      {
        key: "confront_fan", label: "Encararte con él",
        description: "Sacarte la espina delante de las cámaras.",
        effects: { morale: 6 },
        failureEffects: { reputation: -14, morale: -6 },
        risk: {
          successChance: 0.25,
          successLabel: "El vídeo se lee como una reacción legítima.",
          failureLabel: "El club te multa y la federación abre expediente.",
        },
      },
      {
        key: "talk_fan", label: "Pararte a hablar con él",
        description: "Desactivarlo con calma.",
        effects: { reputation: 9, morale: 3, fitness: -2 },
        failureEffects: { reputation: -5, morale: -7 },
        risk: {
          successChance: 0.5, modifier: "reputation",
          successLabel: "La conversación acaba en foto y aplausos.",
          failureLabel: "Se envalentona y monta un espectáculo.",
        },
      },
    ],
  },
];

/* ================================================================== */
/* 5 · Físico y lesiones                                               */
/* ================================================================== */

const PHYSICAL: EventTemplate[] = [
  {
    key: "injury_risk",
    title: "Molestias musculares",
    description: "El fisio detecta sobrecarga en el isquiotibial a cuatro días de un partido grande.",
    weight: 10,
    choices: [
      {
        key: "rest", label: "Parar dos semanas",
        description: "Perder el partido grande para llegar entero al resto.",
        effects: { fitness: 14, goals: -2, assists: -1, reputation: -3 },
      },
      {
        key: "play_pain", label: "Infiltrarte y jugar",
        description: "Aguantar el dolor y estar donde te quieren ver.",
        effects: { goals: 2, reputation: 7, morale: 6 },
        failureEffects: { fitness: -22, overall: -1, morale: -12, goals: -3 },
        risk: {
          successChance: 0.35, modifier: "fitness",
          successLabel: "Aguantas los noventa y eres decisivo.",
          failureLabel: "Rotura fibrilar. Seis semanas fuera.",
        },
      },
      {
        key: "load_manage", label: "Rotación pactada",
        description: "Jugar a medias, entrenar a medias.",
        effects: { fitness: 6, morale: -2, goals: -1 },
      },
    ],
  },
  {
    key: "long_injury",
    title: "Lesión de las que asustan",
    description: "Ligamento tocado. El plazo depende de cómo enfoques la recuperación.",
    weight: 6,
    conditions: { maxFitness: 70 },
    choices: [
      {
        key: "rush", label: "Forzar la vuelta antes de tiempo",
        description: "Volver para el tramo decisivo aunque no estés.",
        effects: { reputation: 8, goals: 2, morale: 6 },
        failureEffects: { fitness: -25, overall: -1.5, morale: -15 },
        risk: {
          successChance: 0.28, modifier: "fitness",
          successLabel: "Llegas justo y aguantas.",
          failureLabel: "Recaída. La temporada se acabó para ti.",
        },
      },
      {
        key: "protocol", label: "Seguir el protocolo al día",
        description: "Volver tarde pero entero.",
        effects: { fitness: 20, morale: -6, reputation: -4, goals: -3 },
      },
      {
        key: "specialist", label: "Pagarte un especialista fuera del club",
        description: "Segunda opinión que al club no le hace gracia.",
        effects: { fitness: 16, overall: 0.5, reputation: -2, morale: 3 },
      },
    ],
  },
  {
    key: "diet_plan",
    title: "El nutricionista te aprieta",
    description: "Quiere cambiarte la alimentación entera en plena temporada.",
    weight: 7,
    choices: [
      {
        key: "strict", label: "Seguirlo a rajatabla",
        description: "Adiós a todo lo que te gusta.",
        effects: { fitness: 12, overall: 0.6, morale: -7 },
      },
      {
        key: "partial", label: "Cumplir entre semana",
        description: "Fines de semana libres.",
        effects: { fitness: 5, morale: 2 },
      },
      {
        key: "ignore_diet", label: "Pasar del plan",
        description: "Ya estás bien así.",
        effects: { morale: 6, fitness: -9, overall: -0.4 },
      },
    ],
  },
  {
    key: "gym_bulk",
    title: "Plan de fuerza en pretemporada",
    description: "El preparador quiere que ganes cinco kilos de masa muscular.",
    weight: 7,
    conditions: { maxAge: 27 },
    choices: [
      {
        key: "bulk", label: "Meterte en el gimnasio a saco",
        description: "Más cuerpo, menos chispa.",
        effects: { overall: 1.2, fitness: 8, assists: -2 },
      },
      {
        key: "speed", label: "Priorizar velocidad y agilidad",
        description: "Seguir siendo eléctrico aunque te ganen los duelos.",
        effects: { goals: 2, assists: 2, fitness: -5, overall: 0.4 },
      },
      {
        key: "balanced_gym", label: "Plan mixto",
        description: "Ni una cosa ni la otra.",
        effects: { overall: 0.7, fitness: 3 },
      },
    ],
  },
];

/* ================================================================== */
/* 6 · Mercado y dinero                                                */
/* ================================================================== */

const MARKET: EventTemplate[] = [
  {
    key: "renewal_offer",
    title: "El club te ofrece renovación",
    description: "Oferta sobre la mesa a mitad de temporada. Tu agente quiere saber tu postura.",
    weight: 8,
    conditions: { minSeason: 2 },
    choices: [
      {
        key: "sign_now", label: "Firmar ya",
        description: "Tranquilidad total a cambio de no tantear el mercado.",
        effects: { morale: 9, fitness: 4, reputation: -2, overall: -0.3 },
      },
      {
        key: "counter", label: "Pedir mejora y cláusula",
        description: "Apretar sabiendo que puede trascender.",
        effects: { reputation: 7, morale: 5 },
        failureEffects: { morale: -12, reputation: -6 },
        risk: {
          successChance: 0.5, modifier: "reputation",
          successLabel: "El club acepta tus condiciones.",
          failureLabel: "La negociación se filtra y quedas de codicioso.",
        },
      },
      {
        key: "delay", label: "Esperar al mercado",
        description: "Jugártela a que aparezca algo mejor.",
        effects: { reputation: 6, morale: 3, overall: 0.8 },
        failureEffects: { morale: -13, reputation: -8 },
        risk: {
          successChance: 0.4,
          successLabel: "Aparece una oferta mejor y ganas la mano.",
          failureLabel: "No llama nadie y vuelves con menos fuerza.",
        },
      },
    ],
  },
  {
    key: "transfer_rumor",
    title: "Un grande pregunta por ti",
    description: "Tu agente ya ha hablado con ellos. El club actual no se ha enterado.",
    weight: 8,
    conditions: { minSeason: 2, minOverall: 72 },
    choices: [
      {
        key: "push_move", label: "Forzar la salida",
        description: "Poner al club en una posición imposible.",
        effects: { reputation: 18, morale: 14, overall: 1.2 },
        failureEffects: { reputation: -12, morale: -14, goals: -3 },
        risk: {
          successChance: 0.45, modifier: "reputation",
          successLabel: "La operación se cierra y todos ganan.",
          failureLabel: "El traspaso se cae y te quedas señalado.",
        },
      },
      {
        key: "stay_focus", label: "Cortar los rumores en seco",
        description: "Declaración pública de compromiso.",
        effects: { morale: 6, reputation: 3, overall: 0.4, fitness: -3 },
      },
      {
        key: "meet_pres", label: "Sentarte con el presidente",
        description: "Cartas boca arriba, sin intermediarios.",
        effects: { reputation: 12, morale: 9, overall: 0.5 },
        failureEffects: { reputation: -5, morale: -9 },
        risk: {
          successChance: 0.52, modifier: "reputation",
          successLabel: "Salís con un acuerdo que os sirve a los dos.",
          failureLabel: "Te promete cosas que no piensa cumplir.",
        },
      },
    ],
  },
  {
    key: "sponsor_deal",
    title: "Una marca global llama a tu puerta",
    description: "Contrato de imagen con rodajes, viajes y actos durante la temporada.",
    weight: 7,
    conditions: { minOverall: 76 },
    choices: [
      {
        key: "sign_big", label: "Firmar el contrato grande",
        description: "Dinero y foco mundial, agenda reventada.",
        effects: { reputation: 12, fitness: -8, overall: -0.4 },
      },
      {
        key: "small_deal", label: "Contrato menor y flexible",
        description: "Menos ruido, menos cheque.",
        effects: { reputation: 5, fitness: -2 },
      },
      {
        key: "decline_sponsor", label: "Rechazarlo por foco deportivo",
        description: "Todo el tiempo para el campo.",
        effects: { overall: 0.9, fitness: 5, reputation: -4 },
      },
    ],
  },
  {
    key: "money_trouble",
    title: "Una inversión tuya sale mal",
    description: "Un negocio en el que metiste buena parte de tus ahorros se hunde.",
    weight: 6,
    conditions: { minSeason: 4 },
    choices: [
      {
        key: "fight_legal", label: "Meterte en pleitos",
        description: "Pelear por recuperarlo, con la cabeza en los juzgados.",
        effects: { morale: 8, reputation: 4 },
        failureEffects: { morale: -14, overall: -0.8 },
        risk: {
          successChance: 0.45,
          successLabel: "Ganas el pleito y recuperas casi todo.",
          failureLabel: "Lo pierdes y encima pagas costas.",
        },
      },
      {
        key: "let_go", label: "Asumir la pérdida y pasar página",
        description: "Caro, pero limpio.",
        effects: { morale: -4, overall: 0.4, fitness: 3 },
      },
      {
        key: "go_public", label: "Contarlo públicamente para avisar a otros",
        description: "Exponer tu error delante de todos.",
        effects: { reputation: 8, morale: -6 },
      },
    ],
  },
  {
    key: "saudi_offer",
    title: "Oferta millonaria desde fuera de Europa",
    description: "Triplican tu ficha. El nivel de la liga está muy por debajo.",
    weight: 6,
    conditions: { minAge: 27, minOverall: 78 },
    choices: [
      {
        key: "take_money", label: "Aceptar el contrato",
        description: "Asegurar el futuro a costa del prestigio deportivo.",
        effects: { morale: 10, reputation: -12, overall: -1 },
      },
      {
        key: "stay_elite", label: "Quedarte a competir al máximo nivel",
        description: "Rechazar una cifra que no volverá.",
        effects: { reputation: 9, overall: 0.6, morale: -5 },
      },
      {
        key: "use_leverage", label: "Usarla para renegociar donde estás",
        description: "Enseñar la oferta en el despacho.",
        effects: { morale: 8, reputation: 4 },
        failureEffects: { morale: -12, reputation: -9 },
        risk: {
          successChance: 0.45, modifier: "reputation",
          successLabel: "El club iguala lo que puede y te blinda.",
          failureLabel: "Te dicen que te vayas si quieres. Quedas retratado.",
        },
      },
    ],
  },
];

/* ================================================================== */
/* 7 · Competición                                                     */
/* ================================================================== */

const COMPETITION: EventTemplate[] = [
  {
    key: "champions_night",
    title: "Noche europea a vida o muerte",
    description: "Eliminatoria abierta. El míster te consulta cómo quieres jugarla.",
    weight: 8,
    conditions: { minOverall: 72, tiers: ["elite", "grande"] },
    choices: [
      {
        key: "shoot_more", label: "Asumir galones y buscar el gol",
        description: "Cargar con el partido a tu espalda.",
        effects: { goals: 3, reputation: 9, morale: 6 },
        failureEffects: { goals: -2, reputation: -8, morale: -10 },
        risk: {
          successChance: 0.5, modifier: "overall",
          successLabel: "Noche redonda: te comes el partido.",
          failureLabel: "Fallas lo imposible y te crucifican.",
        },
      },
      {
        key: "assist_mode", label: "Hacer jugar a los demás",
        description: "Sacrificio táctico sin foco mediático.",
        effects: { assists: 3, overall: 0.5, goals: -1, reputation: 2 },
      },
      {
        key: "defensive", label: "Retrasarte y sostener al equipo",
        description: "Nadie te aplaudirá pero el míster lo verá.",
        effects: { overall: 0.7, fitness: -6, goals: -2, morale: 2 },
      },
    ],
  },
  {
    key: "derby_provocation",
    title: "El rival te busca las cosquillas en el derbi",
    description: "Llevas cuarenta minutos aguantando codazos y comentarios.",
    weight: 8,
    choices: [
      {
        key: "retaliate", label: "Devolvérsela",
        description: "Que sepa que estás.",
        effects: { morale: 8, reputation: 4, goals: 1 },
        failureEffects: { reputation: -9, morale: -8, goals: -2 },
        risk: {
          successChance: 0.38,
          successLabel: "El árbitro no lo ve y el rival se desactiva.",
          failureLabel: "Roja directa y tres partidos de sanción.",
        },
      },
      {
        key: "ignore_derby", label: "Aguantar y jugar",
        description: "Tragar y responder con fútbol.",
        effects: { overall: 0.6, goals: 1, morale: -5 },
      },
      {
        key: "referee", label: "Protestar al árbitro cada acción",
        description: "Buscar que le amonesten a él.",
        effects: { morale: 2, reputation: -3, assists: -1 },
      },
    ],
  },
  {
    key: "title_run",
    title: "Recta final con la liga en juego",
    description: "Cinco jornadas, dos puntos de diferencia y el cuerpo pidiendo tregua.",
    weight: 8,
    conditions: { minSeason: 2, tiers: ["elite", "grande"] },
    choices: [
      {
        key: "all_in", label: "Jugarlo todo aunque te rompas",
        description: "No perderte ni un minuto de aquí al final.",
        effects: { goals: 3, assists: 2, reputation: 8, fitness: -18 },
      },
      {
        key: "manage", label: "Dosificar para llegar a las finales",
        description: "Perderte alguna para estar en las que importan.",
        effects: { fitness: 6, goals: -1, reputation: -3 },
      },
      {
        key: "lead_group", label: "Tirar del grupo desde el vestuario",
        description: "Cargar con la presión del equipo entero.",
        effects: { reputation: 9, morale: 6, assists: 1, fitness: -8 },
      },
    ],
  },
  {
    key: "relegation_fight",
    title: "El equipo se juega el descenso",
    description: "Últimas jornadas, ambiente irrespirable y la afición pidiendo cabezas.",
    weight: 8,
    conditions: { tiers: ["modesto", "media"] },
    choices: [
      {
        key: "carry", label: "Echarte el equipo a la espalda",
        description: "Asumir que si baja, será culpa tuya.",
        effects: { goals: 3, reputation: 10, fitness: -14, morale: -4 },
      },
      {
        key: "safe_game", label: "Jugar sencillo y no arriesgar",
        description: "No ser el que aparece en el error del resumen.",
        effects: { overall: 0.4, morale: 3, reputation: -4 },
      },
      {
        key: "rally_fans", label: "Salir a hablarle a la grada",
        description: "Dar la cara ante quien te está silbando.",
        effects: { reputation: 11, morale: 7 },
        failureEffects: { reputation: -10, morale: -12 },
        risk: {
          successChance: 0.44, modifier: "reputation",
          successLabel: "La grada se vuelca y el campo se convierte en una olla.",
          failureLabel: "Te responden con una pitada histórica.",
        },
      },
    ],
  },
];

/* ================================================================== */
/* 8 · Selección                                                       */
/* ================================================================== */

const NATIONAL: EventTemplate[] = [
  {
    key: "national_call",
    title: "Primera convocatoria con la absoluta",
    description: "El seleccionador te llama. Hay tres jugadores más para tu puesto.",
    weight: 7,
    conditions: { minOverall: 74 },
    choices: [
      {
        key: "go_all_in", label: "Ir a comerte el sitio",
        description: "Pedir jugar aunque llegues con la lengua fuera.",
        effects: { reputation: 12, overall: 0.7, morale: 8, fitness: -8 },
        failureEffects: { reputation: -6, morale: -10, fitness: -10 },
        risk: {
          successChance: 0.5, modifier: "overall",
          successLabel: "Debut de los que abren la puerta para siempre.",
          failureLabel: "Debut gris. Tocará esperar otra lista.",
        },
      },
      {
        key: "cautious", label: "Ir y pedir minutos medidos",
        description: "Cuidar el club por encima de la selección.",
        effects: { reputation: 4, fitness: 2, morale: 3 },
      },
      {
        key: "reject_call", label: "Renunciar alegando molestias",
        description: "Descansar dos semanas mientras otros se ganan el sitio.",
        effects: { fitness: 12, overall: 0.4, reputation: -10, morale: -4 },
      },
    ],
  },
  {
    key: "world_cup_squad",
    title: "Lista provisional del Mundial",
    description: "Estás entre los 30 preseleccionados. Quedan dos meses de liga.",
    weight: 7,
    conditions: { minOverall: 78, minSeason: 3 },
    choices: [
      {
        key: "force_form", label: "Forzar la máquina para entrar en la lista",
        description: "Jugar todo lo que puedas aunque el cuerpo diga basta.",
        effects: { goals: 3, reputation: 10, fitness: -16 },
      },
      {
        key: "arrive_fresh", label: "Dosificar para llegar entero",
        description: "Sacrificar escaparate por estado de forma.",
        effects: { fitness: 12, goals: -2, reputation: -5 },
      },
      {
        key: "call_coach", label: "Llamar al seleccionador para saber si cuenta contigo",
        description: "Preguntar de frente y arriesgarte a la respuesta.",
        effects: { morale: 8, reputation: 4 },
        failureEffects: { morale: -14, reputation: -5 },
        risk: {
          successChance: 0.45, modifier: "reputation",
          successLabel: "Te confirma que estás dentro.",
          failureLabel: "Te dice que estás lejos de la lista definitiva.",
        },
      },
    ],
  },
  {
    key: "nationality_switch",
    title: "Otra federación te tienta",
    description: "Tienes doble nacionalidad y una segunda selección te ofrece titularidad inmediata.",
    weight: 5,
    conditions: { minSeason: 3, maxReputation: 70 },
    choices: [
      {
        key: "switch_nation", label: "Cambiar de selección",
        description: "Jugar un Mundial seguro con una bandera que sientes a medias.",
        effects: { reputation: 7, morale: -8 },
      },
      {
        key: "wait_call", label: "Esperar a tu selección de siempre",
        description: "Apostar por la llamada que quizá no llegue.",
        effects: { morale: 6, overall: 0.4, reputation: -3 },
      },
    ],
  },
];

/* ================================================================== */
/* 9 · Estrella consolidada                                            */
/* ================================================================== */

const STAR: EventTemplate[] = [
  {
    key: "ballon_campaign",
    title: "Tu nombre suena para el Balón de Oro",
    description: "El club monta una campaña de comunicación para empujar tu candidatura.",
    weight: 6,
    conditions: { minOverall: 85, minReputation: 70 },
    choices: [
      {
        key: "embrace", label: "Ponerte al frente de la campaña",
        description: "Entrevistas, portadas y actos cada semana.",
        effects: { reputation: 14, fitness: -9, overall: -0.4, morale: 4 },
      },
      {
        key: "team_first", label: "Pedir que la campaña sea para el equipo",
        description: "Repartir el foco entre tus compañeros.",
        effects: { morale: 10, assists: 2, reputation: 3 },
      },
      {
        key: "no_campaign", label: "Pedir que no hagan nada",
        description: "Que hablen los títulos.",
        effects: { overall: 0.8, fitness: 5, reputation: -5 },
      },
    ],
  },
  {
    key: "legacy_number",
    title: "Te ofrecen el dorsal mítico del club",
    description: "El número que llevó la leyenda de la casa. Con todo lo que pesa.",
    weight: 5,
    conditions: { minOverall: 82, minSeason: 4 },
    choices: [
      {
        key: "take_number", label: "Aceptarlo",
        description: "Asumir la comparación cada domingo.",
        effects: { reputation: 10, morale: 6 },
        failureEffects: { reputation: -8, morale: -12, overall: -0.5 },
        risk: {
          successChance: 0.5, modifier: "reputation",
          successLabel: "Lo honras y la grada te adopta como suyo.",
          failureLabel: "La comparación te ahoga todo el año.",
        },
      },
      {
        key: "keep_number", label: "Quedarte con el tuyo",
        description: "Construir tu propia historia sin herencias.",
        effects: { morale: 5, overall: 0.4, reputation: -2 },
      },
    ],
  },
  {
    key: "union_leader",
    title: "El sindicato de futbolistas te quiere de portavoz",
    description: "Huelga en el aire por el calendario. Ser la cara visible tiene coste.",
    weight: 5,
    conditions: { minReputation: 65, minSeason: 4 },
    choices: [
      {
        key: "lead_union", label: "Dar la cara por el colectivo",
        description: "Ganarte a los compañeros y enemistarte con los despachos.",
        effects: { reputation: 11, morale: 5, overall: -0.4, fitness: -5 },
      },
      {
        key: "support_quiet", label: "Apoyar sin exponerte",
        description: "Firmar pero no hablar.",
        effects: { morale: 3, reputation: 2 },
      },
      {
        key: "stay_out", label: "Mantenerte al margen",
        description: "Que lo lidere otro.",
        effects: { overall: 0.5, fitness: 4, morale: -5, reputation: -4 },
      },
    ],
  },
];

/* ================================================================== */
/* 10 · Veterano y declive                                             */
/* ================================================================== */

const VETERAN: EventTemplate[] = [
  {
    key: "losing_pace",
    title: "Ya no llegas a lo que llegabas",
    description: "El preparador te enseña los datos: has perdido dos décimas en los diez metros.",
    weight: 9,
    conditions: { minAge: 30 },
    choices: [
      {
        key: "reinvent", label: "Reinventarte en una posición más retrasada",
        description: "Cambiar piernas por cabeza.",
        effects: { overall: 1, assists: 2, goals: -3, morale: -4 },
      },
      {
        key: "fight_it", label: "Pelear contra el reloj en el gimnasio",
        description: "Doblar el trabajo físico a los treinta y tantos.",
        effects: { fitness: 8, overall: 0.5 },
        failureEffects: { fitness: -18, overall: -1.2, morale: -8 },
        risk: {
          successChance: 0.4, modifier: "fitness",
          successLabel: "Recuperas buena parte de la chispa.",
          failureLabel: "El cuerpo dice basta y te lesionas.",
        },
      },
      {
        key: "accept_role", label: "Aceptar un rol de rotación",
        description: "Menos minutos, más años por delante.",
        effects: { fitness: 12, morale: -6, reputation: -5, goals: -2 },
      },
    ],
  },
  {
    key: "coaching_badges",
    title: "Empezar el curso de entrenador",
    description: "Compatible con jugar, pero come tardes libres durante toda la temporada.",
    weight: 6,
    conditions: { minAge: 30 },
    choices: [
      {
        key: "start_badges", label: "Apuntarte ya",
        description: "Asegurar el después a costa del ahora.",
        effects: { reputation: 6, overall: -0.4, fitness: -5, morale: 5 },
      },
      {
        key: "later", label: "Dejarlo para cuando te retires",
        description: "Todo el foco en exprimir los años que quedan.",
        effects: { overall: 0.6, fitness: 4, morale: -2 },
      },
    ],
  },
  {
    key: "farewell_offer",
    title: "El club te ofrece una retirada dorada",
    description: "Un año más de contrato, partido homenaje y puesto en el organigrama.",
    weight: 6,
    conditions: { minAge: 33 },
    choices: [
      {
        key: "accept_farewell", label: "Aceptar y despedirte en casa",
        description: "Cerrar el círculo donde te quieren.",
        effects: { morale: 12, reputation: 6, overall: -0.6 },
      },
      {
        key: "one_more_fight", label: "Buscar un último reto competitivo fuera",
        description: "Nadie te asegura que salga bien.",
        effects: { overall: 0.8, reputation: 5, morale: -6, fitness: -6 },
      },
    ],
  },
  {
    key: "young_replacement",
    title: "Fichan a tu recambio",
    description: "Veinte años, la mitad de tu ficha y todo el club hablando de él.",
    weight: 8,
    conditions: { minAge: 29 },
    choices: [
      {
        key: "mentor_rival", label: "Ayudarle desde el primer día",
        description: "Acelerar el relevo que te va a quitar el puesto.",
        effects: { reputation: 9, morale: 4, goals: -2 },
      },
      {
        key: "close_ranks", label: "Cerrarle la puerta y competir",
        description: "Que se lo gane sin tu ayuda.",
        effects: { overall: 0.9, goals: 2, morale: -5, reputation: -6 },
      },
      {
        key: "talk_club", label: "Pedir explicaciones al club",
        description: "Preguntar qué planes tienen contigo.",
        effects: { morale: 6, reputation: 3 },
        failureEffects: { morale: -13, reputation: -5 },
        risk: {
          successChance: 0.42, modifier: "reputation",
          successLabel: "Te confirman que sigues siendo el titular.",
          failureLabel: "Te dicen a la cara que el futuro es suyo.",
        },
      },
    ],
  },
];

/* ================================================================== */
/* 11 · Vida personal                                                  */
/* ================================================================== */

const PERSONAL: EventTemplate[] = [
  {
    key: "birthday_party",
    title: "Celebración del vestuario hasta tarde",
    description: "Victoria importante y el grupo quiere salir. Hay partido el miércoles.",
    weight: 8,
    choices: [
      {
        key: "go_all_night", label: "Ir hasta el final",
        description: "Grupo unido, cuerpo destrozado.",
        effects: { morale: 14, reputation: 4, assists: 2 },
        failureEffects: { fitness: -18, morale: -8, reputation: -10 },
        risk: {
          successChance: 0.35, modifier: "fitness",
          successLabel: "Nadie se entera y el grupo sale reforzado.",
          failureLabel: "Fotos a las cinco de la mañana y multa del club.",
        },
      },
      {
        key: "brief", label: "Aparecer un rato y volver pronto",
        description: "Cumplir sin pasarte.",
        effects: { morale: 5, fitness: -2 },
      },
      {
        key: "skip_party", label: "Irte a casa a descansar",
        description: "Profesionalidad que el grupo no siempre entiende.",
        effects: { fitness: 8, overall: 0.3, morale: -4 },
      },
    ],
  },
  {
    key: "family_pressure",
    title: "Tu familia te pide volver a casa",
    description: "Un problema serio a mil kilómetros y tú en plena temporada.",
    weight: 7,
    conditions: { minSeason: 2 },
    choices: [
      {
        key: "go_home", label: "Coger un avión y perderte la semana",
        description: "Lo primero es lo primero.",
        effects: { morale: 8, goals: -2, fitness: -4, reputation: -4 },
      },
      {
        key: "stay_pro", label: "Quedarte y cumplir con el club",
        description: "Estar donde te pagan aunque la cabeza esté en otro sitio.",
        effects: { reputation: 4, morale: -12, overall: -0.4 },
      },
      {
        key: "bring_them", label: "Traerlos contigo a la ciudad",
        description: "Solución cara y logísticamente imposible.",
        effects: { morale: 6, fitness: -3, overall: -0.2 },
      },
    ],
  },
  {
    key: "charity_project",
    title: "Montar tu fundación en el barrio",
    description: "Devolver algo a donde te criaste, con todo lo que implica gestionarlo.",
    weight: 6,
    conditions: { minSeason: 3, minReputation: 45 },
    choices: [
      {
        key: "hands_on", label: "Implicarte personalmente",
        description: "Tu tiempo y tu cara en cada acto.",
        effects: { reputation: 12, morale: 8, fitness: -6, overall: -0.4 },
      },
      {
        key: "fund_only", label: "Poner el dinero y delegar",
        description: "Ayudar sin desgastarte.",
        effects: { reputation: 5, morale: 4 },
      },
      {
        key: "not_now", label: "Dejarlo para el final de tu carrera",
        description: "Ahora toca jugar.",
        effects: { overall: 0.5, fitness: 3, reputation: -2 },
      },
    ],
  },
  {
    key: "burnout",
    title: "Se te ha ido la ilusión",
    description: "Llevas semanas yendo a entrenar por inercia y el psicólogo del club lo ha notado.",
    weight: 7,
    conditions: { maxMorale: 45 },
    choices: [
      {
        key: "therapy", label: "Empezar a trabajarlo con el psicólogo",
        description: "Reconocerlo dentro del club.",
        effects: { morale: 14, overall: 0.4, reputation: -3 },
      },
      {
        key: "push_through", label: "Apretar los dientes y tirar",
        description: "Como se ha hecho toda la vida.",
        effects: { overall: 0.6, goals: 1, morale: -8, fitness: -5 },
      },
      {
        key: "break_away", label: "Pedir una semana de desconexión total",
        description: "Desaparecer en plena temporada.",
        effects: { morale: 16, fitness: 6, reputation: -8, goals: -2 },
      },
    ],
  },
];

export const EVENT_TEMPLATES: EventTemplate[] = [
  ...EARLY, ...COACHING, ...LOCKER, ...MEDIA, ...PHYSICAL,
  ...MARKET, ...COMPETITION, ...NATIONAL, ...STAR, ...VETERAN, ...PERSONAL,
];

/* ================================================================== */
/* Motor                                                               */
/* ================================================================== */

/** Desviación típica de cada métrica: define cuánto ruido tiene el resultado. */
const SIGMA: Record<EffectMetric, number> = {
  goals: 1.4,
  assists: 1.1,
  morale: 4,
  reputation: 3,
  overall: 0.7,
  fitness: 3.5,
};

const BOUNDS: Record<EffectMetric, [number, number]> = {
  goals: [-6, 9],
  assists: [-5, 8],
  morale: [-30, 30],
  reputation: [-20, 25],
  overall: [-3.5, 4],
  fitness: [-30, 25],
};

/**
 * Probabilidad de éxito efectiva: la base de la opción, corregida por el
 * atributo relevante. Un delantero con media 88 convierte una apuesta del 45%
 * en algo cercano al 52%; uno de 55, en un 39%.
 */
export function effectiveSuccessChance(choice: EventChoice, state: CareerState): number {
  const risk = choice.risk;
  if (!risk) return 1;
  if (!risk.modifier) return clamp(risk.successChance, 0.1, 0.85);

  // Pivote 70 para overall (media decente) y 60 para el resto: moral y forma
  // arrancan altas, así que un pivote de 50 regalaba casi todas las apuestas.
  const pivot = risk.modifier === "overall" ? 70 : 60;
  const adjust = ((state[risk.modifier] - pivot) / 100) * 0.4;
  // Nunca por debajo del 10% ni por encima del 85%: una apuesta que no puede
  // fallar deja de ser una apuesta.
  return clamp(risk.successChance + adjust, 0.1, 0.85);
}

function sample(rng: Rng, effects: ChoiceEffects): Record<EffectMetric, number> {
  const out = {} as Record<EffectMetric, number>;
  for (const key of Object.keys(SIGMA) as EffectMetric[]) {
    const mu = effects[key];
    if (mu === undefined) { out[key] = 0; continue; }
    const [lo, hi] = BOUNDS[key];
    const raw = clamp(normal(rng, mu, SIGMA[key]), lo, hi);
    out[key] = key === "overall" ? Math.round(raw * 10) / 10 : Math.round(raw);
  }
  return out;
}

export function applyChoice(
  rng: Rng, template: EventTemplate, choice: EventChoice, state: CareerState,
): AppliedEventOutcome {
  let effects = choice.effects;
  let roll: RollResult | undefined;

  if (choice.risk) {
    const successChance = effectiveSuccessChance(choice, state);
    const rolled = rng();
    const success = rolled < successChance;
    effects = success ? choice.effects : (choice.failureEffects ?? {});
    roll = {
      successChance,
      rolled,
      success,
      label: success ? choice.risk.successLabel : choice.risk.failureLabel,
    };
  }

  const d = sample(rng, effects);

  return {
    eventKey: template.key,
    choiceKey: choice.key,
    choiceLabel: choice.label,
    goalsBoost: d.goals,
    assistsBoost: d.assists,
    moraleDelta: d.morale,
    reputationDelta: d.reputation,
    overallDelta: d.overall,
    fitnessDelta: d.fitness,
    message: buildMessage(template, choice, d),
    roll,
  };
}

function buildMessage(
  t: EventTemplate, c: EventChoice, d: Record<EffectMetric, number>,
): string {
  // Los números los enseña el panel de efectos con barras; aquí solo el titular
  // y el tono general, para no repetir la misma información dos veces.
  const net = d.overall + d.reputation * 0.4 + d.morale * 0.2
    + d.goals + d.assists + d.fitness * 0.15;
  const tone = net > 1.5 ? "Sale bien." : net < -1.5 ? "Sale caro." : "Sin grandes cambios.";
  return `${t.title} · ${c.label}. ${tone}`;
}

/** Cuántas claves recientes se recuerdan para evitar repeticiones. */
export const EVENT_MEMORY = 24;

/**
 * Opción por defecto cuando el jugador cierra la temporada dejando decisiones
 * sin tomar: la de menor exposición, prefiriendo siempre las que no son apuesta.
 */
export function safestChoice(template: EventTemplate): EventChoice {
  const exposure = (c: EventChoice) => {
    const magnitude = (e: ChoiceEffects) =>
      (Object.entries(e) as [EffectMetric, number][])
        .reduce((sum, [k, v]) => sum + Math.abs(v) / SIGMA[k], 0);
    return magnitude(c.effects) + (c.risk ? 6 + magnitude(c.failureEffects ?? {}) : 0);
  };
  return [...template.choices].sort((a, b) => exposure(a) - exposure(b))[0];
}

function isEligible(t: EventTemplate, state: CareerState): boolean {
  const c = t.conditions;
  if (!c) return true;
  if (c.minSeason !== undefined && state.seasonNumber < c.minSeason) return false;
  if (c.maxSeason !== undefined && state.seasonNumber > c.maxSeason) return false;
  if (c.minAge !== undefined && state.age < c.minAge) return false;
  if (c.maxAge !== undefined && state.age > c.maxAge) return false;
  if (c.minOverall !== undefined && state.overall < c.minOverall) return false;
  if (c.maxOverall !== undefined && state.overall > c.maxOverall) return false;
  if (c.minReputation !== undefined && state.reputation < c.minReputation) return false;
  if (c.maxReputation !== undefined && state.reputation > c.maxReputation) return false;
  if (c.minMorale !== undefined && state.morale < c.minMorale) return false;
  if (c.maxMorale !== undefined && state.morale > c.maxMorale) return false;
  if (c.maxFitness !== undefined && state.fitness > c.maxFitness) return false;
  if (c.minTrophies !== undefined && state.trophies.length < c.minTrophies) return false;
  if (c.positions && !c.positions.includes(state.position)) return false;
  if (c.tiers) {
    const tier = tierOfTeam(state.currentTeamId);
    if (!tier || !c.tiers.includes(tier)) return false;
  }
  return true;
}

/**
 * Elige los eventos de la tanda. Prioriza los que no han salido últimamente:
 * solo recurre a los ya vistos si el catálogo elegible se queda corto.
 */
export function pickSeasonEvents(rng: Rng, state: CareerState, count: number): EventTemplate[] {
  const eligible = EVENT_TEMPLATES.filter(t => isEligible(t, state));
  const recent = new Set(state.recentEventKeys ?? []);

  const fresh = eligible.filter(t => !recent.has(t.key));
  const stale = eligible.filter(t => recent.has(t.key));
  // Los más antiguos de la memoria vuelven antes que los recién vistos.
  stale.sort((a, b) => (state.recentEventKeys ?? []).indexOf(a.key) - (state.recentEventKeys ?? []).indexOf(b.key));

  const pool = [...fresh];
  const picked: EventTemplate[] = [];

  for (let i = 0; i < count; i++) {
    if (pool.length === 0) {
      const next = stale.shift();
      if (!next) break;
      pool.push(next);
    }
    const chosen = pickWeighted(rng, pool, pool.map(t => t.weight));
    picked.push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
  }
  return picked;
}
