import { content as fallbackContent, type Lang, type SiteContent } from "../constants/content";
import { toIconName } from "../constants/icons";
import { isSupabaseConfigured, requireSupabaseClient } from "./supabaseClient";
import { createSupabaseStore } from "./supabaseStore";
import { browserKv, createLocalStore } from "./localStore";
import { cloneContent, mergeContent, type ContentStore, type StoredContent } from "./types";

export * from "./types";
export { createLocalStore, memoryKv, browserKv } from "./localStore";
export { createSupabaseStore } from "./supabaseStore";
export { ADMIN_PATH, ADMIN_IS_DEFAULT, isSupabaseConfigured } from "./supabaseClient";
export {
  createAdminSession,
  createLocalSession,
  createSupabaseSession,
  isAdminPath,
  isAdminRoute,
  LOCAL_ADMIN_EMAIL,
} from "./adminSession";

let store: ContentStore | null = null;

/** Magasin courant : Supabase si configuré, sinon stockage local du navigateur. */
export function getContentStore(): ContentStore {
  if (!store) {
    store = isSupabaseConfigured()
      ? createSupabaseStore({ client: requireSupabaseClient() })
      : createLocalStore(browserKv());
  }
  return store;
}

/** Remplace les noms d'icônes inconnus par l'icône par défaut (données venues de la base). */
export function coerceIcons(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(coerceIcons);
    return;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    for (const [key, item] of Object.entries(record)) {
      if (key === "icon" && typeof item === "string") record[key] = toIconName(item);
      else coerceIcons(item);
    }
  }
}

/**
 * Contenu affiché par le site : base intégrée au build, enrichie du contenu
 * publié en base. Toute erreur réseau retombe silencieusement sur la base,
 * le site public ne peut donc jamais rester vide.
 */
export async function resolveContent(lang: Lang): Promise<SiteContent> {
  const base = fallbackContent[lang];
  try {
    const published = await getContentStore().readPublished(lang);
    if (!published) return cloneContent(base);
    return mergeContent(base, published.data);
  } catch {
    return cloneContent(base);
  }
}

/** Contenu de travail de l'administration : brouillon, sinon publié, sinon intégré. */
export async function loadEditableContent(lang: Lang): Promise<StoredContent> {
  const currentStore = getContentStore();
  const draft = await currentStore.readDraft(lang);
  if (draft) {
    const data = cloneContent(draft.data);
    coerceIcons(data);
    return data;
  }
  const published = await currentStore.readPublished(lang);
  const data = cloneContent(published?.data ?? fallbackContent[lang]);
  coerceIcons(data);
  return data;
}
