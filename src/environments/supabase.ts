/**
 * Öffentliche Supabase-Laufzeitkonfiguration.
 * Werte werden aus `public/runtime-config.js` gelesen, das lokal aus Prozess-Umgebungsvariablen
 * erzeugt wird und niemals versioniert werden darf.
 */
export interface SupabaseRuntimeConfig {
  readonly supabaseUrl?: string;
  readonly supabasePublishableKey?: string;
  readonly supabaseSchema?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __CODE_A_CUISINE_CONFIG__: SupabaseRuntimeConfig | undefined;
}

const runtime = globalThis.__CODE_A_CUISINE_CONFIG__;

export const SUPABASE_PUBLIC_CONFIG = {
  url: runtime?.supabaseUrl?.trim() ?? '',
  publishableKey: runtime?.supabasePublishableKey?.trim() ?? '',
  schema: runtime?.supabaseSchema?.trim() || 'code_a_cuisine',
} as const;
