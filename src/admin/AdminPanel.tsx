import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  ExternalLink,
  FileText,
  Globe,
  History,
  Inbox,
  LayoutGrid,
  LogOut,
  MessagesSquare,
  Rocket,
  Save,
  Star,
  Tag,
  Undo2,
  Users,
  Wallet,
} from "lucide-react";
import { content as bundled, type Lang, type SiteContent } from "../constants/content";
import { createAdminSession, type AdminSession, type AdminUser } from "../store/adminSession";
import { ADMIN_IS_DEFAULT, isSupabaseConfigured } from "../store/supabaseClient";
import { getContentStore, loadEditableContent } from "../store";
import { cloneContent, hasChanges } from "../store/types";
import { cn } from "../utils/cn";
import { Marker } from "../components/ui";
import AdminGate from "./AdminGate";
import Dashboard from "./Dashboard";
import ReservationsPanel from "./ReservationsPanel";
import type { EditorProps } from "./editors";
import {
  BenefitsEditor,
  ContactEditor,
  FaqEditor,
  FormationsEditor,
  HeroEditor,
  NewsEditor,
  PricingEditor,
  ProgramsEditor,
  SeoEditor,
} from "./editors";

type SectionId =
  | "dashboard"
  | "reservations"
  | "formations"
  | "programs"
  | "hero"
  | "news"
  | "pricing"
  | "faq"
  | "benefits"
  | "contact"
  | "seo"
  | "history";

interface Section {
  id: SectionId;
  label: string;
  hint: string;
  icon: typeof LayoutGrid;
  render?: (props: EditorProps) => React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: "dashboard", label: "Tableau de bord", hint: "Trafic, sources et conversion", icon: BarChart3 },
  { id: "reservations", label: "Réservations", hint: "Demandes reçues et suivi", icon: Inbox },
  { id: "formations", label: "Cours", hint: "Ajouter, modifier ou retirer un cours", icon: LayoutGrid, render: (p) => <FormationsEditor {...p} /> },
  { id: "programs", label: "Programmes phares", hint: "Onglets détaillés", icon: Rocket, render: (p) => <ProgramsEditor {...p} /> },
  { id: "hero", label: "Page d'accueil", hint: "Héro, atouts, publics", icon: Star, render: (p) => <HeroEditor {...p} /> },
  { id: "news", label: "Actualités", hint: "Publications et images", icon: FileText, render: (p) => <NewsEditor {...p} /> },
  { id: "pricing", label: "Tarifs", hint: "Offres et avantages", icon: Wallet, render: (p) => <PricingEditor {...p} /> },
  { id: "faq", label: "FAQ", hint: "Questions fréquentes", icon: MessagesSquare, render: (p) => <FaqEditor {...p} /> },
  { id: "benefits", label: "Avantages", hint: "Bloc « Pourquoi nous »", icon: Users, render: (p) => <BenefitsEditor {...p} /> },
  { id: "contact", label: "Contact & menu", hint: "Formulaire, navigation, pied de page", icon: Globe, render: (p) => <ContactEditor {...p} /> },
  { id: "seo", label: "Référencement", hint: "Titre et description", icon: Tag, render: (p) => <SeoEditor {...p} /> },
  { id: "history", label: "Historique", hint: "Versions publiées", icon: History },
];

type Status = { kind: "idle" } | { kind: "busy"; label: string } | { kind: "ok"; label: string } | { kind: "error"; label: string };

export default function AdminPanel() {
  const session = useMemo<AdminSession>(() => createAdminSession(), []);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    session
      .getSession()
      .then((current) => active && setUser(current))
      .catch(() => active && setUser(null))
      .finally(() => active && setChecking(false));
    return () => {
      active = false;
    };
  }, [session]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-50 text-sm font-semibold text-slate-500">
        Vérification de l'accès…
      </div>
    );
  }

  if (!user) {
    return (
      <AdminGate
        session={session}
        onSignedIn={setUser}
      />
    );
  }

  return (
    <AdminWorkspace
      user={user}
      onSignOut={async () => {
        await session.signOut().catch(() => undefined);
        setUser(null);
      }}
    />
  );
}

