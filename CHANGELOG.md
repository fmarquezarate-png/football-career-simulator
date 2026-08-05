# Changelog

Todos los cambios relevantes de Football Career Simulator.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado es [SemVer](https://semver.org/lang/es/).

Cada entrega se desarrolla y prueba **en escritorio y en móvil** (viewport de
390 px), con pruebas automatizadas de navegador sobre el build de producción.

## [No publicado]

### Pendiente
- Inicio de sesión con Google: la app sigue mostrando «Modo invitado» porque
  las claves `NEXT_PUBLIC_*` no llegan al bundle de cliente. Ver
  [`docs/google-oauth.md`](docs/google-oauth.md).
- Escudos reales para las nueve ligas de fuera de Europa: la única fuente
  abierta encontrada cubre solo las 25 ligas europeas principales. Esos 144
  clubes usan un escudo generado con sus colores reales.

---

## [2.4.0] — Parte 3 · El mundo entero

### Añadido
- **33 ligas y 524 equipos**, de 5 ligas y 96 equipos. Europa aporta 24
  competiciones con escudos reales; Brasil, Argentina, México, Arabia Saudí,
  Estados Unidos, Japón, Colombia, **Chile** y Uruguay se añaden con escudos
  generados a partir de los colores reales de cada club.
- **Origen realista**. Antes el club de debut se sorteaba entre las 5 grandes
  ligas para todo el mundo. Ahora el sorteo tiene dos pasos: primero el país,
  que decide tu nacionalidad, y después el club dentro de esa liga. Un chileno
  debuta en Chile el 74 % de las veces en dificultad normal, el 94 % en
  Leyenda y el 44 % en Promesa de oro; si sale fuera, va antes a Argentina o
  Brasil que a Europa. Los países sin liga en el juego (Senegal, Marruecos)
  salen por sus rutas históricas: Francia, Bélgica, Portugal, Turquía.
- La pantalla de creación muestra **dónde es probable que debutes** antes de
  empezar.
- **El penalti decisivo**, jugable. En una final, eliges esquina y tipo de
  disparo sobre una portería dibujada mientras el portero elige a la vez.
  Ninguna combinación domina: entre el 71 % y el 81 % de acierto, con la
  Panenka como la apuesta de verdad. Ocurre en torno al 26 % de las
  temporadas y solo si tu club llega a una final.
- Copas, supercopas y torneos continentales propios de cada liga
  (Copa Libertadores, Copa Chile, Copa do Brasil, King's Cup…).
- Franjas de club calculadas **dentro de cada liga**: Colo-Colo es un grande
  en Chile aunque su media no llegue a la de un colista de la Premier.
- `scripts/build-leagues.mjs` regenera todo el catálogo desde
  `scripts/leagues.config.mjs`.

### Corregido
- Las partidas guardadas con el catálogo anterior apuntaban a clubes que ya no
  existen. Se reasignan por nombre al cargar, y el histórico y los contratos
  recuperan sus escudos.

### Cambiado
- El evento narrativo de tanda de penaltis se retira: ahora el penalti se
  juega de verdad.

---

## [2.3.0] — Parte 2 · Transparencia y resumen de temporada

### Añadido
- **Resumen de temporada rediseñado**: ficha de un vistazo con edad, escudo y
  nombre del club, partidos, goles, asistencias, nota media y media final.
- **Desglose «¿Por qué estos números?»**: explica de dónde sale cada gol.
  Separa lo que el modelo esperaba, lo que aportó el azar, lo que sumaron tus
  decisiones y el total real; y pondera cuánto sumó o restó cada factor (tu
  nivel, la moral, los minutos jugados, el ataque de tu equipo).
  Las aportaciones se miden **frente a un futbolista de nivel medio**, no
  frente a un valor absoluto, para que se lean como lo que son.
- **Trofeos dibujados**: cada competición tiene su silueta en SVG (la orejona,
  la copa del Mundial, el Balón de Oro, la Bota de Oro, el plato de la
  supercopa…) en lugar de una etiqueta de texto.
- **Línea temporal de carrera**: tabla temporada a temporada con edad, club,
  media, partidos, goles, asistencias, nota y títulos. Tabla en escritorio,
  tarjetas apiladas en móvil.
- Vitrina de títulos en el palmarés.
- Este changelog.

### Corregido
- La barra de pestañas del panel no cabía en móvil y provocaba scroll
  horizontal en toda la página. Ahora se desplaza dentro de sí misma.
- El menú lateral, cuando estaba cerrado, quedaba fuera de pantalla sin
  recortar y también generaba scroll horizontal.

---

## [2.2.0] — Parte 1 · Marca, ritmo y atributos vivos

### Añadido
- **Identidad Football Career Simulator**: isotipo del balón y lockup con el
  nombre en degradado dorado, ambos SVG inline. Favicon y metadatos.
- **Atributos vivos**. Antes se fijaban al crear el jugador y no volvían a
  moverse, mientras la media evolucionaba por su cuenta. Ahora la media se
  deriva de los atributos según los pesos de tu posición, y son los atributos
  los que cambian: cada decisión reparte su efecto entre ellos, el rendimiento
  de cada temporada entrena lo que se usa (una temporada goleadora sube el
  tiro; pocos minutos bajan el físico) y la edad resta primero velocidad,
  luego regate y físico. El potencial actúa como techo real.
- **Pierna hábil** elegible al crear el jugador. Ser ambidiestro mejora el
  pase a costa de algo de regate.

### Cambiado
- **5 decisiones por temporada** en lugar de 10.

### Corregido
- Los clubes interesados en ficharte aparecían de fondo antes de que tomaras
  las decisiones de la temporada: al cerrar la temporada se fijaban las ofertas
  y, en el mismo ciclo, se cargaban las decisiones de la siguiente, montando
  los dos diálogos a la vez. Ahora las decisiones se pausan mientras el cierre
  esté en pantalla, y el orden es resumen primero, ofertas después.

---

## [2.1.0] — Variedad y peso de las decisiones

### Añadido
- **45 eventos** en once bloques temáticos (cantera, cuerpo técnico, vestuario,
  prensa, físico, mercado, competición, selección, estrella, veterano y vida
  personal), filtrados por edad, media, reputación, moral, forma y franja del
  club. El motor recuerda los 24 últimos eventos para no repetirlos.
- **Sorteo visible** en las decisiones arriesgadas: probabilidad de éxito
  explícita (10–85 %) ajustada por tus atributos, animación de ÉXITO / FALLO y
  panel de efectos con barras comparativas.

### Cambiado
- **Ninguna opción es gratis.** Cada elección declara sus efectos por métrica y
  el 70 % mezcla signo positivo y negativo. Un script de balance verificó por
  valor esperado que no quede ninguna opción dominante: se corrigieron 8
  apuestas que eran trampas y una dominancia entre apuestas.
- La interfaz ya no adelanta el resultado de cada opción.

### Medido
- Solapamiento de eventos entre temporadas consecutivas: del ~83 % estructural
  al **3,5 %**, sobre 40 carreras de 12 temporadas.

---

## [2.0.1] — Escudos y datos

### Corregido
- **Los 96 escudos de club no cargaban**: enlazaban a `upload.wikimedia.org`,
  que responde 403 al hotlinking desde otro dominio. Ahora se sirven desde
  `public/crests/` y se generan con `scripts/sync-crests.mjs`.
- **Dos identificadores de equipo duplicados** entre ligas
  (Brentford/Stade Brestois y Monza/AS Monaco). Como el motor busca equipos por
  identificador, algunas carreras apuntaban al club equivocado. El script de
  escudos ahora falla si vuelve a aparecer un duplicado.

---

## [2.0.0] — Reescritura

### Añadido
- Next.js 15 (App Router), TypeScript, Tailwind y Supabase.
- Motor de simulación con distribuciones normal y de Poisson.
- 5 grandes ligas, selecciones nacionales y Mundiales cada 4 temporadas.
- **205 países jugables** con generador de nombres por región lingüística.
- **El club de debut se sortea**: la dificultad define la probabilidad de caer
  en cada franja de club.
- Cada dificultad explica qué implica y mueve de verdad el motor.
- Menú de navegación con hamburguesa en móvil y página de carreras guardadas.
- Guardado en la nube, compartir por enlace y comparar carreras.

### Corregido
- **La aplicación se rompía sin las claves de Supabase**: el cliente lanzaba
  una excepción cuando `NEXT_PUBLIC_SUPABASE_*` llegaban vacías al bundle.
  Como esas variables se incrustan en tiempo de build, un despliegue anterior
  a configurarlas dejaba al servidor viéndolas y al navegador no. Ahora ambos
  lados leen las mismas constantes y la app degrada a modo invitado.
- El umbral de convocatoria a la selección estaba invertido: era más difícil
  entrar en una selección débil que en una fuerte.
