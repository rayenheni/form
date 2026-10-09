import { useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "../utils/cn";
import { useLang } from "../i18n/LanguageContext";

/** Courbe d'animation commune (douce, type « expo out »). */
export const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ───────────────────────── Apparition au défilement ───────────────────────── */
interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── Surligneur jaune animé ───────────────────────── */
export function Marker({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  return (
    <span ref={ref} className={cn("marker", inView && "marker-on", className)}>
      {children}
    </span>
  );
}

/* ───────────────────────── Flèche directionnelle (FR ⇄ AR) ─────────────────────────
 * Pointe à droite en français, à gauche en arabe, avec le bon sens de survol.
 */
export function ArrowFwd({ className }: { className?: string }) {
  const { lang } = useLang();
  const rtl = lang === "ar";
  const Icon = rtl ? ArrowLeft : ArrowRight;
  return (
    <Icon
      aria-hidden="true"
      className={cn(
        "transition-transform duration-300",
        rtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1",
        className
      )}
    />
  );
}

/* ───────────────────────── Sélecteur de langue FR / عربي ───────────────────────── */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div
      role="group"
      aria-label={t.langLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-brand-200 bg-white p-1 shadow-sm",
        className
      )}
    >
      <button
        type="button"
        lang="fr"
        aria-pressed={lang === "fr"}
        onClick={() => setLang("fr")}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-300",
          lang === "fr" ? "bg-brand-600 text-white shadow" : "text-brand-700 hover:bg-brand-50"
        )}
      >
        FR
      </button>
      <button
        type="button"
        lang="ar"
        aria-pressed={lang === "ar"}
        onClick={() => setLang("ar")}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-300",
          lang === "ar" ? "bg-brand-600 text-white shadow" : "text-brand-700 hover:bg-brand-50"
        )}
      >
        عربي
      </button>
    </div>
  );
}

/* ───────────────────────── Titre de section ───────────────────────── */
interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  id?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  align = "left",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center", className)}>
      <Reveal>
        <span className="eyebrow inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 shadow-sm ring-1 ring-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-sun-400" aria-hidden="true" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          id={id}
          className="mt-5 font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-brand-950 sm:text-4xl lg:text-[2.85rem]"
        >
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.16}>
          <p
            className={cn(
              "mt-5 text-base leading-relaxed text-slate-600 sm:text-lg",
              centered && "mx-auto max-w-2xl"
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ───────────────────────── Carte avec halo qui suit le curseur ───────────────────────── */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      onMouseMove={handleMove}
      className={cn(
        "spotlight group relative overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover",
        className
      )}
    >
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/* ───────────────────────── Logo ───────────────────────── */
export function Logo() {
  const { lang } = useLang();
  return (
    <a
      href="#top"
      aria-label={lang === "ar" ? "فورما بيزنس لاكس — العودة إلى البداية" : "Forma Business Lex — retour à l'accueil"}
      className="group inline-flex shrink-0 items-center gap-2.5 rounded-xl"
    >
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30 transition-transform duration-500 group-hover:-rotate-6">
        <span className="font-display text-lg font-extrabold text-white">F</span>
        <span className="absolute bottom-1.5 end-1.5 h-2 w-2 rounded-full bg-sun-400" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[17px] font-extrabold tracking-tight text-brand-950">
          Forma
        </span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
          Business Lex
        </span>
      </span>
    </a>
  );
}

/* ───────────────────────── Icône Facebook ───────────────────────── */
export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.43-4.92 8.43-9.94Z" />
    </svg>
  );
}
