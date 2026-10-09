import { useCallback, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import Benefits from "./components/Benefits";
import Contact from "./components/Contact";
import Expertise from "./components/Expertise";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import MobileCTA from "./components/MobileCTA";
import Navbar from "./components/Navbar";
import News from "./components/News";
import Pricing from "./components/Pricing";
import Showcase from "./components/Showcase";
import TrustBar from "./components/TrustBar";
import { LanguageProvider, useLang } from "./i18n/LanguageContext";

function Site() {
  const { t, lang } = useLang();
  const [interest, setInterest] = useState("");

  // La sélection du formulaire dépend de la langue : on la réinitialise au changement.
  useEffect(() => {
    setInterest("");
  }, [lang]);

  /** Pré-sélectionne le sujet du formulaire, puis fait défiler jusqu'au contact. */
  const requestInfo = useCallback((value: string) => {
    setInterest(value);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById("contact")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.setTimeout(
      () => document.getElementById("lead-name")?.focus({ preventScroll: true }),
      reduceMotion ? 50 : 800
    );
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-sun-400 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-brand-950"
      >
        {t.skipLink}
      </a>

      <Navbar />

      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <TrustBar />
        <Expertise onRequest={requestInfo} />
        <Showcase onRequest={requestInfo} />
        <Benefits />
        <News />
        <Pricing onRequest={requestInfo} />
        <FAQ />
        <Contact interest={interest} onInterestChange={setInterest} />
      </main>

      <Footer />
      <MobileCTA />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <Site />
      </LanguageProvider>
    </MotionConfig>
  );
}
