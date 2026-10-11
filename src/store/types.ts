import type { Lang, SiteContent } from "../constants/content";

/** Contenu sérialisable (JSON) tel qu'il est stocké en base. */
export type StoredContent = SiteContent;

export interface PublishedRecord {
  lang: Lang;
  data: StoredContent;
  version: number;
  updatedAt: string;
}

export interface DraftRecord {
  lang: Lang;
  data: StoredContent;
  updatedAt: string;
}

export interface Revision {
  id: number;
  lang: Lang;
  version: number;
  note: string;
  author: string;
  createdAt: string;
  data: StoredContent;
}

/**
 * Contrat de persistance du contenu.
 * Deux implémentations : Supabase (production) et locale (développement / démo).
 */
export interface ContentStore {
  readonly kind: "supabase" | "local";
  /** Contenus publiés (lus par le site public). */
  readPublished(lang: Lang): Promise<PublishedRecord | null>;
  writePublished(lang: Lang, data: StoredContent, note: string, author: string): Promise<PublishedRecord>;
  /** Brouillon de travail de l'administration. */
  readDraft(lang: Lang): Promise<DraftRecord | null>;
  writeDraft(lang: Lang, data: StoredContent): Promise<DraftRecord>;
  discardDraft(lang: Lang): Promise<void>;
  /** Historique, du plus récent au plus ancien. */
  listRevisions(lang: Lang): Promise<Revision[]>;
  restoreRevision(lang: Lang, revisionId: number, author: string): Promise<PublishedRecord>;
}

/** Clonage profond sûr (le contenu est 100 % JSON). */
export function cloneContent<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Fusionne un contenu distant dans le contenu de référence.
 *
 * Les textes absents ou vides côté distant retombent sur la valeur intégrée :
 * une ligne mal remplie en base ne peut pas vider le site. Les tableaux
 * distants sont repris tels quels (c'est l'admin qui les gère).
 */
export function mergeContent(base: SiteContent, override: unknown): SiteContent {
  if (!isPlainObject(override)) return cloneContent(base);

  const walk = (b: unknown, o: unknown): unknown => {
    if (isPlainObject(b) && isPlainObject(o)) {
      const out: Record<string, unknown> = { ...(b as Record<string, unknown>) };
      for (const [key, value] of Object.entries(o)) {
        out[key] = key in out ? walk(out[key], value) : value;
      }
      return out;
    }
    if (Array.isArray(o)) return cloneContent(o);
    if (typeof o === "string") return o.trim() === "" ? b : o;
    if (o === null || o === undefined) return b;
    return o;
  };

  return walk(base, override) as SiteContent;
}

/** Le contenu a-t-il été modifié ? (comparaison JSON) */
export function hasChanges(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
