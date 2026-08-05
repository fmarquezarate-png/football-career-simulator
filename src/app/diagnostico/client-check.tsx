"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Qué ve el navegador y qué hacer al respecto.
 *
 * Las dos referencias a `process.env.NEXT_PUBLIC_*` están escritas literalmente
 * **dentro de este componente de cliente**, y eso es deliberado: Next las
 * sustituye por su valor al compilar el bundle, así que lo que se lee aquí es
 * exactamente lo que tiene el navegador.
 *
 * No vale recibirlas por props desde el servidor. Si se hace así, el servidor
 * las lee en tiempo de ejecución y siempre saldrían en verde, ocultando justo
 * el caso que hay que detectar: build compilado antes de configurarlas.
 */
const BUILD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUILD_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function ClientCheck({
  serverHasUrl, serverHasKey,
}: {
  serverHasUrl: boolean;
  serverHasKey: boolean;
}) {
  const buildUrl = BUILD_URL;
  const buildKey = BUILD_KEY;
  const clientHasUrl = buildUrl.length > 0;
  const clientHasKey = buildKey.length > 0;
  const clientOk = clientHasUrl && clientHasKey;
  const serverOk = serverHasUrl && serverHasKey;

  const [reach, setReach] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [reachDetail, setReachDetail] = useState("");

  // Si el navegador tiene claves, comprobamos que Supabase responde de verdad.
  useEffect(() => {
    if (!clientOk) return;
    setReach("checking");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setReach("fail"); setReachDetail("El cliente no se pudo crear."); return; }
    supabase.auth.getSession()
      .then(({ error }) => {
        if (error) { setReach("fail"); setReachDetail(error.message); }
        else { setReach("ok"); setReachDetail("Supabase responde correctamente."); }
      })
      .catch((e: unknown) => {
        setReach("fail");
        setReachDetail(e instanceof Error ? e.message : "No se pudo contactar con Supabase.");
      });
  }, [clientOk]);

  const verdict = !serverOk && !clientOk
    ? {
        tone: "bad" as const,
        title: "Las variables no están puestas en este entorno",
        steps: [
          "Vercel → tu proyecto → Settings → Environment Variables.",
          "Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY con los valores de Supabase (Settings → API).",
          "Marca las tres casillas de entorno: Production, Preview y Development.",
          "Deployments → ⋯ del último → Redeploy, DESMARCANDO «Use existing Build Cache».",
        ],
      }
    : serverOk && !clientOk
    ? {
        tone: "warn" as const,
        title: "El servidor las tiene, el navegador no: el build es anterior a las variables",
        steps: [
          "Las NEXT_PUBLIC_* se incrustan al compilar, no se leen en cada visita.",
          "Vercel → Deployments → ⋯ del último despliegue → Redeploy.",
          "IMPORTANTE: desmarca «Use existing Build Cache». Con la caché activada se reutiliza el bundle viejo y no cambia nada.",
          "Cuando termine, recarga esta página: la columna del navegador debe ponerse en verde.",
        ],
      }
    : !serverOk && clientOk
    ? {
        tone: "warn" as const,
        title: "El navegador las tiene pero el servidor no",
        steps: [
          "Suele significar que las variables están marcadas solo para algunos entornos.",
          "Vercel → Settings → Environment Variables: marca Production, Preview y Development en las tres.",
          "Vuelve a desplegar sin caché.",
        ],
      }
    : reach === "fail"
    ? {
        tone: "bad" as const,
        title: "Las claves llegan, pero Supabase rechaza la conexión",
        steps: [
          `Error devuelto: ${reachDetail}`,
          "Comprueba que la URL corresponde al proyecto correcto y que la clave es la «anon public», no la «service_role».",
          "Supabase → Settings → API.",
        ],
      }
    : {
        tone: "good" as const,
        title: "Configuración correcta",
        steps: [
          "El botón de arriba debe decir «Entrar con Google».",
          "Si al pulsarlo Google da error, el problema ya no es Vercel sino la configuración del proveedor: revisa docs/google-oauth.md.",
        ],
      };

  return (
    <>
      <section className="card-glass mb-4 rounded-2xl p-6">
        <h2 className="mb-1 text-lg font-black">2 · Lo que ve el navegador</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Valores incrustados en el bundle al compilar. Si aquí falta algo, el
          build se hizo antes de configurar las variables.
        </p>
        <ul className="space-y-2">
          <ClientRow name="NEXT_PUBLIC_SUPABASE_URL" ok={clientHasUrl}
            detail={clientHasUrl ? buildUrl.replace(/^https?:\/\//, "").slice(0, 48) : "no llegó al bundle"} />
          <ClientRow name="NEXT_PUBLIC_SUPABASE_ANON_KEY" ok={clientHasKey}
            detail={clientHasKey ? `presente · ${buildKey.length} caracteres` : "no llegó al bundle"} />
        </ul>

        {clientOk && (
          <p className="mt-3 text-xs text-muted-foreground">
            Conexión con Supabase:{" "}
            {reach === "checking" && <span>comprobando…</span>}
            {reach === "ok" && <span className="font-bold text-primary">✓ {reachDetail}</span>}
            {reach === "fail" && <span className="font-bold text-destructive">✗ {reachDetail}</span>}
          </p>
        )}
      </section>

      <section
        className={cn(
          "rounded-2xl border p-6",
          verdict.tone === "good" && "border-primary/40 bg-primary/10",
          verdict.tone === "warn" && "border-accent/40 bg-accent/10",
          verdict.tone === "bad" && "border-destructive/40 bg-destructive/10",
        )}
      >
        <h2 className="mb-1 text-lg font-black">3 · Qué hacer</h2>
        <p
          className={cn(
            "mb-3 font-bold",
            verdict.tone === "good" && "text-primary",
            verdict.tone === "warn" && "text-accent",
            verdict.tone === "bad" && "text-destructive",
          )}
        >
          {verdict.title}
        </p>
        <ol className="space-y-2">
          {verdict.steps.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
              <span className="shrink-0 font-black text-foreground">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function ClientRow({ name, ok, detail }: { name: string; ok: boolean; detail: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-black/20 px-3 py-2">
      <span className={ok ? "text-primary" : "text-destructive"}>{ok ? "✓" : "✗"}</span>
      <code className="text-xs font-bold">{name}</code>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </li>
  );
}
