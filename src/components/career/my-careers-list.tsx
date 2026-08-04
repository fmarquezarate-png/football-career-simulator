"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Copy, Globe, Loader2, Lock, Play, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteCloudCareer, listMyCareers, togglePublic, type CloudCareerRow,
} from "@/lib/storage/cloud";
import { saveLocalCareer } from "@/lib/storage/local";
import { signInWithGoogle, useSession } from "@/lib/supabase/use-session";
import { DIFFICULTY_PROFILES } from "@/lib/data/difficulty";
import { POSITION_LABEL, type Difficulty, type Position } from "@/lib/data/types";
import { flagUrl } from "@/lib/data/loader";

export function MyCareersList() {
  const router = useRouter();
  const { user, loading: sessionLoading, configured } = useSession();
  const [rows, setRows] = useState<CloudCareerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRows(await listMyCareers());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las carreras.");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  if (!configured) {
    return (
      <EmptyState
        title="Guardado en la nube no disponible"
        text="Esta instancia no tiene Supabase configurado, así que solo puedes jugar en modo invitado (la partida vive en este navegador)."
      />
    );
  }

  if (sessionLoading) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="Inicia sesión para ver tus carreras"
        text="Con tu cuenta de Google guardas partidas en la nube, las recuperas desde cualquier dispositivo y las compartes con amigos."
        action={<Button onClick={() => void signInWithGoogle()}>Entrar con Google</Button>}
      />
    );
  }

  if (rows === null) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <EmptyState title="Error al cargar" text={error} action={<Button variant="outline" onClick={() => void refresh()}>Reintentar</Button>} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Todavía no has guardado ninguna carrera"
        text="Empieza una carrera y pulsa «Guardar en la nube» desde el panel para que aparezca aquí."
        action={<Button asChild><Link href="/career/new">Nueva carrera</Link></Button>}
      />
    );
  }

  async function onTogglePublic(row: CloudCareerRow) {
    setBusyId(row.id);
    try {
      await togglePublic(row.id, !row.is_public);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar la visibilidad.");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(row: CloudCareerRow) {
    if (!window.confirm(`¿Borrar definitivamente la carrera de ${row.player_name}? No se puede deshacer.`)) return;
    setBusyId(row.id);
    try {
      await deleteCloudCareer(row.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar la carrera.");
    } finally {
      setBusyId(null);
    }
  }

  function onResume(row: CloudCareerRow) {
    saveLocalCareer({ ...row.state, id: row.id });
    router.push("/career");
  }

  async function onCopyLink(row: CloudCareerRow) {
    const url = `${window.location.origin}/career/share/${row.share_slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(row.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-3">
      {rows.map(row => {
        const profile = DIFFICULTY_PROFILES[row.difficulty as Difficulty] ?? DIFFICULTY_PROFILES.normal;
        const busy = busyId === row.id;
        const trophies = row.state?.trophies?.length ?? 0;
        const awards = row.state?.awards?.length ?? 0;
        return (
          <article key={row.id} className="card-glass rounded-2xl p-5 transition-colors">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <Image
                  src={flagUrl(row.nationality, 80)} alt="" width={40} height={28}
                  unoptimized className="mt-1 shrink-0 rounded-[3px]"
                />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black">{row.player_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {POSITION_LABEL[row.position as Position] ?? row.position} ·{" "}
                    {row.age} años · Media {row.overall}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">Temporada {row.season_number}</Badge>
                    <Badge variant="secondary" className={profile.accent}>{profile.label}</Badge>
                    {trophies > 0 && (
                      <Badge variant="secondary" className="text-gold">
                        <Trophy className="mr-1 h-3 w-3" />{trophies}
                      </Badge>
                    )}
                    {awards > 0 && <Badge variant="secondary">{awards} premios</Badge>}
                    {row.is_retired && <Badge variant="secondary">Retirado</Badge>}
                    <Badge variant={row.is_public ? "default" : "secondary"}>
                      {row.is_public ? <><Globe className="mr-1 h-3 w-3" />Pública</> : <><Lock className="mr-1 h-3 w-3" />Privada</>}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!row.is_retired && (
                  <Button size="sm" onClick={() => onResume(row)} disabled={busy}>
                    <Play className="h-4 w-4" /> Continuar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => void onTogglePublic(row)} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : row.is_public ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  {row.is_public ? "Hacer privada" : "Hacer pública"}
                </Button>
                {row.is_public && row.share_slug && (
                  <Button size="sm" variant="outline" onClick={() => void onCopyLink(row)}>
                    {copied === row.id ? <><Check className="h-4 w-4 text-primary" /> Copiado</> : <><Copy className="h-4 w-4" /> Enlace</>}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => void onDelete(row)} disabled={busy}
                  aria-label={`Borrar carrera de ${row.player_name}`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-4 text-center">
              <Metric label="Partidos" value={row.totals?.apps ?? 0} />
              <Metric label="Goles" value={row.totals?.goals ?? 0} />
              <Metric label="Asistencias" value={row.totals?.assists ?? 0} />
              <Metric label="MVP" value={row.totals?.motm ?? 0} />
            </dl>
          </article>
        );
      })}

      <p className="pt-2 text-center text-xs text-muted-foreground">
        ¿Quieres medirte con un amigo? Haced públicas vuestras carreras y usad{" "}
        <Link href="/compare" className="underline hover:text-primary">el comparador</Link>.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xl font-black text-primary">{value}</dt>
      <dd className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dd>
    </div>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="card-glass grid place-items-center rounded-2xl p-12 text-center">
      <span className="mb-4 text-4xl">⚽</span>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mb-5 mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}
