import { motion } from "framer-motion";
import { Check, GraduationCap, MapPin } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";
import { ArrowFwd, Marker, ease } from "./ui";

const HERO_IMAGE =
  "https://images.pexels.com/photos/18999484/pexels-photo-18999484.jpeg?auto=compress&cs=tinysrgb&w=1400";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, delay, ease },
});

export default function Hero() {
  const { t } = useLang();
  const h = t.hero;

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate overflow-clip bg-white pb-24 pt-28 sm:pb-28 sm:pt-40 lg:pb-32"
    >
      {/* Fond : trame bleue + halos bleu et jaune */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-grid absolute inset-0" />
        <div className="animate-blob absolute -left-32 -top-24 h-[30rem] w-[30rem] rounded-full bg-brand-200/70 blur-3xl" />
        <div className="animate-blob absolute -right-24 top-24 h-[26rem] w-[26rem] rounded-full bg-sun-200/80 blur-3xl [animation-delay:-7s]" />
      </div>

      <div className="container-x grid items-center gap-12 sm:gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* Texte */}
        <div className="text-center lg:text-start">
          <motion.a
            href="#programmes"
            {...fadeUp(0)}
            className="group inline-flex max-w-full items-center gap-2.5 rounded-full border border-brand-100 bg-white/90 py-1.5 pe-4 ps-1.5 text-xs font-semibold text-brand-900 shadow-sm backdrop-blur transition-all hover:border-brand-200 hover:shadow-md sm:text-sm"
          >
            <span className="shrink-0 rounded-full bg-sun-400 px-2.5 py-0.5 text-xs font-extrabold text-brand-950">
              {h.badgeTag}
            </span>
            <span className="truncate">{h.badge}</span>
            <ArrowFwd className="h-4 w-4 shrink-0 text-brand-600" />
          </motion.a>

          <motion.h1
            id="hero-title"
            {...fadeUp(0.08)}
            className="mt-7 text-balance font-display text-[2.35rem] font-extrabold leading-[1.12] tracking-tight text-brand-950 sm:text-6xl lg:text-[4rem] lg:leading-[1.08]"
          >
            {h.titleA} <span className="text-brand-600">{h.titleAccent}</span>
            {h.titleB ? ` ${h.titleB}` : ""} <Marker>{h.titleMark}</Marker> {h.titleC}
          </motion.h1>

          <motion.p
            {...fadeUp(0.16)}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0"
          >
            {h.subtitle}
          </motion.p>

          <motion.div
            {...fadeUp(0.24)}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <a href="#contact" className="btn btn-primary group w-full sm:w-auto">
              {h.ctaPrimary}
              <ArrowFwd className="h-4 w-4" />
            </a>
            <a href="#formations" className="btn btn-outline w-full sm:w-auto">
              {h.ctaSecondary}
            </a>
          </motion.div>

          <motion.ul
            {...fadeUp(0.32)}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-brand-900 lg:justify-start"
          >
            {h.points.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sun-400 text-brand-950">
                  <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Visuel — sur mobile, les cartes flottantes deviennent un bloc statique sous l'image */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease }}
          className="relative mx-auto mt-2 w-full max-w-md px-1 sm:max-w-lg sm:px-0 lg:mt-0 lg:max-w-none"
        >
          <div aria-hidden="true" className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-sun-400 sm:h-40 sm:w-40" />
          <div
            aria-hidden="true"
            className="absolute -right-2 -top-2 h-full w-full rounded-[2rem] border-2 border-dashed border-brand-300 sm:-right-5 sm:-top-5"
          />
          <div aria-hidden="true" className="bg-dots absolute -right-8 bottom-12 hidden h-24 w-24 text-brand-300 sm:block" />

          <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-brand-100 shadow-2xl shadow-brand-900/20">
            <img
              src={HERO_IMAGE}
              alt={h.imgAlt}
              fetchPriority="high"
              className="aspect-[4/3] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/40 via-transparent to-transparent" />
            <span className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-brand-900 shadow-md">
              <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              {h.locationBadge}
            </span>
          </div>

          {/* Carte flottante ENA — à l'intérieur de l'image sur mobile */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease }}
            className="absolute left-3 top-3 z-10 sm:left-auto sm:-start-6 sm:top-8"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="glass flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sun-400 text-brand-950 sm:h-10 sm:w-10">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="text-start">
                <p className="text-sm font-bold text-brand-950">{h.enaTitle}</p>
                <p className="text-xs font-medium text-slate-500">{h.enaSubtitle}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Carte flottante des domaines — desktop / tablette uniquement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease }}
            className="absolute -bottom-10 end-0 hidden w-[15.5rem] sm:block lg:-end-6"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="glass rounded-2xl p-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600 eyebrow">
                {h.domainsLabel}
              </p>
              <ul className="mt-3 space-y-2">
                {h.heroDomains.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm font-semibold text-brand-950">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Version mobile : domaines en bloc statique sous l'image, jamais par-dessus */}
          <div className="glass mt-4 rounded-2xl p-4 sm:hidden">
            <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
              {h.domainsLabel}
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              {h.heroDomains.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm font-semibold text-brand-950">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="leading-tight">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