function AdminWorkspace({ user, onSignOut }: { user: AdminUser; onSignOut: () => void }) {
  const [lang, setLang] = useState<Lang>("fr");
  const [section, setSection] = useState<SectionId>("dashboard");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [baseline, setBaseline] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [versions, setVersions] = useState<Awaited<ReturnType<ReturnType<typeof getContentStore>["listRevisions"]>>>([]);
  const dirty = Boolean(content && baseline && hasChanges(baseline, content));
  const loadingRef = useRef(false);

  const flash = useCallback((next: Status) => {
    setStatus(next);
    if (next.kind === "ok") window.setTimeout(() => setStatus((current) => (current === next ? { kind: "idle" } : current)), 3500);
  }, []);

  const load = useCallback(
    async (target: Lang) => {
      setLoading(true);
      loadingRef.current = true;
      try {
        const data = await loadEditableContent(target);
        setContent(data);
        setBaseline(cloneContent(data));
        setVersions(await getContentStore().listRevisions(target));
        flash({ kind: "idle" });
      } catch (cause) {
        flash({ kind: "error", label: cause instanceof Error ? cause.message : "Chargement impossible." });
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [flash]
  );

  useEffect(() => {
    void load(lang);
  }, [lang, load]);

  /* Alerte avant de quitter avec des modifications non publiées. */
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const switchLang = (next: Lang) => {
    if (next === lang) return;
    if (dirty && !window.confirm("Changer de langue abandonne les modifications non enregistrées. Continuer ?")) return;
    setLang(next);
  };

  const saveDraft = async () => {
    if (!content) return;
    flash({ kind: "busy", label: "Enregistrement…" });
    try {
      await getContentStore().writeDraft(lang, content);
      setBaseline(cloneContent(content));
      flash({ kind: "ok", label: "Brouillon enregistré" });
    } catch (cause) {
      flash({ kind: "error", label: cause instanceof Error ? cause.message : "Enregistrement impossible." });
    }
  };

  const publish = async () => {
    if (!content) return;
    const label = lang === "fr" ? "française" : "arabe";
    if (!window.confirm(`Publier la version ${label} sur le site ?`)) return;
    flash({ kind: "busy", label: "Publication…" });
    try {
      const record = await getContentStore().writePublished(lang, content, note.trim() || "Publication", user.email);
      await getContentStore().discardDraft(lang);
      setBaseline(cloneContent(content));
      setNote("");
      setVersions(await getContentStore().listRevisions(lang));
      flash({ kind: "ok", label: `Publié — version ${record.version}` });
      window.dispatchEvent(new Event("fbl-content-updated"));
    } catch (cause) {
      flash({ kind: "error", label: cause instanceof Error ? cause.message : "Publication impossible." });
    }
  };

  const discard = async () => {
    if (!dirty) return;
    if (!window.confirm("Annuler les modifications en cours ?")) return;
    await getContentStore().discardDraft(lang).catch(() => undefined);
    await load(lang);
  };

  const restore = async (revisionId: number) => {
    if (!window.confirm("Restaurer cette version et la publier immédiatement ?")) return;
    flash({ kind: "busy", label: "Restauration…" });
    try {
      const record = await getContentStore().restoreRevision(lang, revisionId, user.email);
      await load(lang);
      flash({ kind: "ok", label: `Version ${record.version} restaurée` });
      window.dispatchEvent(new Event("fbl-content-updated"));
    } catch (cause) {
      flash({ kind: "error", label: cause instanceof Error ? cause.message : "Restauration impossible." });
    }
  };

  const onSectionChange = useCallback<EditorProps["onSection"]>((key, value) => {
    setContent((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  const active = SECTIONS.find((item) => item.id === section);

  return (
    <div className="relative isolate flex min-h-screen overflow-x-clip bg-white text-brand-950" dir="ltr">
      {/* Décor du héro : trame + halos bleu/jaune — toujours DERRIÈRE le contenu
          (isolate + -z-10 : l'ordre de peinture CSS sinon fait passer les absolus
          positionnés devant le texte statique). */}
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -start-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 end-0 -z-10 h-[26rem] w-[26rem] rounded-full bg-sun-200/50 blur-3xl"
      />

      {/* ── Barre latérale claire (verre dépoli, comme la navbar) ── */}
      <aside className="glass sticky top-0 z-10 flex h-screen w-60 shrink-0 flex-col sm:w-72">
        <div className="flex items-center gap-3 border-b border-brand-100/70 px-4 py-5 sm:px-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <LayoutGrid className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-extrabold tracking-tight text-brand-950">
              Administration
            </p>
            <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-600">
              Forma Business Lex
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3 sm:p-4">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              title={item.label}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-start text-sm font-semibold transition-all duration-300",
                section === item.id
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                  : "text-slate-600 hover:bg-white hover:text-brand-800 hover:shadow-card"
              )}
            >
              {section === item.id && (
                <span
                  className="absolute -start-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-sun-400"
                  aria-hidden="true"
                />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-rotate-6",
                  section === item.id ? "text-sun-300" : "text-brand-500"
                )}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Pied de barre latérale */}
        <div className="space-y-2.5 border-t border-brand-100/70 p-3 sm:p-4">
          <div className="flex rounded-full border border-brand-100 bg-white p-1 shadow-card">
            {(["fr", "ar"] as Lang[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLang(code)}
                className={cn(
                  "flex-1 rounded-full px-2 py-2 text-xs font-bold transition",
                  lang === code ? "bg-brand-600 text-white shadow" : "text-slate-500 hover:text-brand-700"
                )}
              >
                {code === "fr" ? "Français" : "العربية"}
              </button>
            ))}
          </div>
          <a
            href={ADMIN_IS_DEFAULT ? "/?site=1" : "#/"}
            className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-xs font-bold text-brand-800 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-brand-600" />
            <span>Voir le site</span>
          </a>
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Quitter</span>
          </button>
          <p
            className={cn(
              "flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold",
              isSupabaseConfigured() ? "text-emerald-600" : "text-sun-600"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isSupabaseConfigured() ? "bg-emerald-500" : "bg-sun-400"
              )}
              aria-hidden="true"
            />
            {isSupabaseConfigured() ? "En ligne" : "Brouillon local"}
          </p>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-8">
        {/* En-tête de section */}
        <main className="min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center overflow-hidden rounded-full shadow-card ring-1 ring-brand-100">
                <span className="bg-sun-400 px-3 py-1.5 text-xs font-extrabold text-brand-950">Admin</span>
                <span className="flex items-center gap-2 bg-white px-3.5 py-1.5 text-xs font-bold text-brand-800">
                  {active?.hint}
                </span>
              </span>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-brand-950 sm:text-5xl">
                <Marker>{active?.label}</Marker>
              </h1>
              <p className="mt-2.5 text-base text-slate-600">
                Contenu {lang === "fr" ? "français" : "arabe"} · les changements ne sont visibles qu'après « Publier ».
              </p>
            </div>
            {dirty && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-3.5 py-1.5 text-xs font-bold text-sun-700 ring-1 ring-sun-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sun-500" aria-hidden="true" />
                Modifications non publiées
              </span>
            )}
          </div>

          {/* Barre d'actions (verre dépoli, collante) — absente des écrans de données, en lecture seule */}
          {section !== "dashboard" && section !== "reservations" && (
          <div className="glass sticky top-4 z-20 mb-6 flex flex-wrap items-center gap-2.5 rounded-2xl p-3.5">
            <button
              type="button"
              onClick={saveDraft}
              disabled={!dirty || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-800 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 disabled:translate-y-0 disabled:opacity-40"
            >
              <Save className="h-4 w-4" /> Enregistrer le brouillon
            </button>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note de version (facultatif)"
              className="min-w-[12rem] flex-1 rounded-xl border border-brand-100 bg-white/70 px-3.5 py-2.5 text-xs text-brand-950 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
            <button
              type="button"
              onClick={discard}
              disabled={!dirty || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-800 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:translate-y-0 disabled:opacity-40"
            >
              <Undo2 className="h-4 w-4" /> Annuler
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={!content || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30 disabled:translate-y-0 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> Publier
            </button>
          </div>
          )}

          {status.kind !== "idle" && (
            <p
              role="status"
              className={cn(
                "mb-4 rounded-lg border px-3 py-2 text-xs font-semibold",
                status.kind === "error" && "border-rose-200 bg-rose-50 text-rose-700",
                status.kind === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                status.kind === "busy" && "border-slate-200 bg-slate-50 text-slate-600"
              )}
            >
              {status.label}
            </p>
          )}

          {section === "dashboard" ? (
            <Dashboard />
          ) : section === "reservations" ? (
            <ReservationsPanel />
          ) : loading || !content ? (
            <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Chargement du contenu…
            </p>
          ) : section === "history" ? (
            <HistoryView versions={versions} onRestore={restore} />
          ) : (
            <div className="space-y-6">{active?.render?.({ content, lang, onSection: onSectionChange })}</div>
          )}

          <p className="mt-8 text-xs text-slate-400">
            Contenu de secours intégré au build : « {bundled[lang].meta.title} ». Si la base est injoignable, le site
            affiche ce contenu.
          </p>
        </main>
        </div>
      </div>
    </div>
  );
}

function HistoryView({
  versions,
  onRestore,
}: {
  versions: Awaited<ReturnType<ReturnType<typeof getContentStore>["listRevisions"]>>;
  onRestore: (revisionId: number) => void;
}) {
  if (versions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Aucune version publiée pour l'instant.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {versions.map((revision, index) => (
        <li
          key={revision.id}
          className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover sm:p-5"
        >
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 font-display text-sm font-extrabold text-white shadow-lg shadow-brand-600/25">
            v{revision.version}
            {index === 0 && (
              <span className="absolute -end-1 -top-1 h-3 w-3 rounded-full bg-sun-400 ring-2 ring-white" aria-hidden="true" />
            )}
          </span>
          <div className="me-auto min-w-[10rem]">
            <p className="text-sm font-extrabold text-brand-950">
              {revision.note || "Publication"}
              {index === 0 && (
                <span className="ms-2 rounded-full bg-sun-100 px-2 py-0.5 text-[10px] font-bold text-sun-700 ring-1 ring-sun-200">
                  en ligne
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {revision.author} · {new Date(revision.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRestore(revision.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-800 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50"
          >
            <Undo2 className="h-4 w-4" /> Restaurer
          </button>
        </li>
      ))}
    </ul>
  );
}
