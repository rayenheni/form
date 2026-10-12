import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Inbox, RefreshCw } from "lucide-react";
import {
  formatDateTime,
  formatCount,
  RESERVATION_LABELS,
  RESERVATION_STATUSES,
  reservationsToCsv,
  type Reservation,
  type ReservationStatus,
} from "../lib/analytics";
import { getAnalyticsStore } from "../store/analytics";
import { isSupabaseConfigured } from "../store/supabaseClient";
import { cn } from "../utils/cn";

/* ══════════════════════════════════════════════════════════════
 *  Page « Réservations » : suivi des demandes du formulaire.
 *
 *  Autonome : elle lit ses propres données, gère les statuts et
 *  l'export CSV. Le tableau de bord l'embarque aussi.
 * ══════════════════════════════════════════════════════════════ */

const STATUS_STYLES: Record<ReservationStatus, string> = {
  new: "bg-sun-100 text-sun-800 ring-sun-200",
  contacted: "bg-brand-50 text-brand-700 ring-brand-100",
  booked: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

/** Toutes les demandes, depuis l'origine. */
const SINCE_EPOCH = new Date(0).toISOString();

export default function ReservationsPanel() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ReservationStatus>("all");

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setReservations(await getAnalyticsStore().listReservations(SINCE_EPOCH));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lecture des demandes impossible.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (id: string, status: ReservationStatus) => {
    const previous = reservations;
    setReservations((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    try {
      await getAnalyticsStore().setReservationStatus(id, status);
    } catch {
      setReservations(previous);
      setError("Le statut n'a pas pu être enregistré.");
    }
  };

  const exportCsv = () => {
    const rows = filter === "all" ? reservations : reservations.filter((item) => item.status === filter);
    const blob = new Blob([reservationsToCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const visible = useMemo(
    () => (filter === "all" ? reservations : reservations.filter((item) => item.status === filter)),
    [filter, reservations]
  );

  if (loading) {
    return (
      <div className="grid min-h-[24rem] place-items-center rounded-2xl border border-brand-100 bg-white/70 text-sm font-semibold text-slate-500">
        Chargement des demandes…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── En-tête : titre, actualisation, export ── */}
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
          <Inbox className="h-5 w-5" />
        </span>
        <div className="me-auto">
          <h3 className="font-display text-lg font-extrabold text-brand-950">
            Réservations
            <span className="ms-2 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
              {formatCount(reservations.length)}
            </span>
          </h3>
          <p className="text-xs font-medium text-slate-500">
            Chaque demande du formulaire, du premier contact à la réservation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-800 transition hover:-translate-y-0.5 hover:bg-brand-50 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /> Actualiser
        </button>
        <button
          type="button"
          onClick={exportCsv}
          disabled={reservations.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-50 disabled:shadow-none"
        >
          <Download className="h-4 w-4" /> Exporter CSV
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
      )}

      {/* ── Liste ── */}
      <section className="rounded-2xl border border-brand-100 bg-white shadow-card">
        <header className="flex flex-wrap items-center gap-3 border-b border-brand-50 p-5">
          <div className="me-auto">
            <h3 className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold text-brand-950">
              <span className="h-2 w-2 shrink-0 rounded-full bg-sun-400" aria-hidden="true" />
              Demandes
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                {visible.length}
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Toutes" />
            {RESERVATION_STATUSES.map((status) => (
              <FilterChip
                key={status}
                active={filter === status}
                onClick={() => setFilter(status)}
                label={RESERVATION_LABELS[status]}
                count={reservations.filter((item) => item.status === status).length}
              />
            ))}
          </div>
        </header>

        {visible.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
            {reservations.length === 0
              ? "Aucune demande pour l'instant. Elles apparaîtront ici dès réception."
              : "Aucune demande avec ce statut."}
          </p>
        ) : (
          <ul className="divide-y divide-brand-50">
            {visible.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start gap-4 p-5 transition hover:bg-brand-50/30">
                <div className="min-w-[14rem] flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-brand-950">
                    {item.name || "Sans nom"}
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold ring-1", STATUS_STYLES[item.status])}>
                      {RESERVATION_LABELS[item.status]}
                    </span>
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-600">
                    {item.email || "—"} {item.phone ? `· ${item.phone}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-brand-600">{item.interest || "Sujet non précisé"}</p>
                  {item.message && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{item.message}</p>}
                  <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                    {formatDateTime(item.createdAt)} · source {item.source} · langue {item.lang === "ar" ? "arabe" : "français"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {RESERVATION_STATUSES.filter((status) => status !== item.status).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void changeStatus(item.id, status)}
                      className="rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-brand-700 transition hover:-translate-y-0.5 hover:bg-brand-50"
                    >
                      {RESERVATION_LABELS[status]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isSupabaseConfigured() && (
        <p className="rounded-xl border border-sun-200 bg-sun-50 px-4 py-3 text-xs font-semibold text-sun-800">
          Mode démonstration : les demandes proviennent de ce navigateur uniquement. Configurez Supabase pour
          recevoir les demandes de tous les visiteurs.
        </p>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 transition",
        active
          ? "bg-brand-600 text-white ring-brand-600 shadow-md shadow-brand-600/25"
          : "bg-white text-brand-700 ring-brand-200 hover:bg-brand-50"
      )}
    >
      {label}
      {typeof count === "number" && <span className="ms-1.5 opacity-70">{count}</span>}
    </button>
  );
}
