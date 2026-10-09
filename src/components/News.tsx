import { ArrowUpRight } from "lucide-react";
import { contact } from "../constants/content";
import { useLang } from "../i18n/LanguageContext";
import { FacebookIcon, Reveal, SectionHeading } from "./ui";

export default function News() {
  const { t } = useLang();
  const s = t.news;

  return (
    <section id="actualites" aria-labelledby="actualites-title" className="relative bg-brand-50 py-20 sm:py-24 lg:py-32">
      <div className="container-x">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow={s.eyebrow}
            id="actualites-title"
            title={
              <>
                {s.titlePre} <span className="text-brand-600">{s.titleAccent}</span>
              </>
            }
            description={s.desc}
          />
          <Reveal delay={0.15} className="shrink-0">
            <a
              href={contact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/25 hover:-translate-y-0.5 hover:bg-[#166FE5] max-sm:w-full"
            >
              <FacebookIcon className="h-5 w-5 shrink-0" />
              {s.followFb}
              <span className="sr-only">{s.newTab}</span>
            </a>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
          {s.posts.map(({ image, tag, title, excerpt }, index) => (
            <Reveal key={title} delay={index * 0.1} className="h-full">
              <a
                href={contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-brand-100">
                  <img
                    src={image.src}
                    alt={image.alt}
                    width={1200}
                    height={627}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/15 to-transparent"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-900 shadow-sm rtl:left-auto rtl:right-4">
                    {tag}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-lg font-bold leading-snug text-brand-950">{title}</h3>
                  {excerpt && <p className="mt-3 text-sm leading-relaxed text-slate-600">{excerpt}</p>}
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-bold text-brand-600">
                    {s.viewFb}
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{s.newTab}</span>
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
