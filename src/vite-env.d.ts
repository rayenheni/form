/* Types d'environnement Vite utilisés par le site et l'administration. */
interface ImportMetaEnv {
  /** URL du projet Supabase, ex. https://xxxx.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Clé publique (anon). Les écritures sont contrôlées par les politiques RLS. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /**
   * Chemin secret de l'administration (sans `#`), ex. `admin-fbl-7k2`.
   * L'admin n'est atteignable que sur `https://…/#/<ce-chemin>`.
   */
  readonly VITE_ADMIN_PATH?: string;
  /**
   * `1` : l'administration devient la vue par défaut (le site public se rejoint
   * avec `?site=1`). Réservé aux aperçus et démonstrations.
   */
  readonly VITE_PREVIEW_ADMIN?: string;
  /** Endpoint optionnel (webhook / backend de formulaires) pour les demandes de contact. */
  readonly VITE_LEADS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
