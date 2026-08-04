"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CareerDashboard } from "@/components/career/dashboard";
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

  if (!loaded) return <main className="pitch-bg min-h-dvh" />;
  if (!state) {
    return (
      <main className="pitch-bg min-h-dvh grid place-items-center">
        <div className="text-center">
          <h1 className="text-3xl font-black">No hay carrera guardada</h1>
          <p className="text-muted-foreground my-4">Empieza una nueva carrera para jugar.</p>
          <Button asChild><Link href="/career/new">Nueva carrera</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="pitch-bg min-h-dvh">
      <CareerDashboard initialState={state} onChange={setState} />
    </main>
  );
}
