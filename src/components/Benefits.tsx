import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";
import { Marker, Reveal, SectionHeading, ease } from "./ui";

const BENEFITS_IMAGE =
  "https://images.pexels.com/photos/4049875/pexels-photo-4049875.jpeg?auto=compress&cs=tinysrgb&w=1200";

export default function Benefits() {
  const { t } = useLang();
  const s = t.benefits;

  return (
    <section
      id="avantages"
      aria-labelledby="avantages-title"
      className="relative overflow-hidden bg-gradient-to-b from-white via-sun-50 to-white py-20 sm:py-24 lg:py-32"
    >
      <div className="container-x grid items-center gap-14 sm:gap-16 lg:grid-cols-2 lg:gap-20">
        {/* Visuel */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease }}
          className="relative mx-auto mb-6 w-full max-w-xl sm:mb-8 lg:order-first lg:mb-0"
        >
          <div aria-hidden="true" className="absolute -left-4 -top-4 h-24 w-24 rounded-3xl bg-sun-400 sm:-left-5 sm:-top-5 sm:h-36 sm:w-36" />
          <div aria-hidden="true" className="absolute -bottom-6 -right-4 h-32 w-32 rounded-full border-[12px] border-brand-100 sm:-right-6 sm:h-40 sm:w-40" />
          <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-white bg-brand-100 shadow-2xl shadow-brand-900/15 sm:rounded-[2rem]">
            <img
              src={BENEFITS_IMAGE}
              alt={s.imgAlt}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="glass absolute -bottom-8 left-3 right-3 flex items-center gap-4 rounded-2xl p-4 sm:left-auto sm:right-8 sm:w-80">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
              <Target className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-brand-950">{s.overlayTitle}</p>
              <p className="text-xs leading-relaxed text-slate-600">{s.overlayDesc}</p>
            </div>
          </div>
        </motion.div>

        {/* Contenu */}
        <div>
          <SectionHeading
            eyebrow={s.eyebrow}
            id="avantages-title"
            title={
              <>
                {s.titlePre} <Marker>{s.titleMark}</Marker>
              </>
            }
            description={s.desc}
          />

          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
            {s.items.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} delay={index * 0.08} className="h-full">
                <div className="group h-full rounded-2xl border border-brand-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-sun-300 hover:shadow-card-hover sm:p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-sun-100 text-brand-700 transition-all duration-300 group-hover:-rotate-6 group-hover:bg-sun-400 group-hover:text-brand-950">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-brand-950">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
