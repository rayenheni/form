import { useLang } from "../i18n/LanguageContext";
import { Reveal } from "./ui";

export default function TrustBar() {
  const { t } = useLang();
  const { highlights, audiences, audiencesLabel, ariaLabel } = t.trust;

  return (
    <section aria-label={ariaLabel} className="relative bg-white pb-20 pt-14 sm:pb-24 sm:pt-16">
      <div className="container-x">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 0.08} className="h-full">
              <div className="group flex h-full items-start gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-sun-300 hover:shadow-card-hover">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25 transition-all duration-300 group-hover:-rotate-6 group-hover:bg-sun-400 group-hover:text-brand-950 group-hover:shadow-sun-500/30">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-base font-bold text-brand-950">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-14 text-center text-sm font-semibold text-slate-500 sm:mt-16">{audiencesLabel}</p>
        <p className="sr-only">{audiences.join(", ")}.</p>
      </div>

      {/* Défilement continu des publics visés */}
      <div
        aria-hidden="true"
        className="group relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
      >
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 gap-3 pe-3">
              {audiences.map((audience) => (
                <li
                  key={`${copy}-${audience}`}
                  className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-brand-100 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-900"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-sun-400" />
                  {audience}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
