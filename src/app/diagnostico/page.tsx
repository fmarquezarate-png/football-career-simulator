import { AppNav } from "@/components/nav/app-nav";
import { ClientCheck } from "./client-check";

export const metadata = { title: "Diagnóstico de configuración" };
// Debe leer el entorno en cada petición, no en el build.
export const dynamic = "force-dynamic";

/**
 * Página de diagnóstico del login.
 *
 * Existe porque «no funciona el inicio de sesión» tiene tres causas posibles
 * que se parecen entre sí desde fuera, y distinguirlas a ojo es imposible:
 *
 *  1. Las variables no están puestas en Vercel.
 *  2. Están puestas pero no para el entorno que sirve esta URL.
 *  3. Están bien pero el build es anterior a añadirlas, y como las
 *     `NEXT_PUBLIC_*` se incrustan al compilar, el navegador no las tiene
 *     aunque el servidor sí.
 *
 * Comparar lo que ve el servidor con lo que ve el navegador separa los tres
 * casos sin ambigüedad. No se muestra ninguna clave: solo si está presente,
 * su longitud y el dominio del proyecto.
 */
export default function DiagnosticoPage() {
  const server = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    site: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    vercelEnv: process.env.VERCEL_ENV ?? "(no es Vercel)",
  };

  return (
    <div className="pitch-bg min-h-dvh">
      <AppNav />
      <main className="container max-w-3xl py-10">
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">
          Diagnóstico del <span className="text-gradient-pitch">inicio de sesión</span>
        </h1>
        <p className="mb-8 mt-3 text-sm text-muted-foreground">
          Esta página no muestra ninguna clave. Solo comprueba si llegan, a
          dónde, y te dice exactamente qué hacer.
        </p>

        <section className="card-glass mb-4 rounded-2xl p-6">
          <h2 className="mb-1 text-lg font-black">1 · Lo que ve el servidor</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Variables de entorno en tiempo de ejecución. Entorno de Vercel:{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">{server.vercelEnv}</code>
          </p>
          <ul className="space-y-2">
            <Row name="NEXT_PUBLIC_SUPABASE_URL" value={server.url} kind="url" />
            <Row name="NEXT_PUBLIC_SUPABASE_ANON_KEY" value={server.key} kind="key" />
            <Row name="NEXT_PUBLIC_SITE_URL" value={server.site} kind="url" />
          </ul>
        </section>

        {/* Lo que quedó incrustado en el bundle de cliente al compilar. */}
        <ClientCheck
          serverHasUrl={server.url.length > 0}
          serverHasKey={server.key.length > 0}
        />
      </main>
    </div>
  );
}

function Row({ name, value, kind }: { name: string; value: string; kind: "url" | "key" }) {
  const present = value.length > 0;
  let detail = "no está definida";
  if (present) {
    detail = kind === "url"
      ? value.replace(/^https?:\/\//, "").slice(0, 48)
      : `presente · ${value.length} caracteres · empieza por ${value.slice(0, 6)}…`;
  }
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-black/20 px-3 py-2">
      <span className={present ? "text-primary" : "text-destructive"}>{present ? "✓" : "✗"}</span>
      <code className="text-xs font-bold">{name}</code>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </li>
  );
}
