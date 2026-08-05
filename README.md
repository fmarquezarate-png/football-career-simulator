# ⚽ Football Career Simulator

Simulador de carrera de fútbol construido con Next.js 15 + Supabase.
Elige tu club, toma decisiones estocásticas cada temporada, gana Balones
de Oro, disputa el Mundial y comparte tu carrera con amigos.

- **Stack**: Next.js 15 (App Router, RSC) · TypeScript · Tailwind · shadcn/ui · Supabase · Vercel
- **Auth**: Google OAuth vía Supabase (login opcional; se puede jugar como invitado con localStorage)
- **Motor**: distribuciones normal / Poisson para simulación de partidos, temporadas y eventos narrativos
- **Deploy**: Vercel

## 🎮 Qué incluye

- **33 ligas y 524 equipos** de todo el mundo. Las 24 europeas con escudos
  reales; Brasil, Argentina, México, Arabia Saudí, Estados Unidos, Japón,
  Colombia, Chile y Uruguay con escudos generados a partir de los colores
  reales de cada club.
- **Dónde debutas lo decide tu nacionalidad.** Un chileno empieza en Chile el
  74 % de las veces; salir fuera depende de la dificultad, y lo normal es ir
  antes a Argentina o Brasil que a Europa.
- **El penalti decisivo**: en una final eliges esquina y tipo de disparo
  mientras el portero elige a la vez.
- **205 países jugables** (miembros FIFA + selecciones británicas), con
  generador de nombres por región lingüística
- **El club de debut se sortea**: no lo eliges. Cada dificultad define una
  distribución de probabilidad sobre cuatro franjas de club
  (élite / grande / mitad de tabla / modesto)
- Selecciones nacionales + Mundiales cada 4 temporadas
- Escudos reales de los 96 clubes, servidos en local desde `public/crests/`
- **45 eventos narrativos** repartidos en once bloques temáticos (cantera,
  cuerpo técnico, vestuario, prensa, físico, mercado, competición, selección,
  estrella, veterano y vida personal). El catálogo se filtra por edad, media,
  reputación, moral, forma y franja del club, así que un canterano de 18 años
  y un veterano de 33 ven repertorios casi disjuntos. El motor además recuerda
  los 24 últimos eventos vividos para no repetirlos.
- **5 decisiones por temporada**, resueltas de una en una:
  eliges → ves el resultado → continúas.
  - **Ninguna opción es gratis.** Cada elección declara sus efectos por
    métrica y el 70% mezcla signo positivo y negativo: ganar reputación cuesta
    moral, ganar media cuesta forma. La interfaz no adelanta el resultado.
  - Las opciones marcadas como **apuesta** pasan antes por un sorteo con
    probabilidad de éxito explícita (10–85%), ajustada por tu media,
    reputación, moral o forma. El resultado se anima en pantalla
    (ÉXITO / FALLO) y después se muestran los efectos con barras comparativas.
- Trofeos de club (liga, copa, supercopa, Champions) y premios individuales
  (Bota de Oro, MVP, Balón de Oro)
- **Atributos vivos**: velocidad, tiro, pase, regate, defensa y físico ya no
  son decorativos. La media sale de ellos según tu puesto, y se mueven con cada
  decisión, con lo que hagas en el campo y con la edad (primero se van las
  piernas, después el cuerpo). El potencial es un techo real.
- Pierna hábil elegible al crear el jugador
- Sistema de contratos y ofertas al final de cada temporada
- Guardado local (modo invitado) o en Supabase (login con Google)
- Compartir carrera pública por URL y **comparar dos carreras** lado a lado

## 🚀 Deploy en Vercel · guía paso a paso

### 1. Crea tu proyecto Supabase (gratis)

1. Ve a <https://supabase.com/dashboard>, "New project".
2. Copia `Project URL` y `anon public` key desde `Settings → API`.
3. Abre `SQL editor` y pega el contenido de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Ejecuta. Crea tablas, políticas RLS y trigger de profiles.

### 2. Habilita Google OAuth en Supabase

> 📘 **¿Te atascas aquí?** Hay una guía detallada, paso a paso y con tabla de
> errores comunes, en [`docs/google-oauth.md`](docs/google-oauth.md).

1. En Google Cloud Console, crea unas credenciales OAuth
   (`Web application`). Añade como **Authorized redirect URI**:
   `https://<TU-PROJECT-REF>.supabase.co/auth/v1/callback`
2. Copia el `Client ID` y `Client Secret`.
3. En Supabase: `Authentication → Providers → Google`, pega ambos y
   activa el provider.
4. En `Authentication → URL Configuration`, añade a
   `Redirect URLs`:
   - `http://localhost:3000/auth/callback`
   - `https://TU-DOMINIO-VERCEL.vercel.app/auth/callback`

