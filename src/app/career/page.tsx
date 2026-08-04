"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CareerDashboard } from "@/components/career/dashboard";
import { AppNav } from "@/components/nav/app-nav";
import { loadLocalCareer } from "@/lib/storage/local";
import type { CareerState } from "@/lib/data/types";
import { Button } from "@/components/ui/button";

export default function CareerPage() {
  const [state, setState] = useState<CareerState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadLocalCareer());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="pitch-bg min-h-dvh">
        <AppNav />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="pitch-bg min-h-dvh">
        <AppNav />
        <main className="container grid place-items-center py-24 text-center">
          <span className="mb-4 text-5xl">⚽</span>
          <h1 className="text-3xl font-black">No hay carrera en este dispositivo</h1>
          <p className="my-4 max-w-md text-muted-foreground">
            Empieza una nueva carrera, o inicia sesión y recupera una de tus
            carreras guardadas en la nube.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild><Link href="/career/new">Nueva carrera</Link></Button>
            <Button asChild variant="outline"><Link href="/careers">Mis carreras guardadas</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pitch-bg min-h-dvh">
      <AppNav />
      <CareerDashboard initialState={state} onChange={setState} />
    </div>
  );
}
