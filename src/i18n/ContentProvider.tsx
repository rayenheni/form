import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { content as bundled, type Lang, type SiteContent } from "../constants/content";
import { resolveContent } from "../store";

interface ContentContextValue {
  content: Record<Lang, SiteContent>;
  /** « base » = contenu intégré au build, « live » = contenu publié en base. */
  source: "base" | "live";
}

const ContentContext = createContext<ContentContextValue>({
  content: bundled,
  source: "base",
});

/**
 * Fournit le contenu du site : contenu intégré au build par défaut, remplacé par
 * le contenu publié dès qu'il est disponible. Une erreur de réseau laisse le site
 * sur son contenu intégré (jamais de page vide).
 */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Record<Lang, SiteContent>>(bundled);
  const [source, setSource] = useState<"base" | "live">("base");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([resolveContent("fr"), resolveContent("ar")]).then(([fr, ar]) => {
      if (!active) return;
      setContent({ fr, ar });
      const live =
        JSON.stringify(fr) !== JSON.stringify(bundled.fr) || JSON.stringify(ar) !== JSON.stringify(bundled.ar);
      setSource(live ? "live" : "base");
    });
    return () => {
      active = false;
    };
  }, [nonce]);

  useEffect(() => {
    /* L'administration signale chaque publication : on recharge le contenu. */
    const refresh = () => setNonce((value) => value + 1);
    window.addEventListener("fbl-content-updated", refresh);
    return () => window.removeEventListener("fbl-content-updated", refresh);
  }, []);

  return <ContentContext.Provider value={{ content, source }}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}
