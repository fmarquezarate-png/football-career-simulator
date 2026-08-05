"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

let cached: SupabaseClient | null = null;

/**
 * Devuelve el cliente de navegador, o `null` si Supabase no está configurado
 * en este bundle. Nunca lanza: sin claves la app sigue jugable en modo invitado.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  cached ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}

/** Igual que el anterior pero lanza; úsalo solo tras comprobar `isSupabaseConfigured()`. */
export function requireSupabaseBrowserClient(): SupabaseClient {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase no está configurado. Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el build.",
    );
  }
  return client;
}

export { isSupabaseConfigured };
