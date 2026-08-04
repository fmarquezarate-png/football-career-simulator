import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoginButton } from "@/components/auth/login-button";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Trophy, Users, Globe2, Zap } from "lucide-react";

export default function LandingPage() {
  const configured = isSupabaseConfigured();
  return (
    <main className="pitch-bg min-h-dvh">
      <header className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-2 text-lg font-black">
          <span className="text-2xl">⚽</span> FCS
        </div>
        <LoginButton configured={configured} />
      </header>

      <section className="container flex flex-col items-center text-center py-16">
        <span className="text-5xl mb-3">⚽</span>
        <h1 className="text-5xl md:text-6xl font-black leading-tight max-w-3xl">
          Vive tu carrera<br />
          <span className="text-primary">como futbolista profesional</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Elige tu club, toma decisiones tácticas, gana Balones de Oro,
          disputa el Mundial y comparte tu carrera con amigos.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href="/career/new">Nueva carrera</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/career">Continuar carrera</Link>
          </Button>
        </div>
      </section>

      <section className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-16">
        <FeatureCard icon={<Zap className="h-6 w-6 text-primary" />}
          title="Decisiones dinámicas"
          text="10 eventos por temporada. 3-5 opciones cada uno con desviaciones estocásticas." />
        <FeatureCard icon={<Trophy className="h-6 w-6 text-gold" />}
          title="Todos los trofeos"
          text="Liga, Copa, Supercopa, Champions, Mundial y premios individuales (Balón de Oro, Bota de Oro, MVP)." />
        <FeatureCard icon={<Globe2 className="h-6 w-6 text-primary" />}
          title="5 grandes ligas + selección"
          text="LaLiga, Premier, Bundesliga, Serie A, Ligue 1. Convocatoria a tu selección." />
        <FeatureCard icon={<Users className="h-6 w-6 text-primary" />}
          title="Comparte y compara"
          text="Login con Google. Guarda en la nube y compara tus temporadas con tus amigos." />
      </section>

      <footer className="container py-6 text-center text-xs text-muted-foreground">
        v2.0.0 · <a className="underline" href="https://github.com/fmarquezarate-png/football-career-simulator" target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="mb-3">{icon}</div>
        <h3 className="font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
