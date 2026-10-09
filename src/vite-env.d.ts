/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL qui reçoit les demandes du formulaire (POST JSON). Facultatif. */
  readonly VITE_LEADS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
