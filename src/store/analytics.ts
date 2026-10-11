import type { Lang } from "../constants/content";
import { isSupabaseConfigured, requireSupabaseClient } from "./supabaseClient";
import type { SbClient } from "./supabaseStore";
import { browserKv, type KvAdapter } from "./localStore";
import { nowIso } from "./types";
import type {
  Pageview,
  PageviewInput,
  Reservation,
  ReservationInput,
  ReservationStatus,
} from "../lib/analytics";

/* ══════════════════════════════════════════════════════════════
 *  Persistance de l'analytique
 *
 *  Deux implémentations, comme pour le contenu :
 *    - locale (navigateur) : développement et démonstration ;
 *    - Supabase : production, données partagées entre tous les visiteurs.
 * ══════════════════════════════════════════════════════════════ */

export interface AnalyticsStore {
  readonly kind: "supabase" | "local";
  recordPageview(input: PageviewInput): Promise<void>;
  recordReservation(input: ReservationInput): Promise<Reservation | null>;
  listPageviews(sinceIso: string): Promise<Pageview[]>;
  listReservations(sinceIso: string): Promise<Reservation[]>;
  setReservationStatus(id: string, status: ReservationStatus): Promise<void>;
}

export const ANALYTICS_TABLES = {
  pageviews: "site_pageviews",
  reservations: "site_reservations",
} as const;

/** Nombre maximal de visites conservées en mode local (le navigateur n'est pas une base). */
const LOCAL_MAX_PAGEVIEWS = 5_000;

