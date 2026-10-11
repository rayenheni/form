import type { Lang } from "../constants/content";

/* ══════════════════════════════════════════════════════════════
 *  Analytique — modèle de données et calculs
 *
 *  Toutes les fonctions de ce module sont pures : aucune lecture du
 *  navigateur ni du réseau. Elles sont donc testables directement.
 *  La persistance vit dans `src/store/analytics.ts`, l'affichage dans
 *  `src/admin/Dashboard.tsx`.
 * ══════════════════════════════════════════════════════════════ */

export type ReservationStatus = "new" | "contacted" | "booked" | "archived";

export const RESERVATION_STATUSES: readonly ReservationStatus[] = ["new", "contacted", "booked", "archived"];

export const RESERVATION_LABELS: Record<ReservationStatus, string> = {
  new: "Nouvelle",
  contacted: "Contactée",
  booked: "Réservée",
  archived: "Archivée",
};

/** Visite de page enregistrée depuis le site public. */
export interface Pageview {
  id: string;
  path: string;
  referrer: string;
  source: string;
  lang: Lang;
  visitorId: string;
  createdAt: string;
}

/** Demande reçue via le formulaire de contact. */
export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  source: string;
  lang: Lang;
  status: ReservationStatus;
  createdAt: string;
}

/** Nouvelle visite, sans les champs générés par le magasin. */
export type PageviewInput = Omit<Pageview, "id" | "createdAt">;

/** Nouvelle demande, sans les champs générés par le magasin. */
export type ReservationInput = Omit<Reservation, "id" | "createdAt" | "status">;

/* ───────────────────────── Sources de trafic ───────────────────────── */

const SOURCE_PATTERNS: readonly { test: RegExp; label: string }[] = [
  { test: /(^|\.)google\./i, label: "Google" },
  { test: /(^|\.)(facebook|fb|messenger)\./i, label: "Facebook" },
  { test: /(^|\.)linkedin\.|lnkd\.in/i, label: "LinkedIn" },
  { test: /instagram\.com/i, label: "Instagram" },
  { test: /whatsapp\.|wa\.me/i, label: "WhatsApp" },
  { test: /(^|\.)x\.com|twitter\.com/i, label: "X (Twitter)" },
  { test: /tiktok\.com/i, label: "TikTok" },
  { test: /youtu(be\.com|\.be)/i, label: "YouTube" },
  { test: /bing\./i, label: "Bing" },
  { test: /t\.me|telegram\./i, label: "Telegram" },
];

export const DIRECT_SOURCE = "Direct";

const capitalize = (value: string): string =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/**
 * Hôte d'une URL, ou `""` si l'URL est absente ou invalide.
 *
 * Le schéma est ajouté lorsqu'il manque (`www.x.tn` → `https://www.x.tn`) :
 * sans base de repli, une URL poubelle lève au lieu d'inventer un hôte.
 */
