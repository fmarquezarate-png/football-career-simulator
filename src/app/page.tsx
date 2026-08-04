import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/nav/app-nav";
import { DIFFICULTY_ORDER, DIFFICULTY_PROFILES } from "@/lib/data/difficulty";
import { COUNTRIES } from "@/lib/data/countries";
import { Dices, Globe2, Share2, Trophy, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="pitch-bg min-h-dvh">
      <AppNav />

      <main>
        {/* Hero */}
        <section className="container flex flex-col items-center py-16 text-center md:py-24">
          <span className="animate-ball mb-4 text-6xl">⚽</span>

          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Zap className="h-3.5 w-3.5" /> Temporada 2026
          </p>

          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
            De canterano<br />
            <span className="text-gradient-pitch">a leyenda mundial</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Crea tu futbolista, deja que el sorteo decida dónde debutas y toma
            las decisiones que definen una carrera. Goles, títulos, Balones de
            Oro y Mundiales — todo simulado con probabilidad real.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="glow-primary h-12 px-8 text-base">
              <Link href="/career/new">⚽ Empezar carrera</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
              <Link href="/career">Continuar partida</Link>
            </Button>
          </div>

          <dl className="mt-14 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
            <Stat value={`${COUNTRIES.length}`} label="países jugables" />
            <Stat value="5" label="grandes ligas" />
            <Stat value="10" label="decisiones/temporada" />
            <Stat value="20" label="temporadas de carrera" />
          </dl>
        </section>

        {/* Features */}
        <section className="container grid gap-4 pb-16 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Dices className="h-6 w-6" />}
            tone="text-primary"
            title="Tu club se sortea"
            text="No eliges equipo. La dificultad define la probabilidad de caer en un grande o en un club modesto — como en la vida real."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            tone="text-sky-400"
            title="Decisiones con peso"
            text="10 eventos narrativos por temporada, 3-5 opciones cada uno. Cada opción mueve una distribución normal: nunca sabes el resultado exacto."
          />
          <FeatureCard
            icon={<Trophy className="h-6 w-6" />}
            tone="text-gold"
            title="Todos los trofeos"
            text="Liga, Copa, Supercopa, Champions y Mundial. Y en lo individual: Bota de Oro, MVP y Balón de Oro."
          />
          <FeatureCard
            icon={<Share2 className="h-6 w-6" />}
            tone="text-accent"
            title="Comparte y compara"
            text="Guarda en la nube con tu cuenta de Google, comparte tu carrera por enlace y compárala con la de tus amigos."
          />
        </section>

        {/* Dificultades */}
        <section className="container pb-20">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black md:text-4xl">
              Elige cuánto quieres <span className="text-gradient-pitch">sufrir</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              La dificultad no es un adorno: cambia tu media inicial, el club que
              te toca, cuánto progresas y cuánto castigan los errores.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {DIFFICULTY_ORDER.map(id => {
              const p = DIFFICULTY_PROFILES[id];
              return (
                <div key={id} className="card-glass rounded-2xl p-5 transition-colors">
                  <h3 className={`text-lg font-black ${p.accent}`}>{p.label}</h3>
                  <p className="mb-4 text-xs text-muted-foreground">{p.tagline}</p>
                  <ul className="space-y-2 text-sm">
                    {p.bullets.map(b => (
                      <li key={b} className="flex gap-2 text-muted-foreground">
                        <span className={p.accent}>▸</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA final */}
        <section className="container pb-20">
          <div className="card-glass glow-primary flex flex-col items-center gap-5 rounded-3xl p-10 text-center">
            <Globe2 className="h-10 w-10 text-primary" />
            <h2 className="max-w-xl text-3xl font-black">
              Cualquier país. Cualquier posición. Una sola carrera.
            </h2>
            <p className="max-w-lg text-muted-foreground">
              Elige entre {COUNTRIES.length} nacionalidades, juega el Mundial con
              tu selección y llega hasta donde te lleve el talento.
            </p>
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/career/new">Crear mi jugador →</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="container border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        FCS v2.1 ·{" "}
        <a
          className="underline hover:text-primary"
          href="https://github.com/fmarquezarate-png/football-career-simulator"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card-glass rounded-xl px-3 py-4">
      <dt className="text-2xl font-black text-primary md:text-3xl">{value}</dt>
      <dd className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dd>
    </div>
  );
}

function FeatureCard({
  icon, title, text, tone,
}: { icon: React.ReactNode; title: string; text: string; tone: string }) {
  return (
    <div className="card-glass rounded-2xl p-6 transition-colors">
      <div className={`mb-4 inline-flex rounded-xl bg-white/5 p-3 ${tone}`}>{icon}</div>
      <h3 className="mb-2 font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
