import { content as fallbackContent, type Lang } from "../constants/content";
import { cloneContent, nowIso, type ContentStore, type DraftRecord, type PublishedRecord, type Revision, type StoredContent } from "./types";

/** Adaptateur clé/valeur : `localStorage` dans le navigateur, objet mémoire en test. */
export interface KvAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const memoryKv = (): KvAdapter => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
};

export const browserKv = (): KvAdapter =>
  typeof window === "undefined" || !window.localStorage
    ? memoryKv()
    : {
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
        removeItem: (key) => window.localStorage.removeItem(key),
      };

interface LocalShape {
  published: Record<string, PublishedRecord>;
  drafts: Record<string, DraftRecord>;
  revisions: Record<string, Revision[]>;
  seq: number;
}

const KEY = "fbl.content.v1";
const MAX_REVISIONS = 20;

const empty = (): LocalShape => ({ published: {}, drafts: {}, revisions: {}, seq: 0 });

/**
 * Magasin local (navigateur). Permet de développer et de tester l'administration
 * sans backend ; les mêmes écrans basculent sur Supabase par simple configuration.
 */
export function createLocalStore(kv: KvAdapter = browserKv()): ContentStore {
  const read = (): LocalShape => {
    try {
      const raw = kv.getItem(KEY);
      return raw ? { ...empty(), ...(JSON.parse(raw) as LocalShape) } : empty();
    } catch {
      return empty();
    }
  };
  const write = (state: LocalShape) => kv.setItem(KEY, JSON.stringify(state));

  /** À défaut de contenu enregistré, on part du contenu intégré au build. */
  const seed = (lang: Lang): PublishedRecord => ({
    lang,
    data: cloneContent(fallbackContent[lang]),
    version: 1,
    updatedAt: nowIso(),
  });

  const publish = (lang: Lang, data: StoredContent, note: string, author: string): PublishedRecord => {
    const state = read();
    const version = (state.published[lang]?.version ?? 0) + 1;
    const updatedAt = nowIso();
    const record: PublishedRecord = { lang, data: cloneContent(data), version, updatedAt };
    state.published[lang] = record;
    state.seq += 1;
    const history = state.revisions[lang] ?? [];
    state.revisions[lang] = [
      { id: state.seq, lang, version, note, author, createdAt: updatedAt, data: cloneContent(data) },
      ...history,
    ].slice(0, MAX_REVISIONS);
    write(state);
    return record;
  };

  return {
    kind: "local",

    async readPublished(lang) {
      const state = read();
      if (!state.published[lang]) {
        const record = seed(lang);
        state.published[lang] = record;
        write(state);
      }
      return cloneContent(state.published[lang]);
    },

    async writePublished(lang, data, note, author) {
      return publish(lang, data, note, author);
    },

    async readDraft(lang) {
      const draft = read().drafts[lang];
      return draft ? cloneContent(draft) : null;
    },

    async writeDraft(lang, data) {
      const state = read();
      const record: DraftRecord = { lang, data: cloneContent(data), updatedAt: nowIso() };
      state.drafts[lang] = record;
      write(state);
      return cloneContent(record);
    },

    async discardDraft(lang) {
      const state = read();
      delete state.drafts[lang];
      write(state);
    },

    async listRevisions(lang) {
      return cloneContent(read().revisions[lang] ?? []);
    },

    async restoreRevision(lang, revisionId, author) {
      const revision = (read().revisions[lang] ?? []).find((item) => item.id === revisionId);
      if (!revision) throw new Error(`Révision ${revisionId} introuvable.`);
      return publish(lang, revision.data, `Restauration de la révision n°${revisionId}`, author);
    },
  };
}
