import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { ICON_NAMES, type IconName } from "../constants/icons";
import { SpotlightCard } from "../components/ui";
import { cn } from "../utils/cn";

/* Champs de formulaire réutilisables par les écrans de l'administration. */

/* Champs alignés sur le design system du site public (mêmes finitions que le
 * formulaire de contact : fond slate-50, focus blanc + anneau brand). */
const inputClass =
  "w-full rounded-xl border border-brand-100 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-brand-950 placeholder:text-slate-400 transition duration-200 hover:border-brand-200 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15";
const labelClass = "block text-xs font-bold uppercase tracking-[0.1em] text-brand-800";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  dir,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      dir={dir}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  dir,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <textarea
      value={value ?? ""}
      rows={rows}
      dir={dir}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={cn(inputClass, "resize-y leading-relaxed")}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-700"
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "start-[calc(100%-1.375rem)]" : "start-0.5"
          )}
        />
      </span>
      {label}
    </button>
  );
}

export function IconPicker({ value, onChange }: { value: IconName | string; onChange: (value: IconName) => void }) {
  return (
    <select
      value={ICON_NAMES.includes(value as IconName) ? value : ""}
      onChange={(event) => onChange(event.target.value as IconName)}
      className={cn(inputClass, "cursor-pointer")}
    >
      {!ICON_NAMES.includes(value as IconName) && <option value="">— icône inconnue —</option>}
      {ICON_NAMES.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}

/** Barre d'outils d'un élément de liste : déplacer, dupliquer, supprimer. */
function RowTools({
  index,
  total,
  onMove,
  onDuplicate,
  onRemove,
}: {
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const button =
    "grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-brand-700 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <span className="me-1 text-slate-300" aria-hidden="true">
        <GripVertical className="h-4 w-4" />
      </span>
      <button type="button" className={button} onClick={() => onMove(-1)} disabled={index === 0} aria-label="Monter">
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={button}
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label="Descendre"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
      <button type="button" className={button} onClick={onDuplicate} aria-label="Dupliquer">
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn(button, "hover:bg-rose-50 hover:text-rose-600")}
        onClick={onRemove}
        aria-label="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Carte d'un élément de liste avec en-tête numéroté et outils. */
export function ItemCard({
  index,
  total,
  title,
  onMove,
  onDuplicate,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  title: string;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <SpotlightCard className="rounded-2xl">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-brand-50 pb-3">
          <p className="flex min-w-0 items-center gap-2.5 truncate text-sm font-extrabold text-brand-950">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100">
              {index + 1}
            </span>
            <span className="truncate">{title || "Sans titre"}</span>
          </p>
          <RowTools index={index} total={total} onMove={onMove} onDuplicate={onDuplicate} onRemove={onRemove} />
        </div>
        {children}
      </div>
    </SpotlightCard>
  );
}

/** Enveloppe commune aux éditeurs de listes (formations, offres, FAQ…). */
export function ListEditor({
  items,
  title,
  onAdd,
  addLabel = "Ajouter",
  children,
}: {
  items: unknown[];
  title: string;
  onAdd: () => void;
  addLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold text-brand-950">
          <span className="h-2 w-2 shrink-0 rounded-full bg-sun-400" aria-hidden="true" />
          {title}
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
            {items.length}
          </span>
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30"
        >
          <Plus className="h-4 w-4" /> {addLabel}
        </button>
      </div>
      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Aucun élément. Cliquez sur « {addLabel} ».
        </p>
      )}
      {children}
    </section>
  );
}

/** Helpers immuables pour manipuler les listes depuis les écrans. */
export function listHelpers<T>(items: T[], onChange: (next: T[]) => void) {
  return {
    update(index: number, patch: Partial<T>) {
      onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    },
    add(item: T) {
      onChange([...items, item]);
    },
    remove(index: number) {
      onChange(items.filter((_, i) => i !== index));
    },
    duplicate(index: number) {
      const copy = JSON.parse(JSON.stringify(items[index])) as T;
      onChange([...items.slice(0, index + 1), copy, ...items.slice(index + 1)]);
    },
    move(index: number, direction: -1 | 1) {
      const target = index + direction;
      if (target < 0 || target >= items.length) return;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      onChange(next);
    },
  };
}
