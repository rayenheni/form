import { useEffect, useRef } from "react";
import type { Lang } from "../constants/content";
import { parseSource } from "../lib/analytics";
import { getAnalyticsStore } from "../store/analytics";

/* ══════════════════════════════════════════════════════════════
 *  Collecte des visites sur le site public
 *
 *  Un visiteur = un identifiant stable stocké dans le navigateur.
 *  Aucune donnée personnelle n'est collectée : ni cookie tiers, ni
 *  empreinte, ni adresse IP côté client.
 * ══════════════════════════════════════════════════════════════ */

const VISITOR_KEY = "fbl.visitor.v1";
/** Une même session ne compte qu'une visite par page (évite les doublons de HMR/rechargement). */
const LAST_TRACKED_KEY = "fbl.lastTrack.v1";
const DEDUPE_MS = 30_000;

function visitorId(): string {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    /* Navigation privée bloquant localStorage : visite comptée sans identifiant stable. */
    return "";
  }
}

/** Visite déjà comptée il y a moins de `DEDUPE_MS` ? */
function isDuplicate(path: string): boolean {
  try {
    const raw = window.localStorage.getItem(LAST_TRACKED_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { path?: string; at?: number };
    return parsed.path === path && typeof parsed.at === "number" && Date.now() - parsed.at < DEDUPE_MS;
  } catch {
    return false;
  }
}

function markTracked(path: string): void {
  try {
    window.localStorage.setItem(LAST_TRACKED_KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    /* sans objet */
  }
}

/** Chemin affiché dans le tableau de bord : chemin + section ancrée. */
export function currentPath(location: Pick<Location, "pathname" | "search" | "hash">): string {
  const hash = location.hash.replace(/^#\/?/, "");
  if (hash) return `#${hash}`;
  return `${location.pathname}${location.search}` || "/";
}

/**
 * Enregistre une visite, puis à chaque changement d'ancre (le site est une
 * seule page : la navigation se fait par sections).
 *
 * L'échec d'enregistrement est toujours silencieux : le site public ne doit
 * jamais pâtir de l'analytique.
 */
export function usePageviewTracking(lang: Lang): void {
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    const track = () => {
      try {
        const path = currentPath(window.location);
        if (tracked.current === path || isDuplicate(path)) return;
        tracked.current = path;
        markTracked(path);

        const search = window.location.search;
        const referrer = window.document.referrer ?? "";
        void getAnalyticsStore()
          .recordPageview({
            path,
            referrer,
            source: parseSource(referrer, search),
            lang,
            visitorId: visitorId(),
          })
          .catch(() => undefined);
      } catch {
        /* l'analytique ne casse jamais le site */
      }
    };

    track();
    window.addEventListener("hashchange", track);
    return () => window.removeEventListener("hashchange", track);
  }, [lang]);
}
