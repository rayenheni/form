import { Check } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";
import { cn } from "../utils/cn";
import { ArrowFwd, Marker, Reveal, SectionHeading } from "./ui";

interface PricingProps {
  onRequest: (interest: string) => void;
}

export default function Pricing({ onRequest }: PricingProps) {
  const { t } = useLang();
  const s = t.pricing;

  return (
    <section id="formules" aria-labelledby="formules-title" className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-32">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0" />

      <div className="container-x relative">
        <SectionHeading
          align="center"
          eyebrow={s.eyebrow}
          id="formules-title"
          title={
            <>
              {s.titlePre} <Marker>{s.titleMark}</Marker>
            </>
          }
          description={s.desc}
        />

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:mt-16 lg:grid-cols-3 lg:items-center">
          {s.offers.map((offer, index) => {
            const Icon = offer.icon;
            const featured = Boolean(offer.highlighted);
            return (
              <Reveal key={offer.name} delay={index * 0.1} className={cn(featured && "max-lg:order-first")}>
                <article
                  className={cn(
                    "relative flex h-full flex-col rounded-[1.75rem] p-7 transition-all duration-500 hover:-translate-y-1 sm:rounded-[2rem] sm:p-9",
                    featured
                      ? "on-blue bg-gradient-to-b from-brand-600 to-brand-800 text-white shadow-2xl shadow-brand-700/30 lg:py-12"
                      : "border border-brand-100 bg-white shadow-card hover:shadow-card-hover"
                  )}
                >
                  {featured && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-sun-400 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-950 shadow-lg shadow-sun-500/30 eyebrow">
                      {s.featuredBadge}
                    </span>
                  )}

                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                      featured ? "bg-white/15 text-sun-300 ring-1 ring-white/20" : "bg-brand-50 text-brand-600"
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>

                  <h3 className={cn("mt-6 font-display text-2xl font-extrabold", featured ? "text-white" : "text-brand-950")}>
                    {offer.name}
                  </h3>
                  <p className={cn("mt-2 text-sm leading-relaxed", featured ? "text-white/80" : "text-slate-600")}>
                    {offer.tagline}
                  </p>

                  <p className={cn("mt-7 font-display text-3xl font-extrabold", featured ? "text-sun-300" : "text-brand-950")}>
                    {offer.price}
                  </p>
                  <p className={cn("mt-1 text-xs font-medium", featured ? "text-white/70" : "text-slate-500")}>
                    {offer.priceNote}
                  </p>

                  <ul className="mt-7 flex-1 space-y-3">
                    {offer.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <span
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                            featured ? "bg-sun-400 text-brand-950" : "bg-brand-600 text-white"
                          )}
                        >
                          <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
                        </span>
                        <span className={featured ? "text-white/90" : "text-slate-700"}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => onRequest(offer.interest)}
                    className={cn("btn group mt-8 w-full", featured ? "btn-sun" : "btn-primary")}
                  >
                    {offer.cta}
                    <ArrowFwd className="h-4 w-4" />
                  </button>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500 sm:mt-12">{s.footnote}</p>
        </Reveal>
      </div>
    </section>
  );
}
