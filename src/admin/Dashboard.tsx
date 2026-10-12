import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Globe2,
  Inbox,
  LineChart,
  Minus,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  formatCount,
  formatDelta,
  formatPercent,
  summarize,
  type Pageview,
  type Reservation,
} from "../lib/analytics";
import { getAnalyticsStore } from "../store/analytics";
import { cn } from "../utils/cn";
import ReservationsPanel from "./ReservationsPanel";

/* ══════════════════════════════════════════════════════════════
 *  Tableau de bord — trafic, sources et réservations
 *
 *  Lecture seule côté données : aucune publication n'est nécessaire,
 *  les chiffres viennent du magasin analytique (Supabase en production,
 *  navigateur en démonstration).
 * ══════════════════════════════════════════════════════════════ */

const RANGES: readonly { days: number; label: string }[] = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
];

/** Fenêtre de récupération : la période courante + la précédente (pour la variation). */
function sinceIso(days: number): string {
  return new Date(Date.now() - days * 2 * 86_400_000).toISOString();
}

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [pageviews, setPageviews] = useState<Pageview[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (span: number, quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const store = getAnalyticsStore();
      const since = sinceIso(span);
      const [views, items] = await Promise.all([store.listPageviews(since), store.listReservations(since)]);
      setPageviews(views);
      setReservations(items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lecture des statistiques impossible.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const summary = useMemo(() => summarize(pageviews, reservations, days), [pageviews, reservations, days]);

  const delta = summary.visitsDelta;
  const maxVisits = Math.max(1, ...summary.series.map((point) => point.visits));
  const totalSourceVisits = Math.max(1, summary.bySource.reduce((sum, item) => sum + item.count, 0));

  if (loading) {
    return (
      <div className="grid min-h-[24rem] place-items-center rounded-2xl border border-brand-100 bg-white/70 text-sm font-semibold text-slate-500">
        Chargement des statistiques…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Bandeau : période, actualisation, export ── */}
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3.5">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-900">
          <CalendarClock className="h-4 w-4 text-brand-500" /> Période
        </span>
        <div className="inline-flex rounded-xl bg-brand-50 p-1">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setDays(range.days)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                days === range.days
                  ? "bg-white text-brand-800 shadow-sm"
                  : "text-brand-600 hover:bg-white/60"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load(days, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-800 transition hover:-translate-y-0.5 hover:bg-brand-50 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /> Actualiser
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
      )}

      {/* ── Indicateurs clés ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={<MousePointerClick className="h-5 w-5" />}
          label="Visites"
          value={formatCount(summary.visits)}
          hint={`Période précédente : ${formatCount(summary.previousVisits)}`}
          delta={delta}
          tone="brand"
        />
        <Kpi
          icon={<Users className="h-5 w-5" />}
          label="Visiteurs uniques"
          value={formatCount(summary.uniqueVisitors)}
          hint="Identifiants distincts"
          tone="sun"
        />
        <Kpi
          icon={<Inbox className="h-5 w-5" />}
          label="Réservations"
          value={formatCount(summary.reservations)}
          hint="Demandes reçues"
          tone="emerald"
        />
        <Kpi
          icon={<TrendingUp className="h-5 w-5" />}
          label="Taux de conversion"
          value={formatPercent(summary.conversionRate)}
          hint="Réservations ÷ visiteurs"
          tone="violet"
        />
      </div>

      {/* ── Courbe de trafic ── */}
      <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card sm:p-6">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold text-brand-950">
              <span className="h-2 w-2 shrink-0 rounded-full bg-sun-400" aria-hidden="true" />
              Trafic quotidien
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Visites et réservations, jour par jour sur {summary.range.days} jours
            </p>
          </div>
          {summary.peak && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-sun-50 px-3 py-1.5 text-xs font-bold text-sun-800 ring-1 ring-sun-200">
              <LineChart className="h-3.5 w-3.5" /> Pic : {formatCount(summary.peak.visits)} le {summary.peak.date}
            </p>
          )}
        </header>

        {summary.visits === 0 ? (
          <EmptyChart />
        ) : (
          <div className="flex h-40 items-end gap-[3px]" role="img" aria-label="Visites par jour">
            {summary.series.map((point) => (
              <div key={point.date} className="group relative flex h-full flex-1 flex-col justify-end gap-1">
                <div
                  className="w-full rounded-t-[3px] bg-brand-500/85 transition-all duration-200 group-hover:bg-brand-600"
                  style={{ height: `${Math.max(2, (point.visits / maxVisits) * 100)}%` }}
                />
                {point.reservations > 0 && (
                  <div
                    className="w-full rounded-b-[3px] bg-sun-400"
                    style={{ height: `${(point.reservations / maxVisits) * 100}%` }}
                  />
                )}
                <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-950 px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block">
                  {point.visits} visite{point.visits > 1 ? "s" : ""} · {point.reservations} dem.
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-brand-50 pt-4 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-500/85" /> Visites
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-sun-400" /> Réservations
          </span>
          <span className="ms-auto">{summary.series[0]?.label} → {summary.series[summary.series.length - 1]?.label}</span>
        </div>
      </section>

      {/* ── Sources et pages ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Sources de trafic" subtitle="D'où viennent les visiteurs">
          {summary.bySource.length === 0 ? (
            <EmptyLine />
          ) : (
            <ul className="space-y-3">
              {summary.bySource.slice(0, 6).map((item) => (
                <li key={item.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-bold text-brand-950">{item.label}</span>
                    <span className="shrink-0 text-xs font-bold text-slate-500">
                      {formatCount(item.count)} · {formatPercent((item.count / totalSourceVisits) * 100)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                      style={{ width: `${Math.max(3, (item.count / totalSourceVisits) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pages les plus vues" subtitle="Sections consultées">
          {summary.byPage.length === 0 ? (
            <EmptyLine />
          ) : (
            <ol className="space-y-2">
              {summary.byPage.slice(0, 6).map((item, index) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-brand-50 bg-brand-50/40 px-3 py-2"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white text-[11px] font-extrabold text-brand-600 ring-1 ring-brand-100">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-brand-900">{item.label}</span>
                  <span className="shrink-0 text-xs font-bold text-slate-500">{formatCount(item.count)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {/* ── Répartition par langue ── */}
      <Panel title="Langue des visiteurs" subtitle="Version du site consultée" icon={<Globe2 className="h-4 w-4 text-brand-500" />}>
        {summary.byLang.length === 0 ? (
          <EmptyLine />
        ) : (
          <div className="flex flex-wrap gap-3">
            {summary.byLang.map((item) => {
              const share = (item.count / totalSourceVisits) * 100;
              return (
                <div key={item.label} className="min-w-[9rem] flex-1 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                  <p className="text-sm font-extrabold text-brand-950">{item.label}</p>
                  <p className="mt-0.5 font-display text-2xl font-extrabold text-brand-700">{formatPercent(share)}</p>
                  <p className="text-xs font-semibold text-slate-500">{formatCount(item.count)} visites</p>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ── Réservations (page dédiée embarquée) ── */}
      <ReservationsPanel />
    </div>
  );
}

/* ───────────────────────── Sous-composants ───────────────────────── */

const TONES = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  sun: "bg-sun-50 text-sun-600 ring-sun-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
} as const;

function Kpi({
  icon,
  label,
  value,
  hint,
  delta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  delta?: number;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-3">
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl ring-1", TONES[tone])}>{icon}</span>
        {typeof delta === "number" && delta !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-extrabold ring-1",
              delta > 0
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-rose-50 text-rose-600 ring-rose-100"
            )}
          >
            {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatDelta(delta)}
          </span>
        )}
        {typeof delta === "number" && delta === 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-extrabold text-slate-400 ring-1 ring-slate-100">
            <Minus className="h-3 w-3" /> Stable
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-brand-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-600">{label}</p>
      <p className="text-xs font-medium text-slate-400">{hint}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card sm:p-6">
      <header className="mb-5">
        <h3 className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold text-brand-950">
          <span className="h-2 w-2 shrink-0 rounded-full bg-sun-400" aria-hidden="true" />
          {title}
          {icon}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-40 place-items-center rounded-xl border border-dashed border-brand-200 bg-brand-50/30 text-center">
      <div>
        <LineChart className="mx-auto h-6 w-6 text-brand-300" />
        <p className="mt-2 text-sm font-bold text-brand-800">Aucune visite enregistrée</p>
        <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
          La collecte démarre maintenant : ouvrez le site public, chaque page vue sera comptée ici.
        </p>
      </div>
    </div>
  );
}

function EmptyLine() {
  return <p className="text-sm font-semibold text-slate-400">Aucune donnée sur cette période.</p>;
}
