import type { Lang } from "../constants/content";
import { cloneContent, nowIso, type ContentStore, type PublishedRecord, type StoredContent } from "./types";

/* ──────────────────────────────────────────────────────────────
 * Client minimal attendu (compatible @supabase/supabase-js).
 * Déclaré ici pour que la logique soit testable sans réseau.
 * ────────────────────────────────────────────────────────────── */
export interface SbResponse<T> {
  data: T;
  error: { message: string; code?: string } | null;
}

export interface SbFilterBuilder<T> {
  eq(column: string, value: unknown): SbFilterBuilder<T>;
  /** Filtre « supérieur ou égal » (fenêtres de dates de l'analytique). */
  gte(column: string, value: unknown): SbFilterBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): SbFilterBuilder<T>;
  select(columns?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): SbFilterBuilder<{ rows: unknown[]; count: number }>;
  then<R1 = SbResponse<T>, R2 = never>(
    onFulfilled?: (value: SbResponse<T>) => R1 | PromiseLike<R1>,
    onRejected?: (reason: unknown) => R2 | PromiseLike<R2>
  ): Promise<R1 | R2>;
}

export interface SbQueryBuilder<T> {
  select(columns?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): SbFilterBuilder<T>;
  insert(values: unknown): SbFilterBuilder<T>;
  upsert(values: unknown, options?: { onConflict?: string }): SbFilterBuilder<T>;
  update(values: unknown): SbFilterBuilder<T>;
  delete(options?: { count?: "exact" }): SbFilterBuilder<T>;
}

export interface SbAuthUser {
  id: string;
  email?: string | null;
}

export interface SbAuthData {
  session: { user: SbAuthUser | null } | null;
}

export interface SbClient {
  from(table: string): SbQueryBuilder<unknown>;
  auth: {
    getSession(): Promise<SbResponse<SbAuthData | null>>;
    signInWithPassword(credentials: { email: string; password: string }): Promise<SbResponse<SbAuthData | null>>;
    signOut(): Promise<SbResponse<null>>;
  };
}

export const TABLES = {
  published: "published_content",
  drafts: "content_drafts",
  revisions: "content_revisions",
} as const;

function unwrap<T>(response: SbResponse<T>, context: string): T {
  if (response.error) throw new Error(`${context} : ${response.error.message}`);
  return response.data;
}

export interface SupabaseStoreOptions {
  client: SbClient;
  /** Préfixe optionnel des tables (utile pour isoler un environnement de test). */
  prefix?: string;
}

/** Magasin de contenu adossé à Supabase (Postgres + RLS). */
export function createSupabaseStore(options: SupabaseStoreOptions): ContentStore {
  const { client } = options;
  const prefix = options.prefix ?? "";
  const table = (name: string) => `${prefix}${name}`;

  const asRow = <T,>(data: unknown): T | null => {
    if (Array.isArray(data)) return (data[0] as T) ?? null;
    return (data as T) ?? null;
  };

  const toPublished = (row: Record<string, unknown> | null): PublishedRecord | null =>
    row
      ? {
          lang: row.lang as Lang,
          data: row.data as StoredContent,
          version: Number(row.version ?? 1),
          updatedAt: String(row.updated_at ?? nowIso()),
        }
      : null;

  const nextVersion = async (lang: Lang): Promise<number> => {
    const row = asRow<Record<string, unknown>>(
      await unwrap(
        await client.from(table(TABLES.published)).select("version").eq("lang", lang).order("version", { ascending: false }),
        "lecture de la version"
      )
    );
    return Number(row?.version ?? 0) + 1;
  };

  const publish = async (lang: Lang, data: StoredContent, note: string, author: string): Promise<PublishedRecord> => {
    const version = await nextVersion(lang);
    const updatedAt = nowIso();
    await unwrap(
      await client
        .from(table(TABLES.published))
        .upsert({ lang, data, version, updated_at: updatedAt }, { onConflict: "lang" }),
      "publication"
    );
    await unwrap(
      await client
        .from(table(TABLES.revisions))
        .insert({ lang, version, note, author, created_at: updatedAt, data: cloneContent(data) }),
      "enregistrement de l'historique"
    );
    return { lang, data: cloneContent(data), version, updatedAt };
  };

  return {
    kind: "supabase",

    async readPublished(lang) {
      const row = asRow<Record<string, unknown>>(
        await unwrap(await client.from(table(TABLES.published)).select("*").eq("lang", lang), "lecture du contenu publié")
      );
      return toPublished(row);
    },

    async writePublished(lang, data, note, author) {
      return publish(lang, data, note, author);
    },

    async readDraft(lang) {
      const row = asRow<Record<string, unknown>>(
        await unwrap(await client.from(table(TABLES.drafts)).select("*").eq("lang", lang), "lecture du brouillon")
      );
      return row
        ? { lang, data: row.data as StoredContent, updatedAt: String(row.updated_at ?? nowIso()) }
        : null;
    },

    async writeDraft(lang, data) {
      const updatedAt = nowIso();
      await unwrap(
        await client.from(table(TABLES.drafts)).upsert({ lang, data, updated_at: updatedAt }, { onConflict: "lang" }),
        "enregistrement du brouillon"
      );
      return { lang, data: cloneContent(data), updatedAt };
    },

    async discardDraft(lang) {
      await unwrap(await client.from(table(TABLES.drafts)).delete().eq("lang", lang), "suppression du brouillon");
    },

    async listRevisions(lang) {
      const rows = (await unwrap(
        await client
          .from(table(TABLES.revisions))
          .select("id, lang, version, note, author, created_at, data")
          .eq("lang", lang)
          .order("version", { ascending: false }),
        "lecture de l'historique"
      )) as Record<string, unknown>[];
      return rows.map((row) => ({
        id: Number(row.id),
        lang: row.lang as Lang,
        version: Number(row.version),
        note: String(row.note ?? ""),
        author: String(row.author ?? ""),
        createdAt: String(row.created_at ?? ""),
        data: row.data as StoredContent,
      }));
    },

    async restoreRevision(lang, revisionId, author) {
      const rows = (await unwrap(
        await client
          .from(table(TABLES.revisions))
          .select("id, data")
          .eq("lang", lang)
          .order("version", { ascending: false }),
        "lecture de la révision"
      )) as { id: number; data: StoredContent }[];
      const revision = rows.find((row) => Number(row.id) === revisionId);
      if (!revision) throw new Error(`Révision ${revisionId} introuvable.`);
      return publish(lang, revision.data, `Restauration de la révision n°${revisionId}`, author);
    },
  };
}
