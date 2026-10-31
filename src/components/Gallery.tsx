import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";
import { cn } from "../utils/cn";
import { Reveal, SectionHeading, ease } from "./ui";

/** Remplit `{current}` / `{total}` dans un libellé traduit. */
const fill = (template: string, current: number, total: number) =>
  template.replace("{current}", String(current)).replace("{total}", String(total));

export default function Gallery() {
  const { t, lang } = useLang();
  const s = t.gallery;
  const items = s.items.filter((item) => item.src.trim() !== "");
  const [open, setOpen] = useState<number | null>(null);
  /* Photos verticales : on les affiche entières plutôt que de rogner les visages. */
  const [portrait, setPortrait] = useState<Record<string, boolean>>({});
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const move = useCallback(
    (delta: number) => {
      setOpen((current) => (current === null ? current : (current + delta + items.length) % items.length));
    },
    [items.length]
  );

  /* Lightbox : flèches, Échap, focus rendu à la vignette d'origine. */
  useEffect(() => {
    if (open === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") move(1);
      else if (event.key === "ArrowLeft") move(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [open, close, move]);

  if (items.length === 0) return null;

  const active = open === null ? null : items[open];

  return (
    <section id="galerie" aria-labelledby="galerie-title" className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-32">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-60" />

      <div className="container-x relative">
        <SectionHeading
          align="center"
          eyebrow={s.eyebrow}
          id="galerie-title"
          title={
            <>
              {s.titlePre} <span className="text-brand-600">{s.titleAccent}</span>
            </>
          }
          description={s.desc}
        />

        {items.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-8 text-center text-sm text-slate-500">
            {s.empty}
          </p>
        ) : (
          <div
            className={cn(
              "mt-12 grid gap-4 sm:mt-14 sm:gap-5",
              items.length === 1 ? "max-w-3xl sm:mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {items.map((item, index) => {
              /* La première photo occupe deux colonnes : la grille reste équilibrée.*/
              const wide = items.length > 2 && index === 0;
              return (
                <Reveal
                  key={`${item.src}-${index}`}
                  delay={Math.min(index * 0.07, 0.42)}
                  className={cn("h-full", wide && "sm:col-span-2")}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      openerRef.current = event.currentTarget;
                      setOpen(index);
                    }}
                    aria-label={`${s.openLabel} : ${item.caption || item.alt}`}
                    className="group relative block h-full w-full overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-card-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      onLoad={(event) => {
                        const img = event.currentTarget;
                        if (img.naturalHeight > img.naturalWidth * 1.05) {
                          setPortrait((prev) => (prev[item.src] ? prev : { ...prev, [item.src]: true }));
                        }
                      }}
                      className={cn(
                        "w-full transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
                        portrait[item.src] ? "bg-brand-100/50 object-contain" : "object-cover",
                        wide ? "aspect-[16/10] sm:aspect-[2/1]" : "aspect-[4/3]"
                      )}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95"
                    />
                    {(item.tag || item.caption) && (
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-start sm:p-5">
                        {item.tag && (
                          <span className="w-fit rounded-full bg-sun-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-950">
                            {item.tag}
                          </span>
                        )}
                        {item.caption && (
                          <span className="text-sm font-bold leading-snug text-white sm:text-base">{item.caption}</span>
                        )}
                      </span>
                    )}
                    <span
                      aria-hidden="true"
                      className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-brand-700 opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      <Images className="h-4 w-4" />
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={active.caption || active.alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            className="fixed inset-0 z-[80] flex flex-col bg-brand-950/95 backdrop-blur-sm"
            onClick={close}
          >
            <div className="flex items-center justify-between gap-4 p-4 text-white sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sun-300">
                {fill(s.counterLabel, (open ?? 0) + 1, items.length)}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label={s.closeLabel}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-sun-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-6 sm:pb-6"
              onClick={(event) => event.stopPropagation()}
            >
              <motion.figure
                key={active.src}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease }}
                className="flex max-h-full w-full max-w-5xl flex-col items-center"
              >
                <img
                  src={active.src}
                  alt={active.alt}
                  className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                />
                <figcaption className="mt-4 max-w-2xl text-center">
                  {active.caption && <p className="text-sm font-bold text-white sm:text-base">{active.caption}</p>}
                  {active.tag && <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-sun-300">{active.tag}</p>}
                </figcaption>
              </motion.figure>

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => move(lang === "ar" ? 1 : -1)}
                    aria-label={s.prevLabel}
                    className="absolute start-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-sun-300 sm:start-4 sm:h-12 sm:w-12"
                  >
                    <ChevronLeft className="h-6 w-6 rtl:-scale-x-100" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(lang === "ar" ? -1 : 1)}
                    aria-label={s.nextLabel}
                    className="absolute end-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-sun-300 sm:end-4 sm:h-12 sm:w-12"
                  >
                    <ChevronRight className="h-6 w-6 rtl:-scale-x-100" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