### 3. Prueba en local

```bash
cp .env.example .env.local
# Rellena NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
# → http://localhost:3000
```

### 4. Deploy en Vercel

1. Push a GitHub.
2. En Vercel → "Add new project" → importa el repo.
3. En `Settings → Environment Variables` añade las tres claves de
   `.env.example`. Marca `NEXT_PUBLIC_SITE_URL` con tu URL final de Vercel.
   **Márcalas para los tres entornos** (Production, Preview y Development):
   los deploys de rama (`...-git-main-....vercel.app`) usan el entorno
   Preview, y si ahí faltan las claves esas URLs se quedan en modo invitado.
4. Deploy. El framework se detecta automáticamente.

> ⚠️ **Las variables `NEXT_PUBLIC_*` se incrustan en el bundle durante el
> build, no se leen en runtime.** Si las añades después de un deploy, hay que
> volver a desplegar (`Deployments → ⋯ → Redeploy`, **sin** "Use existing
> Build Cache") para que lleguen al navegador. La app ya no se rompe si
> faltan: degrada a modo invitado y lo indica en el menú.

### 5. Verifica

- Landing OK, botón `Entrar con Google` funciona.
- `Nueva carrera` guarda en localStorage y muestra el dashboard.
- `Guardar en la nube` requiere login; `Compartir` marca la carrera
  como pública y copia la URL.
- `/compare?a=SLUG_A&b=SLUG_B` compara dos carreras públicas.

## 🧩 Modo invitado

Si no configuras Supabase la app funciona igual, pero sin cloud save
ni share/compare. La partida se guarda en `localStorage`.

## 🗂️ Estructura

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Landing
│   ├── career/               # Dashboard + setup
│   ├── career/share/[slug]/  # Página pública de una carrera
│   ├── compare/              # Comparador de dos carreras
│   └── auth/callback/        # OAuth callback
├── components/
│   ├── ui/                   # shadcn/ui
│   ├── auth/                 # LoginButton
│   └── career/               # Dashboard, dialogs, sync
├── lib/
│   ├── data/                 # Types, loader, nacionalidades
│   ├── engine/               # Motor de simulación
│   ├── storage/              # localStorage + Supabase
│   └── supabase/             # Clientes SSR/browser
└── middleware.ts             # Refresh de sesión Supabase
public/data/                  # JSON de ligas y selecciones
supabase/migrations/          # Esquema SQL
legacy/                       # Versión vanilla-JS anterior (referencia)
```

## 📋 Al cerrar cada temporada

- **Ficha de un vistazo**: edad, escudo y club, partidos, goles, asistencias,
  nota media y media final.
- **«¿Por qué estos números?»**: separa lo que el modelo esperaba de ti, lo que
  puso el azar, lo que sumaron tus decisiones y el total real; y pondera cuánto
  aportó cada factor (tu nivel, la moral, los minutos, el ataque del equipo)
  **frente a un futbolista de nivel medio**.
- **Trofeos dibujados**, no escritos: cada competición tiene su silueta.
- **Línea temporal** temporada a temporada: tabla en escritorio, tarjetas en
  móvil.

Ver [`CHANGELOG.md`](CHANGELOG.md) para el historial completo de cambios.

## 🛡️ Escudos de los clubes

Los escudos viven en `public/crests/<teamId>.png` y se sirven desde el propio
dominio. **No se enlazan desde Wikipedia**: `upload.wikimedia.org` responde 403
al hotlinking desde otro dominio, así que enlazados no cargaban nunca.

Las 24 ligas europeas usan el escudo real del club. Las nueve de fuera de
Europa usan un escudo generado a partir de los colores reales de cada club: la
única fuente abierta que encontramos cubre solo las competiciones europeas.

Para regenerar todo el catálogo de ligas, equipos y escudos:

```bash
git clone --depth 1 https://github.com/luukhopman/football-logos /tmp/fl
node scripts/build-leagues.mjs /tmp/fl
```

Las ligas se definen en [`scripts/leagues.config.mjs`](scripts/leagues.config.mjs):
la fuerza de cada competición gobierna la media de sus equipos, sus
presupuestos y lo difícil que es dar el salto desde ella.

## 🧪 Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # build producción
npm run typecheck  # tsc --noEmit
npm run start      # servir build
```

## 🛣️ Roadmap post-MVP

- Añadir 24 ligas (Argentina, Brasil, MLS, Saudí, etc.)
- Rondas de Copa doméstica y Champions simuladas partido a partido
- Fase de grupos del Mundial jugable
- Rivalidades personales entre usuarios (H2H de temporadas)
- Editor de plantillas y ligas custom
