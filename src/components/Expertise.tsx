import { useLang } from "../i18n/LanguageContext";
import { cn } from "../utils/cn";
import { ArrowFwd, ContentIcon, Reveal, SectionHeading, SpotlightCard } from "./ui";

interface ExpertiseProps {
  onRequest: (interest: string) => void;
}

export default function Expertise({ onRequest }: ExpertiseProps) {
  const { t } = useLang();
  const s = t.formations;

  // La dernière carte complète la rangée : les domaines « featured » occupent
  // 2 colonnes en lg, on calcule donc l'empreinte réelle de la grille pour
  // éviter un trou en fin de liste (quel que soit le nombre de cours).
  const domains = s.domains;
  const lastIndex = domains.length - 1;
  const unitsBeforeLast = domains
    .slice(0, lastIndex)
    .reduce((total, domain) => total + (domain.featured ? 2 : 1), 0);
  const neededLg = unitsBeforeLast % 3 === 0 ? 3 : unitsBeforeLast % 3 === 1 ? 2 : 1;
  const lastLgSpan = Math.max(domains[lastIndex]?.featured ? 2 : 1, neededLg);
  const lastMdSpan = lastIndex >= 0 && lastIndex % 2 === 0 ? 2 : 1;
  const lastWide = lastLgSpan === 3;

  return (
    <section
      id="formations"
      aria-labelledby="formations-title"
      className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-brand-50/60 to-white py-20 sm:py-24 lg:py-32"
    >
      <div className="container-x">
        <div className="grid items-end gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionHeading
            eyebrow={s.eyebrow}
            id="formations-title"
            title={
              <>
                {s.titlePre} <span className="text-brand-600">{s.titleAccent}</span>
              </>
            }
          />
          <Reveal delay={0.15}>
            <p className="max-w-md text-base leading-relaxed text-slate-600 lg:ms-auto">{s.sideDesc}</p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain, index) => {
            const isLast = index === lastIndex;
            const wide = isLast && lastWide;
            return (
              <Reveal
                key={domain.title}
                delay={(index % 3) * 0.08}
                className={cn(
                  "h-full",
                  domain.featured && "lg:col-span-2",
                  isLast && lastMdSpan === 2 && "md:col-span-2",
                  isLast && !domain.featured && lastLgSpan === 2 && "lg:col-span-2",
                  isLast && lastLgSpan === 3 && "lg:col-span-3"
                )}
              >
                <SpotlightCard className="h-full p-6 sm:p-7 lg:p-8">
                  {(domain.featured || wide) && (
                    <ContentIcon
                      name={domain.icon}
                      strokeWidth={1.2}
                      className="pointer-events-none absolute -bottom-12 -end-12 h-52 w-52 text-brand-50 transition-transform duration-700 group-hover:-rotate-12 group-hover:scale-110"
                    />
                  )}
                  <div
                    className={cn(
                      "relative flex h-full flex-col",
                      wide && "lg:flex-row lg:items-center lg:gap-10"
                    )}
                  >
                    <div className={cn("flex flex-col", wide && "lg:flex-1")}>
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-all duration-500 group-hover:-rotate-6 group-hover:bg-sun-400 group-hover:text-brand-950 group-hover:ring-sun-300">
                          <ContentIcon name={domain.icon} className="h-7 w-7" />
                        </span>
                        {domain.badge && (
                          <span className="shrink-0 rounded-full bg-sun-100 px-3 py-1 text-xs font-bold text-brand-950 ring-1 ring-sun-200">
                            {domain.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-6 font-display text-xl font-bold text-brand-950 sm:text-2xl">
                        {domain.title}
                      </h3>
                      <p
                        className={cn(
                          "mt-3 text-[15px] leading-relaxed text-slate-600",
                          domain.featured && "max-w-lg",
                          wide && "lg:max-w-xl"
                        )}
                      >
                        {domain.description}
                      </p>

                      <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${s.themesLabel} ${domain.title}`}>
                        {domain.tags.map((tag) => (
                          <li key={tag} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRequest(domain.interest)}
                      className={cn(
                        "group mt-auto inline-flex w-fit items-center gap-2 rounded-lg pt-7 text-sm font-bold text-brand-600 transition-colors hover:text-brand-800",
                        wide && "lg:mt-0 lg:shrink-0 lg:pt-0"
                      )}
                    >
                      {s.cta}
                      <ArrowFwd className="h-4 w-4" />
                    </button>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
