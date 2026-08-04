"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

export function LoginButton({ configured }: { configured: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  async function signIn() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }

  async function signOut() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setLoading(false);
  }

  if (!configured) {
    return (
      <Button variant="outline" size="sm" disabled title="Supabase no configurado">
        <LogIn className="h-4 w-4" /> Login (config pendiente)
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {user.user_metadata?.full_name ?? user.email}
        </span>
        <Button variant="outline" size="sm" onClick={signOut} disabled={loading}>
          <LogOut className="h-4 w-4" /> Salir
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={signIn} disabled={loading}>
      <LogIn className="h-4 w-4" /> Entrar con Google
    </Button>
  );
}
