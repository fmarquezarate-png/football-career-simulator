# ⚽ Football Career Simulator v2

Simulador de carrera de fútbol construido con Next.js 15 + Supabase.
Elige tu club, toma decisiones estocásticas cada temporada, gana Balones
de Oro, disputa el Mundial y comparte tu carrera con amigos.

- **Stack**: Next.js 15 (App Router, RSC) · TypeScript · Tailwind · shadcn/ui · Supabase · Vercel
- **Auth**: Google OAuth vía Supabase (login opcional; se puede jugar como invitado con localStorage)
- **Motor**: distribuciones normal / Poisson para simulación de partidos, temporadas y eventos narrativos
- **Deploy**: Vercel

## 🎮 Qué incluye

- 5 ligas top con equipos, escudos y ratings (LaLiga, Premier, Bundesliga, Serie A, Ligue 1)
- **205 países jugables** (miembros FIFA + selecciones británicas), con
  generador de nombres por región lingüística
- **El club de debut se sortea**: no lo eliges. Cada dificultad define una
  distribución de probabilidad sobre cuatro franjas de club
  (élite / grande / mitad de tabla / modesto)
- Selecciones nacionales + Mundiales cada 4 temporadas
- ~10 eventos narrativos por temporada con 3–5 opciones cada uno.
  Cada opción tiene un `qualityBias` que sirve como mu de una distribución
  normal para determinar goles/asistencias/moral/reputación/overall/fitness.
- Trofeos de club (liga, copa, supercopa, Champions) y premios individuales
  (Bota de Oro, MVP, Balón de Oro)
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