export function hostOf(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(absolute).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Étiquette de la source de trafic.
 *
 * Priorité : `utm_source` (campagne déclarée) → domaine référant reconnu →
 * domaine référant brut → « Direct » (aucun référant).
 */
export function parseSource(referrer = "", search = ""): string {
  const utm = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("utm_source");
  if (utm && utm.trim()) return capitalize(utm.trim());

  const host = hostOf(referrer);
  if (!host) return DIRECT_SOURCE;

  const known = SOURCE_PATTERNS.find(({ test }) => test.test(host));
  if (known) return known.label;

  return host.replace(/^www\./, "");
}

/* ───────────────────────── Fenêtres de temps ───────────────────────── */

const DAY_MS = 86_400_000;

/** Clé de jour (`AAAA-MM-JJ`) en UTC, déterministe pour les tests. */
export function dayKey(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function startOfDayUtc(value: Date): Date {
  const copy = new Date(value.getTime());
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS);
}

function formatLabel(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/* ───────────────────────── Agrégation ───────────────────────── */

export interface Bucket {
  label: string;
  count: number;
}

export interface SeriesPoint {
  date: string;
  label: string;
  visits: number;
  reservations: number;
}

export interface AnalyticsSummary {
  range: { days: number; from: string; to: string };
  visits: number;
  uniqueVisitors: number;
  reservations: number;
  /** Réservations ÷ visiteurs uniques, en pourcentage. */
  conversionRate: number;
  previousVisits: number;
  /** Variation des visites par rapport à la période précédente, en pourcentage. */
  visitsDelta: number;
  bySource: Bucket[];
  byPage: Bucket[];
  byLang: Bucket[];
  series: SeriesPoint[];
  peak: { date: string; visits: number } | null;
  reservationsByStatus: Bucket[];
}

function tally(values: readonly string[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value || DIRECT_SOURCE;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function inRange(iso: string, from: number, to: number): boolean {
  const time = new Date(iso).getTime();
  return !Number.isNaN(time) && time >= from && time < to;
}

function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/**
 * Synthèse des statistiques sur une fenêtre glissante.
 *
 * La période précédente (même durée, immédiatement avant) est calculée pour
 * afficher la variation des visites.
 */
export function summarize(
  pageviews: readonly Pageview[],
  reservations: readonly Reservation[],
  days = 30,
  now: Date = new Date()
): AnalyticsSummary {
  const span = Math.max(1, Math.floor(days));
  const today = startOfDayUtc(now);
  const from = addDays(today, -(span - 1));
  const to = addDays(today, 1);
  const previousFrom = addDays(from, -span);

  const fromTime = from.getTime();
  const toTime = to.getTime();
  const previousFromTime = previousFrom.getTime();

  const current = pageviews.filter((view) => inRange(view.createdAt, fromTime, toTime));
  const previous = pageviews.filter((view) => inRange(view.createdAt, previousFromTime, fromTime));
  const currentReservations = reservations.filter((item) => inRange(item.createdAt, fromTime, toTime));

  const uniqueVisitors = new Set(current.map((view) => view.visitorId).filter(Boolean)).size;

  /* Série continue : un point par jour, zéros compris. */
  const visitsPerDay = new Map<string, number>();
  const reservationsPerDay = new Map<string, number>();
  for (const view of current) {
    const key = dayKey(view.createdAt);
    if (key) visitsPerDay.set(key, (visitsPerDay.get(key) ?? 0) + 1);
  }
  for (const item of currentReservations) {
    const key = dayKey(item.createdAt);
    if (key) reservationsPerDay.set(key, (reservationsPerDay.get(key) ?? 0) + 1);
  }

  const series: SeriesPoint[] = [];
  let peak: AnalyticsSummary["peak"] = null;
  for (let index = 0; index < span; index += 1) {
    const day = addDays(from, index);
    const date = day.toISOString().slice(0, 10);
    const visits = visitsPerDay.get(date) ?? 0;
    series.push({ date, label: formatLabel(day.toISOString()), visits, reservations: reservationsPerDay.get(date) ?? 0 });
    if (!peak || visits > peak.visits) peak = { date, visits };
  }
  if (peak && peak.visits === 0) peak = null;

  const previousVisits = previous.length;
  const visitsDelta = previousVisits === 0 ? (current.length > 0 ? 100 : 0) : rate(current.length - previousVisits, previousVisits);

  return {
    range: { days: span, from: from.toISOString(), to: now.toISOString() },
    visits: current.length,
    uniqueVisitors,
    reservations: currentReservations.length,
    conversionRate: rate(currentReservations.length, uniqueVisitors),
    previousVisits,
    visitsDelta,
    bySource: tally(current.map((view) => view.source)),
    byPage: tally(current.map((view) => view.path)),
    byLang: tally(current.map((view) => view.lang === "ar" ? "العربية" : "Français")),
    series,
    peak,
    reservationsByStatus: tally(currentReservations.map((item) => RESERVATION_LABELS[item.status] ?? item.status)),
  };
}

/* ───────────────────────── Formatage ───────────────────────── */

/** Nombre groupé à la française : 1 234. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.max(0, Math.round(value)));
}

/** Pourcentage à une décimale : 12,5 %. */
export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)} %`;
}

/** Variation signée : +12,5 % / −3 %. */
export function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatPercent(Math.abs(value))}`;
}

export function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

/* ───────────────────────── Export CSV ───────────────────────── */

const CSV_COLUMNS: readonly { key: keyof Reservation; header: string }[] = [
  { key: "createdAt", header: "Date" },
  { key: "name", header: "Nom" },
  { key: "email", header: "E-mail" },
  { key: "phone", header: "Téléphone" },
  { key: "interest", header: "Sujet" },
  { key: "message", header: "Message" },
  { key: "source", header: "Source" },
  { key: "lang", header: "Langue" },
  { key: "status", header: "Statut" },
];

const escapeCell = (value: string): string => `"${String(value ?? "").replace(/"/g, '""')}"`;

/**
 * Export CSV des demandes.
 *
 * Préfixé d'un BOM UTF-8 pour qu'Excel affiche correctement les accents et
 * l'arabe. Les sauts de ligne des messages sont aplatis.
 */
export function reservationsToCsv(reservations: readonly Reservation[]): string {
  const header = CSV_COLUMNS.map(({ header: title }) => escapeCell(title)).join(";");
  const rows = reservations.map((item) =>
    CSV_COLUMNS.map(({ key }) => {
      const raw = item[key];
      const value = key === "status" ? (RESERVATION_LABELS[item.status] ?? item.status) : String(raw ?? "");
      return escapeCell(value.replace(/\r?\n/g, " "));
    }).join(";")
  );
  return `\uFEFF${[header, ...rows].join("\r\n")}\r\n`;
}
