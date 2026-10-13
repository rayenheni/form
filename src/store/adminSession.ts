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
  /** Millisecondes avant de pouvoir réessayer après trop d'échecs (0 = déverrouillé). */
  lockoutRemainingMs?(): number;
}

/* ───────────────────────── Hachage (mode local) ───────────────────────── */

const LOCAL_KEY = "fbl.admin.v1";
const encoder = new TextEncoder();

/** Algorithmes de hachage, du plus récent au plus ancien (migration transparente). */
type HashAlgo = "pbkdf2" | "sha256" | "djb2";

/** PBKDF2-HMAC-SHA256 : recommandation OWASP (2023) pour les mots de passe. */
const PBKDF2_ITERATIONS = 210_000;

function hasWebCrypto(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

/** Le meilleur algorithme disponible dans cet environnement. */
function bestHashAlgo(): HashAlgo {
  return hasWebCrypto() ? "pbkdf2" : "djb2";
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Sel aléatoire de 16 octets (WebCrypto, repli déterministe pour les tests Node). */
function randomSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return toHex(bytes);
}

async function hashPassword(password: string, salt: string, algo: HashAlgo = bestHashAlgo()): Promise<string> {
  if (hasWebCrypto()) {
    if (algo === "pbkdf2") {
      const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: PBKDF2_ITERATIONS },
        key,
        256
      );
      return toHex(bits);
    }
    if (algo === "sha256") {
      const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${salt}:${password}`));
      return toHex(digest);
    }
  }
  // Repli sans WebCrypto : hachage non cryptographique, clairement identifié.
  let hash = 5381;
  const input = `${salt}:${password}`;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) | 0;
  }
  return `djb2-${(hash >>> 0).toString(16)}`;
}

/** Mots de passe triviaux refusés à la création, même s'ils atteignent 8 caractères. */
const WEAK_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "motdepasse",
  "motdepasse1",
  "azerty123",
  "qwerty123",
  "admin1234",
  "iloveyou",
  "00000000",
]);

export const PASSWORD_MAX_LENGTH = 128;

/** Politique de mot de passe : longueur minimale, maximale, et pas de mot de passe trivial. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`;
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return "Ce mot de passe est trop courant, choisissez-en un plus personnel.";
  }
  return null;
}

