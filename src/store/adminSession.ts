import { browserKv, type KvAdapter } from "./localStore";
import { ADMIN_PATH, isSupabaseConfigured, requireSupabaseClient } from "./supabaseClient";
import type { SbAuthData } from "./supabaseStore";

export interface AdminUser {
  id: string;
  email: string;
}

export interface AdminSession {
  /** Mode réel : Supabase (`auth`) ou local (`local`). */
  readonly mode: "supabase" | "local";
  getSession(): Promise<AdminUser | null>;
  signIn(email: string, password: string): Promise<AdminUser>;
  signOut(): Promise<void>;
  /** Mode local : faut-il encore créer le mot de passe administrateur ? */
  isLocalSetup?(): boolean;
  /** Définit le mot de passe de l'admin locale (première installation). */
  setupLocal?(password: string): Promise<AdminUser>;
  changePassword?(currentPassword: string, newPassword: string): Promise<void>;
}

/* ───────────────────────── Hachage (mode local) ───────────────────────── */

const LOCAL_KEY = "fbl.admin.v1";
const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Sel + SHA-256 : suffisant pour un poste local, pas pour un vrai serveur. */
async function hashPassword(password: string, salt: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${salt}:${password}`));
    return toHex(digest);
  }
  // Repli sans WebCrypto (tests Node) : hachage non cryptographique, clairement identifié.
  let hash = 5381;
  const input = `${salt}:${password}`;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) | 0;
  }
  return `djb2-${(hash >>> 0).toString(16)}`;
}

interface LocalAdmin {
  id: string;
  email: string;
  salt: string;
  hash: string;
}

export const LOCAL_ADMIN_EMAIL = "admin@local";

function readLocalAdmin(kv: KvAdapter): LocalAdmin | null {
  try {
    const raw = kv.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as LocalAdmin) : null;
  } catch {
    return null;
  }
}

/** Session basée sur Supabase Auth (utilisateurs + RLS côté serveur). */
export function createSupabaseSession(): AdminSession {
  const client = requireSupabaseClient();

  const toUser = (data: SbAuthData | null): AdminUser | null => {
    const user = data?.session?.user;
    return user ? { id: user.id, email: user.email ?? user.id } : null;
  };

  const session: AdminSession = {
    mode: "supabase",

    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw new Error(`Session : ${error.message}`);
      return toUser(data ?? null);
    },

    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const user = toUser(data ?? null);
      if (!user) throw new Error("Connexion refusée.");
      return user;
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw new Error(error.message);
    },
  };

  return session;
}

/** Session locale (développement / démonstration sans backend). */
export function createLocalSession(kv: KvAdapter = browserKv()): AdminSession {
  const stateKey = "fbl.admin.session.v1";

  return {
    mode: "local",

    async getSession() {
      const admin = readLocalAdmin(kv);
      if (!admin) return null;
      return kv.getItem(stateKey) === admin.id ? { id: admin.id, email: admin.email } : null;
    },

    /** `true` tant qu'aucun mot de passe administrateur n'a été créé. */
    isLocalSetup() {
      return readLocalAdmin(kv) === null;
    },

    async setupLocal(password) {
      if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
      const salt = await hashPassword(String(Date.now()), Math.random().toString(16).slice(2));
      const admin: LocalAdmin = {
        id: `local-${salt.slice(0, 12)}`,
        email: LOCAL_ADMIN_EMAIL,
        salt,
        hash: await hashPassword(password, salt),
      };
      kv.setItem(LOCAL_KEY, JSON.stringify(admin));
      kv.setItem(stateKey, admin.id);
      return { id: admin.id, email: admin.email };
    },

    async signIn(email, password) {
      const admin = readLocalAdmin(kv);
      if (!admin) throw new Error("Aucun administrateur local configuré.");
      if (email.trim().toLowerCase() !== admin.email.toLowerCase()) throw new Error("Identifiants incorrects.");
      const hash = await hashPassword(password, admin.salt);
      if (hash !== admin.hash) throw new Error("Identifiants incorrects.");
      kv.setItem(stateKey, admin.id);
      return { id: admin.id, email: admin.email };
    },

    async changePassword(currentPassword, newPassword) {
      const admin = readLocalAdmin(kv);
      if (!admin) throw new Error("Aucun administrateur local configuré.");
      if ((await hashPassword(currentPassword, admin.salt)) !== admin.hash) {
        throw new Error("Mot de passe actuel incorrect.");
      }
      if (newPassword.length < 8) throw new Error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      const salt = await hashPassword(String(Date.now()), Math.random().toString(16).slice(2));
      kv.setItem(
        LOCAL_KEY,
        JSON.stringify({ ...admin, salt, hash: await hashPassword(newPassword, salt) } satisfies LocalAdmin)
      );
    },

    async signOut() {
      kv.removeItem(stateKey);
    },
  };
}

/** Session correspondant à la configuration courante. */
export function createAdminSession(): AdminSession {
  return isSupabaseConfigured() ? createSupabaseSession() : createLocalSession();
}

/** L'adresse `#/…` courante ouvre-t-elle l'administration ? */
export function isAdminPath(hash: string, adminPath: string = ADMIN_PATH): boolean {
  if (!adminPath) return false;
  const current = hash.replace(/^#\/?/, "").split("?")[0];
  return current === adminPath.replace(/^\/?/, "");
}

export interface RouteOptions {
  adminPath?: string;
  /** `true` : l'administration est la vue par défaut (aperçus, démonstrations). */
  adminIsDefault?: boolean;
}

/**
 * L'administration doit-elle s'afficher pour cette adresse ?
 *
 *  - `…/#/<chemin secret>` : forme canonique, le chemin reste secret ;
 *  - `…/?admin=1` : quand l'adresse est recopiée ou ouverte par un outil qui ne
 *    conserve pas le fragment ;
 *  - `VITE_PREVIEW_ADMIN=1` : l'administration devient la vue par défaut et le site
 *    public se rejoint avec `?site=1` — pratique pour les aperçus, où l'on ne peut
 *    pas choisir l'URL chargée.
 *
 * Sans `VITE_ADMIN_PATH`, les trois entrées restent fermées.
 */
export function isAdminRoute(
  location: { hash: string; search: string },
  options: RouteOptions = {}
): boolean {
  const adminPath = options.adminPath ?? ADMIN_PATH;
  if (!adminPath) return false;
  const query = new URLSearchParams(location.search);
  // Le chemin secret explicite dans le fragment l'emporte toujours (ex. lien
  // « Administration » du pied de page cliqué alors que l'URL porte ?site=1).
  if (isAdminPath(location.hash, adminPath)) return true;
  if (options.adminIsDefault) return query.get("site") !== "1";
  return query.get("admin") === "1";
}