function newId(): string {
  const crypto = globalThis.crypto;
  if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ─────────────────────── Implémentation locale ─────────────────────── */

interface LocalAnalyticsShape {
  pageviews: Pageview[];
  reservations: Reservation[];
}

const ANALYTICS_KEY = "fbl.analytics.v1";

const emptyAnalytics = (): LocalAnalyticsShape => ({ pageviews: [], reservations: [] });

export function createLocalAnalyticsStore(kv: KvAdapter = browserKv()): AnalyticsStore {
  const read = (): LocalAnalyticsShape => {
    try {
      const raw = kv.getItem(ANALYTICS_KEY);
      return raw ? { ...emptyAnalytics(), ...(JSON.parse(raw) as LocalAnalyticsShape) } : emptyAnalytics();
    } catch {
      return emptyAnalytics();
    }
  };
  const write = (state: LocalAnalyticsShape) => kv.setItem(ANALYTICS_KEY, JSON.stringify(state));

  return {
    kind: "local",

    async recordPageview(input) {
      const state = read();
      const record: Pageview = { ...input, id: newId(), createdAt: nowIso() };
      /* Les plus anciennes sortent en premier : la clé ne grossit pas sans limite. */
      state.pageviews = [...state.pageviews, record].slice(-LOCAL_MAX_PAGEVIEWS);
      write(state);
    },

    async recordReservation(input) {
      const state = read();
      const record: Reservation = { ...input, id: newId(), status: "new", createdAt: nowIso() };
      state.reservations = [...state.reservations, record];
      write(state);
      return record;
    },

    async listPageviews(sinceIso) {
      const from = new Date(sinceIso).getTime();
      return read().pageviews.filter((view) => new Date(view.createdAt).getTime() >= from);
    },

    async listReservations(sinceIso) {
      const from = new Date(sinceIso).getTime();
      /* `reverse` d'abord : à horodatage identique, la demande la plus récente
         (la dernière insérée) doit passer en tête. `sort` étant stable, l'ordre
         ainsi établi est conservé pour les égalités. */
      return [...read().reservations]
        .reverse()
        .filter((item) => new Date(item.createdAt).getTime() >= from)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async setReservationStatus(id, status) {
      const state = read();
      const target = state.reservations.find((item) => item.id === id);
      if (!target) return;
      target.status = status;
      write(state);
    },
  };
}

/* ─────────────────────── Implémentation Supabase ─────────────────────── */

export interface SupabaseAnalyticsOptions {
  /** Client injecté (tests). À défaut, le client partagé de l'application. */
  client?: SbClient;
  /** Préfixe optionnel des tables (isoler un environnement de test). */
  prefix?: string;
}

export function createSupabaseAnalyticsStore(options: SupabaseAnalyticsOptions = {}): AnalyticsStore {
  const client = options.client ?? requireSupabaseClient();
  const prefix = options.prefix ?? "";
  const table = (name: string) => `${prefix}${name}`;

  const unwrap = <T,>(response: { data: T; error: { message: string } | null }, context: string): T => {
    if (response.error) throw new Error(`${context} : ${response.error.message}`);
    return response.data;
  };

  const toPageview = (row: Record<string, unknown>): Pageview => ({
    id: String(row.id ?? ""),
    path: String(row.path ?? "/"),
    referrer: String(row.referrer ?? ""),
    source: String(row.source ?? "Direct"),
    lang: (row.lang === "ar" ? "ar" : "fr") as Lang,
    visitorId: String(row.visitor_id ?? ""),
    createdAt: String(row.created_at ?? nowIso()),
  });

  const toReservation = (row: Record<string, unknown>): Reservation => ({
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    interest: String(row.interest ?? ""),
    message: String(row.message ?? ""),
    source: String(row.source ?? "Direct"),
    lang: (row.lang === "ar" ? "ar" : "fr") as Lang,
    status: (row.status as ReservationStatus) ?? "new",
    createdAt: String(row.created_at ?? nowIso()),
  });

  return {
    kind: "supabase",

    async recordPageview(input) {
      await unwrap(
        await client.from(table(ANALYTICS_TABLES.pageviews)).insert({
          path: input.path,
          referrer: input.referrer,
          source: input.source,
          lang: input.lang,
          visitor_id: input.visitorId,
          created_at: nowIso(),
        }),
        "enregistrement de la visite"
      );
    },

    async recordReservation(input) {
      const createdAt = nowIso();
      /* L'identifiant est fourni par le client : `insert` ne renvoie pas la ligne,
         donc sans cela l'appelant tiendrait un id qui n'existe pas en base. */
      const id = newId();
      await unwrap(
        await client.from(table(ANALYTICS_TABLES.reservations)).insert({
          id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          interest: input.interest,
          message: input.message,
          source: input.source,
          lang: input.lang,
          status: "new",
          created_at: createdAt,
        }),
        "enregistrement de la demande"
      );
      return { ...input, id, status: "new" as const, createdAt };
    },

    async listPageviews(sinceIso) {
      const rows = (await unwrap(
        await client
          .from(table(ANALYTICS_TABLES.pageviews))
          .select("id, path, referrer, source, lang, visitor_id, created_at")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: true }),
        "lecture des visites"
      )) as Record<string, unknown>[];
      return rows.map(toPageview);
    },

    async listReservations(sinceIso) {
      const rows = (await unwrap(
        await client
          .from(table(ANALYTICS_TABLES.reservations))
          .select("id, name, email, phone, interest, message, source, lang, status, created_at")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false }),
        "lecture des demandes"
      )) as Record<string, unknown>[];
      return rows.map(toReservation);
    },

    async setReservationStatus(id, status) {
      await unwrap(
        await client.from(table(ANALYTICS_TABLES.reservations)).update({ status }).eq("id", id),
        "mise à jour du statut"
      );
    },
  };
}

/* ─────────────────────── Point d'entrée unique ─────────────────────── */

let analyticsStore: AnalyticsStore | null = null;

/** Magasin analytique courant : Supabase si configuré, sinon navigateur. */
export function getAnalyticsStore(): AnalyticsStore {
  if (!analyticsStore) {
    analyticsStore = isSupabaseConfigured() ? createSupabaseAnalyticsStore() : createLocalAnalyticsStore();
  }
  return analyticsStore;
}

/** Remplace le magasin (tests). */
export function setAnalyticsStore(next: AnalyticsStore | null): void {
  analyticsStore = next;
}
