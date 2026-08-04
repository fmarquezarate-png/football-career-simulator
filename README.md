# ⚽ Football Career Simulator

Simulador de carrera de fútbol completo con estadísticas, ligas, trofeos y gestión de equipos. Más completo que cualquier simulador existente.

## 🚀 Demo
[Ver en Vercel](https://football-career-simulator.vercel.app)

## ✨ Características
- 🌍 Más de 30 ligas de todo el mundo
- 🏆 Sistema completo de trofeos por país y temporada
- ⚽ Logos de equipos con fallback SVG
- 📊 Estadísticas detalladas de jugadores y equipos
- 🎮 Simulación de partidos con lógica avanzada
- 📅 Gestión completa de temporadas
- 💰 Sistema de fichajes y mercado de pases
- 🧬 Progresión de atributos del jugador

## 🗂️ Estructura
```
football-career-simulator/
├── index.html              # Página principal / menú
├── pages/
│   ├── career.html         # Simulador de carrera
│   ├── leagues.html        # Explorador de ligas
│   └── trophies.html       # Sala de trofeos
├── css/
│   ├── main.css
│   ├── career.css
│   └── components.css
├── js/
│   ├── main.js
│   ├── engine/
│   │   ├── matchEngine.js  # Motor de simulación de partidos
│   │   ├── careerManager.js
│   │   └── statsEngine.js
│   └── data/
│       ├── dataLoader.js
│       └── storage.js
├── data/
│   ├── leagues/            # JSON por país
│   ├── teams/              # Equipos y logos
│   ├── trophies/           # Trofeos por liga
│   └── players/            # Base de jugadores
└── assets/
    ├── logos/              # Logos de equipos (SVG/PNG)
    └── trophies/           # Imágenes de trofeos
```

## 🛠️ Stack
- **Frontend**: HTML5, CSS3 (variables CSS, grid, flexbox), Vanilla JS (ES6+)
- **Datos**: JSON estático (sin backend)
- **Deploy**: Vercel
- **Almacenamiento**: localStorage para partidas guardadas

## 📦 Deploy en Vercel
1. Fork o conecta este repositorio en [vercel.com](https://vercel.com)
2. Deploy automático en cada push a `main`
3. No requiere configuración adicional
