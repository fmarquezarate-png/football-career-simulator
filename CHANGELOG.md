# Changelog

Todos los cambios relevantes de Football Career Simulator.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado es [SemVer](https://semver.org/lang/es/).

Cada entrega se desarrolla y prueba **en escritorio y en móvil** (viewport de
390 px), con pruebas automatizadas de navegador sobre el build de producción.

## [No publicado]

## [2.8.0] — El final de la carrera

Segunda pasada sobre la referencia, con el vídeo del tramo final: mercado de
pases, retirada y ficha para compartir.

### Cambiado
- **El mercado de pases también deja de ser un modal.** Es la última decisión
  de la temporada y ahora se ve donde se ven las demás: al pie de la tabla,
  con el mismo lenguaje —tarjetas de club que se encienden al elegirlas y
  apagan al resto—. Junto a la carrera que las ha provocado, una oferta del
  Brasileirão después de 20 goles en Chile se lee de otra manera.
- Como mucho **tres ofertas** más la de quedarse. Con más, elegir club se
  convertía en rellenar un formulario.
- **Chapa de media en oro, plata y bronce** en vez de la rampa verde-ámbar. El
  color dice de un vistazo en qué escalón del fútbol estabas cada temporada.
- Un icono diminuto delante de cada cifra de la tabla (camiseta, balón, bota):
  con seis columnas a tamaño de móvil, es lo que la deja leer sin subir a la
  cabecera.
- Los trofeos de cada temporada van junto al club, mucho más pequeños y como
  mucho tres: son un adorno de la fila, no pueden comerse el nombre del equipo.
- La Community Shield y las supercopas se dibujan como **escudo**, no como
  copa. A tamaño pequeño la silueta anterior no se distinguía de una copa.

### Añadido
- **Panel de fin de carrera**: los cuatro números que resumen veinte años
  —partidos, goles, asistencias y títulos— con la vitrina completa debajo.
- **Ficha para compartir**, que enseña la *mejor* versión del jugador y no la
  última: la media y el valor del pico, no los de los 38 años ya de vuelta en
  casa. Lleva la trayectoria en escudos, un escudo por club sin repetir los
  regresos, y los títulos. Con sesión iniciada genera enlace público; en modo
  invitado se ve igual, sin enlace.

### Corregido
- Un nombre de club largo (RCD Espanyol Barcelona) estiraba la cabecera de la
  tabla y sacaba la página de la pantalla en móvil: 71 px de scroll lateral.
- Retirado ya no quedaba una fila fantasma de la temporada siguiente.

### Eliminado
- `offers-dialog.tsx`, sustituido por el mercado en línea.

## [2.7.0] — La carrera en una sola pantalla

Rediseño completo de la pantalla de carrera, siguiendo la referencia que pasó
Fran (copero.com.ar). El cambio de fondo no es de estilo sino de arquitectura:
**se acabaron los modales para decidir**.

### Cambiado
- **La tabla de carrera es la pantalla.** Una fila por edad, de los 18 a los
  38, con las temporadas que quedan por jugar ya dibujadas en gris: se ve el
  hueco que falta por llenar y cada temporada cerrada lo va ocupando. Encima,
  una cabecera con la chapa de media a color, bandera, posición, escudo y club,
  edad y valor de mercado.
- **La decisión vive al pie de la tabla, no en un modal.** El jugador tiene
  delante sus números —media, goles, club, valor— justo mientras elige. Esto
  hace innecesario el mecanismo de «aparcar la decisión» que se añadió en la
  2.6.0: ya no hay nada que cerrar para ir a mirar la temporada.
- **Fuera las pestañas.** Atributos, vitrina, contratos e historial pasan a
  bloques plegables (`<details>` nativo, sin JS) que en escritorio ocupan la
  columna de al lado y en móvil se apilan bajo la decisión.
- El sorteo de éxito/fallo dura ~950 ms en vez de ~1700: encadenar tres
  decisiones con casi dos segundos de espera cada una se hacía pesado.
- Los cambios de atributo se agrupan por motivo. El desarrollo normal de una
  temporada escupía seis líneas idénticas de «Desarrollo a los 19».

### Añadido
- **Valor de mercado.** Crece de forma muy no lineal con la media, se hunde a
  partir de los 29 y depende de la liga: el mismo futbolista vale más en la
  Premier que en Primera de Chile, porque ahí está el dinero que lo puede
  pagar. Formato compacto: `€450K`, `€12,5M`.
- La selección queda fijada al pie de la tabla como una fila más, con
  partidos y goles internacionales acumulados.

### Eliminado
- `event-dialog.tsx` y `career-timeline.tsx`: los sustituyen el panel de
  decisión en línea y la tabla de carrera.

### Probado
- 18 comprobaciones en escritorio (1280 px) y otras 18 en móvil (390 px) sobre
  el build de producción: temporada completa con sus tres decisiones, resumen,
  mercado de fichajes y arranque de la siguiente, sin errores de consola, sin
  scroll horizontal y sin decimales largos.

### Seguridad
- La migración endurece sus dos funciones de trigger, siguiendo el linter de
  Supabase: `touch_updated_at` fija `search_path` (sin él se puede secuestrar
  creando objetos homónimos en otro esquema) y ambas revocan el permiso de
  ejecución de `anon`, `authenticated` y `public`, porque al vivir en el
  esquema `public` quedaban expuestas como RPC. Los triggers siguen
  funcionando: se ejecutan como el propietario, no como quien hace la
  petición.

## [2.6.0] — Ritmo de la partida

### Cambiado
- **3 decisiones por temporada** en lugar de 5. Con cinco, una carrera de 19
  temporadas pedía 57 decisiones y se hacía interminable.
- **Catálogo de 74 eventos** (antes 44), cargando en el tramo medio y tardío
  de carrera, que era donde se secaba.
- La memoria de eventos pasa de 24 a 120 claves: un evento no vuelve hasta que
  se agotan todos los que encajan con tu momento de carrera.

### Medido
- Decisiones de una carrera que repiten un evento ya visto: **del 41 % al 0 %**.
  Antes la primera repetición llegaba en la temporada 10; ahora una carrera
  completa no repite ninguna.
- Las 30 opciones nuevas pasaron el mismo control de dominancia por valor
  esperado que el resto: se corrigieron 10 casos y quedan 0.

### Añadido
- **La decisión se puede aparcar.** Ahora el diálogo se cierra para consultar
  estadísticas, atributos, palmarés o contratos, y un botón «Retomar
  decisiones» con el contador la recupera. Una vez elegida una opción ya no se
  puede cerrar: hay que ver el efecto.
- `scripts/fetch-world-crests.mjs`: descarga los escudos oficiales de las nueve
  ligas de fuera de Europa desde **TheSportsDB** y, como alternativa,
  **Wikipedia / Wikimedia Commons**. Sustituye los blasones generados y deja
  listados los clubes que no encuentre para afinarlos con un campo `search`.

### Pendiente
- Ejecutar `fetch-world-crests.mjs` y subir el resultado: los 144 clubes de
  fuera de Europa siguen con su escudo generado hasta entonces.
- Fase de grupos del Mundial jugable y rondas de copa partido a partido.

---

## [2.5.0] — Decimales y diagnóstico del login

### Corregido
- **Los decimales se desbordaban por toda la interfaz**: moral 62,5, medias
  con cola infinita, notas con dos decimales. El origen estaba en el motor:
  al amplificar el lado malo de una decisión según la dificultad se
  multiplicaba por 1,25 o 1,5 **sin redondear**, y moral, reputación y forma
  son valores enteros.

  Ahora el motor redondea en origen —enteros donde toca, un decimal en la
  media y la nota— y la interfaz aplica una regla única (`fmt`): **como mucho
  un decimal, y ninguno si el número es entero**. Las partidas guardadas que
  ya arrastraban decimales se sanean al cargarlas.

  Verificado con una prueba que recorre 60 carreras de 12 temporadas
  comprobando cada valor del estado, de los resúmenes, de los desgloses y de
  las ofertas: cero números con más de un decimal.
- El precio de traspaso heredaba los decimales del tope presupuestario del
  club cuando la operación chocaba con él.

### Añadido
- **Página `/diagnostico`** para el inicio de sesión. «No funciona el login»
  tiene tres causas que desde fuera se parecen: las variables no están, están
  pero no en el entorno que sirve esa URL, o están bien pero el build es
  anterior a añadirlas. La página compara **lo que ve el servidor** con **lo
  que quedó incrustado en el bundle del navegador**, prueba la conexión real
  con Supabase y dice cuál de los tres casos es y qué hacer. No muestra
  ninguna clave.
- El botón «Modo invitado» deja de ser un botón muerto y lleva al diagnóstico.

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
