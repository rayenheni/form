import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Laptop, Users } from "lucide-react";
import { contact } from "../constants/content";
import { useLang } from "../i18n/LanguageContext";
import { cn } from "../utils/cn";
import { ArrowFwd, FacebookIcon, Marker, Reveal, SectionHeading, ease } from "./ui";

interface ShowcaseProps {
  onRequest: (interest: string) => void;
}

export default function Showcase({ onRequest }: ShowcaseProps) {
  const { t, lang } = useLang();
  const s = t.programs;
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Réinitialise l'onglet si la langue change (les identifiants restent stables)
  useEffect(() => {
    setActive(0);
  }, [lang]);

  const tabRefsReset = () => {
    tabRefs.current = tabRefs.current.slice(0, s.items.length);
  };
  tabRefsReset();

  const program = s.items[active];
  const ProgramIcon = program.icon;

  // Navigation au clavier entre les onglets (flèches, Début, Fin)
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = s.items.length;
    const fwd = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    // En RTL, les flèches horizontales s'inversent
    const isRtl = lang === "ar";
    let next: number | null = null;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    else if ((fwd && !isRtl) || (back && isRtl)) next = (active + 1) % count;
    else if ((back && !isRtl) || (fwd && isRtl)) next = (active - 1 + count) % count;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="programmes" aria-labelledby="programmes-title" className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-48 h-[26rem] w-[56rem] max-w-none -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl"
      />

      <div className="container-x relative">
        <SectionHeading
          align="center"
          id="programmes-title"
          eyebrow={s.eyebrow}
          title={
            <>
              {s.titlePre} <Marker>{s.titleMark}</Marker>
            </>
          }
          description={s.desc}
        />

        <Reveal delay={0.1} className="mt-10 flex justify-center sm:mt-12">
          <div
            role="tablist"
            aria-label={s.tablistLabel}
            onKeyDown={handleKeyDown}
            className="grid w-full max-w-md grid-cols-1 gap-1 rounded-2xl border border-brand-100 bg-brand-50 p-1.5 sm:inline-flex sm:w-auto sm:max-w-none"
          >
            {s.items.map((item, index) => {
              const selected = index === active;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(index)}
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors duration-300",
                    selected ? "text-white" : "text-brand-900 hover:text-brand-600"
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="program-tab"
                      className="absolute inset-0 rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="relative whitespace-nowrap">{item.tab}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div className="mt-8 sm:mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${lang}-${program.id}`}
              id={`panel-${program.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${program.id}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease }}
              className="grid overflow-hidden rounded-[1.75rem] border border-brand-100 bg-white shadow-card sm:rounded-[2rem] lg:grid-cols-[1.1fr_0.9fr]"
            >
              {/* Détails */}
              <div className="p-6 sm:p-10 lg:p-12">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun-400 text-brand-950">
                    <ProgramIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
                    <Laptop className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {program.format}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
                    <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {program.audience}
                  </span>
                </div>

                <h3 className="mt-6 font-display text-2xl font-extrabold leading-tight text-brand-950 sm:text-3xl">
                  {program.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-slate-600">{program.description}</p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => onRequest(program.interest)} className="btn btn-primary group w-full sm:w-auto">
                    {s.interested}
                    <ArrowFwd className="h-4 w-4" />
                  </button>
                  <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full sm:w-auto">
                    <FacebookIcon className="h-4 w-4 shrink-0 text-[#1877F2]" />
                    {s.viewFb}
                    <span className="sr-only">{s.newTab}</span>
                  </a>
                </div>
              </div>

              {/* Modules */}
              <div className="on-blue relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:p-10 lg:p-12">
                <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sun-400/25 blur-3xl rtl:-left-16 rtl:-right-auto" />
                <div aria-hidden="true" className="bg-grid-white absolute inset-0 opacity-60" />
                <p className="eyebrow relative text-xs font-bold uppercase tracking-[0.16em] text-sun-300">{s.inProgram}</p>
                <ol className="relative mt-6 space-y-3">
                  {program.modules.map((module, index) => (
                    <motion.li
                      key={module}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + index * 0.06, duration: 0.4, ease }}
                      className="flex items-center gap-4 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.16]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sun-400 font-display text-sm font-extrabold text-brand-950">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-semibold leading-snug sm:text-[15px]">{module}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
