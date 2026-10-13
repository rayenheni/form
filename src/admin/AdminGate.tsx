import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import type { AdminSession, AdminUser } from "../store/adminSession";

interface GateProps {
  session: AdminSession;
  onSignedIn: (user: AdminUser) => void;
}

/**
 * Porte d'entrée de l'administration : mot de passe requis.
 * L'autorisation réelle est vérifiée côté serveur par Supabase (RLS) ;
 * en mode local, par le hachage stocké dans le navigateur.
 */
export default function AdminGate({ session, onSignedIn }: GateProps) {
  /* `isLocalSetup()` = « installation encore à faire » (aucun mot de passe créé). */
  const setupRequired = session.mode === "local" && session.isLocalSetup?.() === true;
  const [mode, setMode] = useState<"signin" | "setup">(setupRequired ? "setup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lockedFor, setLockedFor] = useState(0);

  useEffect(() => setMode(setupRequired ? "setup" : "signin"), [setupRequired]);

  /* Décompte du verrouillage (trop d'essais) : une seconde à la fois, jusqu'à 0. */
  useEffect(() => {
    if (lockedFor <= 0) return;
    const timer = window.setInterval(() => setLockedFor((value) => Math.max(0, value - 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [lockedFor]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "setup") {
        if (password !== confirm) throw new Error("Les deux mots de passe ne correspondent pas.");
        const user = await session.setupLocal?.(password);
        if (!user) throw new Error("Installation locale indisponible.");
        onSignedIn(user);
      } else {
        onSignedIn(await session.signIn(email.trim(), password));
      }
    } catch (cause) {
      setLockedFor(session.lockoutRemainingMs?.() ?? 0);
      setError(cause instanceof Error ? cause.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-brand-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold text-brand-950">Administration</p>
            <p className="text-xs font-semibold text-slate-500">Forma Business Lex</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
          <div>
            <h1 className="font-display text-xl font-extrabold text-brand-950">
              {mode === "setup" ? "Créer l'accès administrateur" : "Connexion"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "setup"
                ? "Choisissez le mot de passe qui protège cette administration (mode local, sans serveur)."
                : "Entrez vos identifiants d'administrateur."}
            </p>
          </div>

          {mode === "signin" && session.mode === "supabase" && (
            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">E-mail</span>
              <input
                type="email"
                value={email}
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
            </label>
          )}

          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Mot de passe</span>
            <div className="relative mt-1.5">
              <input
                type={show ? "text" : "password"}
                value={password}
                maxLength={128}
                autoComplete={mode === "setup" ? "new-password" : "current-password"}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pe-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
              <button
                type="button"
                onClick={() => setShow((value) => !value)}
                aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute end-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {mode === "setup" && (
            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Confirmer le mot de passe
              </span>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                autoComplete="new-password"
                onChange={(event) => setConfirm(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          {lockedFor > 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              Déverrouillage automatique dans{" "}
              {Math.ceil(lockedFor / 60_000) >= 1
                ? `${Math.ceil(lockedFor / 60_000)} min`
                : `${Math.ceil(lockedFor / 1000)} s`}
              .
            </p>
          )}

          <button
            type="submit"
            disabled={busy || lockedFor > 0 || (!password && mode === "setup") || (session.mode === "supabase" && !email)}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? "Vérification…" : mode === "setup" ? "Créer l'accès" : "Se connecter"}
          </button>
        </form>

      </div>
    </div>
  );
}
