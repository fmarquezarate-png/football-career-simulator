"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { signInWithGoogle, signOut, useSession } from "@/lib/supabase/use-session";

export function LoginButton() {
  const { user, configured } = useSession();
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <Button variant="outline" size="sm" disabled title="Supabase no configurado — juegas como invitado">
        <LogIn className="h-4 w-4" /> Modo invitado
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {user.user_metadata?.full_name ?? user.email}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await signOut();
            setBusy(false);
          }}
        >
          <LogOut className="h-4 w-4" /> Salir
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signInWithGoogle();
      }}
    >
      <LogIn className="h-4 w-4" /> Entrar con Google
    </Button>
  );
}