interface LocalAdmin {
  id: string;
  email: string;
  salt: string;
  hash: string;
  /** Algorithme du hachage stocké ; absent = ancien format SHA-256 simple. */
  algo?: HashAlgo;
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

/* ────────────── Verrouillage après échecs répétés (mode local) ────────────── */

interface LockState {
  failures: number;
  /** Horizon (epoch ms) jusqu'auquel toute tentative est refusée. */
  until?: number;
}

const LOCK_KEY = "fbl.admin.lockout.v1";
const MAX_FAILURES = 5;
/** 5 essais gratuits, puis 30 s, 1 min, 2 min, 4 min… (doublement à chaque échec). */
const LOCK_STEP_MS = 30_000;

function readLock(kv: KvAdapter): LockState {
  try {
    const raw = kv.getItem(LOCK_KEY);
    return raw ? (JSON.parse(raw) as LockState) : { failures: 0 };
  } catch {
    return { failures: 0 };
  }
}

/** Millisecondes restantes avant de pouvoir réessayer (0 = déverrouillé). */
function lockRemainingMs(kv: KvAdapter): number {
  const { until } = readLock(kv);
  return until && until > Date.now() ? until - Date.now() : 0;
}

function formatDelay(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  if (minutes >= 1) return `${minutes} min`;
  return `${Math.ceil(ms / 1000)} s`;
}

/** Enregistre un échec et renvoie la durée de verrouillage obtenue (0 si aucune). */
function registerFailure(kv: KvAdapter): number {
  const lock = readLock(kv);
  lock.failures += 1;
  if (lock.failures >= MAX_FAILURES) {
    const step = Math.min(lock.failures - MAX_FAILURES, 6);
    lock.until = Date.now() + LOCK_STEP_MS * 2 ** step;
  }
  kv.setItem(LOCK_KEY, JSON.stringify(lock));
  return lock.until && lock.until > Date.now() ? lock.until - Date.now() : 0;
}

function clearFailures(kv: KvAdapter): void {
  kv.removeItem(LOCK_KEY);
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
  /** Durée maximale d'une session locale ouverte, renouvelée à chaque visite. */
  const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

  const readSessionState = (admin: LocalAdmin): { id: string; at: number } | null => {
    const raw = kv.getItem(stateKey);
    if (!raw) return null;
    let state: { id: string; at: number } | null = null;
    try {
      const parsed = JSON.parse(raw) as { id?: unknown; at?: unknown };
      if (parsed && typeof parsed.id === "string") {
        state = { id: parsed.id, at: typeof parsed.at === "number" ? parsed.at : Date.now() };
      }
    } catch {
      // Ancien format (identifiant nu) : considéré tout juste ouvert, rescellé ensuite.
      state = { id: raw, at: Date.now() };
    }
    return state && state.id === admin.id ? state : null;
  };

  const openSession = (admin: LocalAdmin) => kv.setItem(stateKey, JSON.stringify({ id: admin.id, at: Date.now() }));

  return {
    mode: "local",

    async getSession() {
      const admin = readLocalAdmin(kv);
      if (!admin) return null;
      const state = readSessionState(admin);
      if (!state) return null;
      if (Date.now() - state.at > SESSION_TTL_MS) {
        kv.removeItem(stateKey);
        return null;
      }
      // Session glissante : chaque consultation repousse l'expiration.
      openSession(admin);
      return { id: admin.id, email: admin.email };
    },

    /** `true` tant qu'aucun mot de passe administrateur n'a été créé. */
    isLocalSetup() {
      return readLocalAdmin(kv) === null;
    },

    async setupLocal(password) {
      const policy = validatePassword(password);
      if (policy) throw new Error(policy);
      const salt = randomSalt();
      const admin: LocalAdmin = {
        id: `local-${salt.slice(0, 12)}`,
        email: LOCAL_ADMIN_EMAIL,
        salt,
        algo: bestHashAlgo(),
        hash: await hashPassword(password, salt),
      };
      kv.setItem(LOCAL_KEY, JSON.stringify(admin));
      openSession(admin);
      return { id: admin.id, email: admin.email };
    },

    async signIn(email, password) {
      const remaining = lockRemainingMs(kv);
      if (remaining > 0) {
        throw new Error(`Trop d'essais. Réessayez dans ${formatDelay(remaining)}.`);
      }
      const admin = readLocalAdmin(kv);
      if (!admin) throw new Error("Aucun administrateur local configuré.");
      const storedAlgo: HashAlgo = admin.algo ?? "sha256";
      const storedHash = admin.hash;
      const hash = await hashPassword(password, admin.salt, storedAlgo);
      if (hash !== storedHash || email.trim().toLowerCase() !== admin.email.toLowerCase()) {
        const lockedFor = registerFailure(kv);
        if (lockedFor > 0) throw new Error(`Trop d'essais. Réessayez dans ${formatDelay(lockedFor)}.`);
        throw new Error("Identifiants incorrects.");
      }
      clearFailures(kv);
      // Migration silencieuse : un haché ancien est recalculé avec le meilleur algorithme.
      let current = admin;
      if (storedAlgo !== bestHashAlgo()) {
        const salt = randomSalt();
        current = { ...admin, salt, algo: bestHashAlgo(), hash: await hashPassword(password, salt) };
        kv.setItem(LOCAL_KEY, JSON.stringify(current));
      }
      openSession(current);
      return { id: current.id, email: current.email };
    },

    async changePassword(currentPassword, newPassword) {
      const admin = readLocalAdmin(kv);
      if (!admin) throw new Error("Aucun administrateur local configuré.");
      if ((await hashPassword(currentPassword, admin.salt, admin.algo ?? "sha256")) !== admin.hash) {
        throw new Error("Mot de passe actuel incorrect.");
      }
      const policy = validatePassword(newPassword);
      if (policy) throw new Error(policy.replace("Le mot de passe", "Le nouveau mot de passe"));
      const salt = randomSalt();
      const updated: LocalAdmin = {
        ...admin,
        salt,
        algo: bestHashAlgo(),
        hash: await hashPassword(newPassword, salt),
      };
      kv.setItem(LOCAL_KEY, JSON.stringify(updated));
      openSession(updated);
    },

    async signOut() {
      kv.removeItem(stateKey);
    },

    lockoutRemainingMs() {
      return lockRemainingMs(kv);
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
