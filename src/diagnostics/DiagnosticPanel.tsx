import { useEffect, useState } from "react";
import type { Lang } from "../constants/content";
import { BUILD_LABEL } from "../constants/buildInfo";
import { ADMIN_PATH, isSupabaseConfigured, supabaseUrl } from "../store/supabaseClient";
import { getContentStore } from "../store";
import { useContent } from "../i18n/ContentProvider";

/**
 * Panneau de diagnostic, affiché uniquement sur demande :
 *   https://votre-site/?diagnostic=1
 *
 * Il répond aux trois questions qui reviennent en production :
 *   1. quel build est réellement en ligne ?
 *   2. le site lit-il Supabase (et sur quel projet) ?
 *   3. le contenu affiché vient-il du code ou de la base ?
 *
 * Aucune donnée sensible : la clé `anon` n'est jamais affichée, seulement
 * l'identifiant du projet Supabase (déjà public dans le bundle).
 */
interface Row {
  label: string;
  value: string;
  ok?: boolean;
  hint?: string;
}

function projectRef(url: string): string {
  const match = /^https?:\/\/([a-z0-9-]+)\.supabase\.co/i.exec(url.trim());
  return match ? match[1] : url.trim() ? url.trim() : "—";
}

export default function DiagnosticPanel() {
  const { content, source } = useContent();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let active = true;

    const base: Row[] = [
      { label: "Version du build", value: BUILD_LABEL, ok: true },
      {
        label: "Supabase",
        value: isSupabaseConfigured() ? `projet « ${projectRef(supabaseUrl)} »` : "non configuré",
        ok: isSupabaseConfigured(),
        hint: isSupabaseConfigured()
          ? undefined
          : "Variables VITE_SUPABASE_* absentes au build : contenu du code, admin en mode local.",
      },
      { label: "Chemin d'admin", value: `#/${ADMIN_PATH}` },
      {
        label: "Source du contenu",
        value: source === "live" ? "base Supabase (live)" : "code intégré au build",
        ok: source === "live",
        hint:
          source === "live"
            ? undefined
            : "Aucune ligne publiée lue : le site affiche le contenu du fichier index.html.",
      },
    ];

    /* Détail par langue : version publiée + matières ENA. */
    (async () => {
      const extra: Row[] = [];
      for (const lang of ["fr", "ar"] as Lang[]) {
        const inBuild = content[lang].programs.items.find((item) => item.id === "ena")?.modules ?? [];
        const hasSeven = inBuild.length === 7;

        let published = "aucune ligne publiée";
        if (isSupabaseConfigured()) {
          try {
            const record = await getContentStore().readPublished(lang);
            published = record
              ? `v${record.version} · ${new Date(record.updatedAt).toLocaleString("fr-FR")}`
              : "aucune ligne publiée";
          } catch (error) {
            published = `lecture impossible (${error instanceof Error ? error.message : "erreur"})`;
          }
        }

        extra.push({
          label: `Contenu ${lang.toUpperCase()}`,
          value: `${published} — ENA : ${inBuild.length} matière(s)`,
          ok: hasSeven,
          hint: hasSeven ? undefined : `attendu 7 matières ENA, ${inBuild.length} affichée(s)`,
        });
      }
      if (active) setRows([...base, ...extra]);
    })();

    return () => {
      active = false;
    };
  }, [content, source]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 start-4 z-[70] rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xl"
      >
        Diagnostic
      </button>
    );
  }

  return (
    <aside
      aria-label="Diagnostic du déploiement"
      className="fixed bottom-4 start-4 z-[70] w-[min(30rem,calc(100vw-2rem))] rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-slate-100 shadow-2xl backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-300">Diagnostic</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Visible uniquement avec <code>?diagnostic=1</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer le diagnostic"
          className="rounded-lg px-2 py-1 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          ×
        </button>
      </div>

      <dl className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-2">
            <dt className="w-[9.5rem] shrink-0 text-slate-400">{row.label}</dt>
            <dd className="min-w-0">
              <span className={row.ok === false ? "text-rose-300" : "text-emerald-300"}>{row.value}</span>
              {row.hint && <span className="mt-0.5 block text-slate-400">↳ {row.hint}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 border-t border-slate-800 pt-2 text-[10px] text-slate-500">
        Rechargez avec Ctrl/Cmd + Maj + R avant de conclure. La clé Supabase n'est jamais affichée.
      </p>
    </aside>
  );
}

/** `?diagnostic=1` ou `#diagnostic` active le panneau. */
export function isDiagnosticRequested(location: Location): boolean {
  try {
    const params = new URLSearchParams(location.search);
    return params.get("diagnostic") === "1" || location.hash === "#diagnostic";
  } catch {
    return false;
  }
}
