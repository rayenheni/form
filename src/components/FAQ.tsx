import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";
import { cn } from "../utils/cn";
import { ArrowFwd, Reveal, SectionHeading, ease } from "./ui";

export default function FAQ() {
  const { t } = useLang();
  const s = t.faq;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative bg-brand-50 py-20 sm:py-24 lg:py-32">
      <div className="container-x grid gap-10 sm:gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow={s.eyebrow}
            id="faq-title"
            title={
              <>
                {s.titlePre} <span className="text-brand-600">{s.titleAccent}</span>
              </>
            }
            description={s.desc}
          />
          <Reveal delay={0.2}>
            <a href="#contact" className="btn btn-primary group mt-8 max-sm:w-full">
              {s.cta}
              <ArrowFwd className="h-4 w-4" />
            </a>
          </Reveal>
        </div>

        <div className="space-y-3">
          {s.items.map((item, index) => {
            const isOpen = open === index;
            const buttonId = `faq-button-${index}`;
            const panelId = `faq-panel-${index}`;
            return (
              <Reveal key={item.question} delay={index * 0.05}>
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white transition-all duration-300",
                    isOpen ? "border-brand-200 shadow-card-hover" : "border-brand-100 shadow-card hover:border-brand-200"
                  )}
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : index)}
                      className="flex w-full items-center gap-4 rounded-2xl p-5 text-start sm:p-6"
                    >
                      <span className="flex-1 font-display text-base font-bold text-brand-950 sm:text-lg">
                        {item.question}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300",
                          isOpen ? "rotate-45 bg-sun-400 text-brand-950" : "bg-brand-50 text-brand-600"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease }}
                      >
                        <p className="px-5 pb-6 text-[15px] leading-relaxed text-slate-600 sm:px-6">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
