"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveCloudCareer, togglePublic } from "@/lib/storage/cloud";
import type { CareerState } from "@/lib/data/types";
import { Cloud, Share2, Check } from "lucide-react";
import { saveLocalCareer } from "@/lib/storage/local";

export function SyncButton({ state, onSaved }: { state: CareerState; onSaved: (s: CareerState) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!user) return null;

  async function save() {
    setSaving(true);
    try {
      const saved = await saveCloudCareer(state, user!.id);
      saveLocalCareer(saved);
      onSaved(saved);
    } finally { setSaving(false); }
  }

  async function share() {
    if (!state.id) { await save(); }
    if (!state.id) return;
    setSaving(true);
    try {
      const slug = await togglePublic(state.id, true);
      const url = `${window.location.origin}/career/share/${slug}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url).catch(() => {});
    } finally { setSaving(false); }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={save} disabled={saving}>
        {saving ? <Check className="h-4 w-4" /> : <Cloud className="h-4 w-4" />} Guardar en la nube
      </Button>
      <Button size="sm" onClick={share} disabled={saving}>
        <Share2 className="h-4 w-4" /> {shareUrl ? "¡Copiado!" : "Compartir"}
      </Button>
    </div>
  );
}
