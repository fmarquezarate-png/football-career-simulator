"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Bookmark, LogIn, LogOut, Menu, Plus, Trophy, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { signInWithGoogle, signOut, useSession } from "@/lib/supabase/use-session";

interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  /** Requiere sesión iniciada. */
  auth?: boolean;
}

const ITEMS: NavItem[] = [
  {
    href: "/career/new",
    label: "Nueva carrera",
    description: "Crea un jugador y sortea tu club de debut",
    icon: <Plus className="h-5 w-5" />,
  },
  {
    href: "/career",
    label: "Carrera actual",
    description: "Continúa la partida guardada en este dispositivo",
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    href: "/careers",
    label: "Mis carreras guardadas",
    description: "Tus carreras en la nube y las destacadas",
    icon: <Bookmark className="h-5 w-5" />,
    auth: true,
  },
  {
    href: "/compare",
    label: "Comparar con amigos",
    description: "Enfrenta dos carreras públicas lado a lado",
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

export function AppNav() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const { user, configured } = useSession();

  // Cierra el panel al navegar.
  useEffect(() => setOpen(false), [pathname]);

  // Bloquea el scroll del body mientras el panel está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = ITEMS.filter(i => !i.auth || (configured && user));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link href="/" aria-label="Football Career Simulator">
            <Logo compact />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {visible.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  pathname === item.href
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <AuthAction user={user} configured={configured} busy={busy} setBusy={setBusy} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menú"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Panel lateral (móvil) */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col gap-1 border-l border-white/10 bg-card p-5 shadow-2xl transition-transform duration-200",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <Logo compact />
            <Button variant="ghost" size="icon" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {visible.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-start gap-3 rounded-xl p-3 transition-colors",
                pathname === item.href ? "bg-primary/15" : "hover:bg-white/5",
              )}
            >
              <span className={cn("mt-0.5", pathname === item.href ? "text-primary" : "text-muted-foreground")}>
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.description}</span>
              </span>
            </Link>
          ))}

          {configured && !user && (
            <p className="mt-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
              <Users className="mb-1 h-4 w-4 text-primary" />
              Inicia sesión para guardar carreras en la nube, compartirlas por
              enlace y compararlas con tus amigos.
            </p>
          )}

          <div className="mt-auto pt-4">
            {user && (
              <p className="mb-2 truncate text-xs text-muted-foreground">
                Sesión: {user.user_metadata?.full_name ?? user.email}
              </p>
            )}
            <AuthAction user={user} configured={configured} busy={busy} setBusy={setBusy} full />
          </div>
        </aside>
      </div>
    </>
  );
}

function AuthAction({
  user, configured, busy, setBusy, full,
}: {
  user: { email?: string } | null;
  configured: boolean;
  busy: boolean;
  setBusy: (v: boolean) => void;
  full?: boolean;
}) {
  if (!configured) {
    return (
      <Button variant="outline" size="sm" disabled className={full ? "w-full" : undefined}
        title="Supabase no configurado — juegas como invitado">
        Modo invitado
      </Button>
    );
  }
  if (user) {
    return (
      <Button
        variant="outline" size="sm" disabled={busy} className={full ? "w-full" : undefined}
        onClick={async () => { setBusy(true); await signOut(); setBusy(false); }}
      >
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </Button>
    );
  }
  return (
    <Button
      size="sm" disabled={busy} className={full ? "w-full" : undefined}
      onClick={async () => { setBusy(true); await signInWithGoogle(); }}
    >
      <LogIn className="h-4 w-4" /> Entrar con Google
    </Button>
  );
}
