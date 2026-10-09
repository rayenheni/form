import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "../utils/cn";
import { useLang } from "../i18n/LanguageContext";
import { ArrowFwd, LanguageSwitcher, Logo, ease } from "./ui";

export default function Navbar() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });

  // Effet « verre » une fois la page défilée
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Met en évidence la section visible
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
    if (!sections.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Menu mobile : bloque le défilement et se ferme avec Échap
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="absolute inset-x-0 top-0 h-[3px] origin-left bg-gradient-to-r from-brand-600 via-brand-500 to-sun-400 rtl:origin-right"
      />

      <div className={cn("px-3 transition-[padding] duration-500 sm:px-6", scrolled ? "pt-3" : "pt-5")}>
        <nav
          aria-label={t.navAria}
          className={cn(
            "relative z-50 mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-2xl px-3 py-2.5 transition-all duration-500 sm:px-5",
            scrolled || open ? "glass" : "border border-transparent"
          )}
        >
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {t.navLinks.map((link) => {
              const isActive = active === link.href;
              return (
                <li key={link.href} className="relative">
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-brand-50 ring-1 ring-brand-100"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <a
                    href={link.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative block whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300",
                      isActive ? "text-brand-700" : "text-slate-600 hover:text-brand-700"
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <a href="#contact" className="btn btn-primary group hidden px-5 py-2.5 text-sm sm:inline-flex">
              {t.navCta}
              <ArrowFwd className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.menuClose : t.menuOpen}
              className="grid h-11 w-11 place-items-center rounded-xl text-brand-950 transition-colors hover:bg-brand-50 lg:hidden"
            >
              {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-brand-950/25 backdrop-blur-sm lg:hidden"
          />
        )}
        {open && (
          <motion.div
            key="panel"
            id="mobile-menu"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease }}
            className="fixed inset-x-3 top-[5.5rem] z-50 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-3xl border border-brand-100 bg-white p-3 shadow-2xl shadow-brand-950/10 sm:inset-x-6 lg:hidden"
          >
            <div className="flex items-center justify-between px-2 pb-2 pt-1 md:hidden">
              <LanguageSwitcher />
            </div>
            <ul>
              {t.navLinks.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.04, duration: 0.3, ease }}
                >
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-semibold text-brand-950 transition-colors hover:bg-brand-50"
                  >
                    {link.label}
                    <ArrowFwd className="h-4 w-4 text-brand-600" />
                  </a>
                </motion.li>
              ))}
            </ul>
            <a href="#contact" onClick={() => setOpen(false)} className="btn btn-sun group mt-2 w-full">
              {t.navCta}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
