import { ShieldCheck } from "lucide-react";
import { ADMIN_PATH } from "../store";

/**
 * Onglet flottant d'accès à l'administration, fixé sur le bord de l'écran et
 * toujours visible (même en défilant). Contrairement au lien discret du pied de
 * page, il ne peut pas passer inaperçu.
 *
 * N'existe que si un chemin d'administration est défini — or `ADMIN_PATH` a un
 * repli commité (`DEFAULT_ADMIN_PATH`), donc l'onglet est présent dans tout build,
 * y compris les aperçus construits sans `.env.local`.
 */
export default function AdminTab() {
  if (!ADMIN_PATH) return null;

  return (
    <a
      href={`#/${ADMIN_PATH}`}
      className="group fixed end-0 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-2 rounded-s-2xl bg-brand-950 px-2.5 py-4 text-white shadow-2xl shadow-brand-950/30 transition-all duration-300 hover:bg-brand-600 hover:pe-1.5"
      aria-label="Ouvrir l'administration"
    >
      <ShieldCheck className="h-5 w-5 text-sun-400" aria-hidden="true" />
      <span
        className="text-xs font-extrabold uppercase tracking-[0.18em]"
        style={{ writingMode: "vertical-rl" }}
      >
        Administration
      </span>
    </a>
  );
}
