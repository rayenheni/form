import { useEffect, useState } from "react";
import { useLang } from "../i18n/LanguageContext";
import { cn } from "../utils/cn";
import { ArrowFwd } from "./ui";

/** Barre d'action flottante (mobile) : visible après le héros, masquée près du formulaire. */
export default function MobileCTA() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.8;
      const contactSection = document.getElementById("contact");
      const nearContact = contactSection
        ? contactSection.getBoundingClientRect().top < window.innerHeight
        : false;
      setVisible(pastHero && !nearContact);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 transition-all duration-500 lg:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      )}
    >
      <a
        href="#contact"
        tabIndex={visible ? 0 : -1}
        className="glass group flex items-center justify-between gap-3 rounded-2xl p-2 ps-4"
      >
        <span className="truncate text-sm font-bold text-brand-950">{t.mobileCta.text}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white">
          {t.mobileCta.cta}
          <ArrowFwd className="h-4 w-4" />
        </span>
      </a>
    </div>
  );
}
