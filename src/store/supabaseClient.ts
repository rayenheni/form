import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SbClient } from "./supabaseStore";

/* `?.` indispensable : hors Vite (tests Node) `import.meta.env` n'existe pas. */
const env = (import.meta?.env ?? {}) as ImportMetaEnv;

/**
 * Repli du chemin d'administration, **commité** dans le dépôt.
 *
 * Indispensable : les aperçus (Arena, Netlify, GitHub Pages) construisent depuis le
 * code commité, où `.env.local` (gitignoré) est absent. Sans ce repli, `VITE_ADMIN_PATH`
 * serait vide dans ces builds et l'administration serait injoignable — exactement le
 * symptôme « aucun changement ». En production, définissez `VITE_ADMIN_PATH` pour
 * un chemin long et aléatoire ; ce repli n'est qu'un filet de sécurité.
 */
export const DEFAULT_ADMIN_PATH = "admin-fbl";

/** Chemin de l'administration : `VITE_ADMIN_PATH` s'il existe, sinon le repli commité. */
export const ADMIN_PATH = (env.VITE_ADMIN_PATH ?? "").trim().replace(/^#/, "") || DEFAULT_ADMIN_PATH;

export const supabaseUrl = (env.VITE_SUPABASE_URL ?? "").trim();
export const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY ?? "").trim();

/**
 * Mode aperçu : l'administration s'affiche par défaut, le site public se rejoint
 * avec `?site=1`. Réservé aux démonstrations (jamais en production).
 */
export const ADMIN_IS_DEFAULT = (env.VITE_PREVIEW_ADMIN ?? "").trim() === "1";

/** Le backend Supabase est-il configuré ? */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let client: SupabaseClient | null = null;

/** Client Supabase partagé (créé à la première demande). */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}

/** Client typé pour le magasin de contenu (lève si non configuré). */
export function requireSupabaseClient(): SbClient {
  const instance = getSupabaseClient();
  if (!instance) {
    throw new Error(
      "Supabase non configuré : renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir .env.example)."
    );
  }
  return instance as unknown as SbClient;
}
