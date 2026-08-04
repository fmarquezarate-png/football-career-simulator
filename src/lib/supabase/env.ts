/**
 * Lectura única de las claves públicas de Supabase.
 *
 * Importante: `NEXT_PUBLIC_*` se inlinea en el bundle de cliente **en tiempo de
 * build**. Si las variables se añaden en Vercel después de un deploy, el
 * servidor las ve (runtime) pero el bundle de cliente sigue con `undefined`.
 * Por eso derivamos `configured` de estas mismas constantes en ambos lados:
 * cliente y servidor coinciden siempre y la app degrada a modo invitado en vez
 * de lanzar una excepción.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
