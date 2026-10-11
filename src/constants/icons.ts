import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  Briefcase,
  Building,
  CalendarClock,
  Compass,
  GraduationCap,
  Landmark,
  Laptop,
  Layers,
  MapPin,
  MessageSquare,
  Presentation,
  Receipt,
  Rocket,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * Registre des icônes disponibles.
 *
 * Le contenu du site doit être sérialisable en JSON (base de données Supabase) :
 * on stocke donc le **nom** de l'icône, jamais le composant React. Ce registre
 * fait le lien entre le nom stocké et le composant rendu.
 */
export const ICONS = {
  Award,
  BookOpen,
  Briefcase,
  Building,
  CalendarClock,
  Compass,
  GraduationCap,
  Landmark,
  Laptop,
  Layers,
  MapPin,
  MessageSquare,
  Presentation,
  Receipt,
  Rocket,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** Icône de repli si un nom inconnu arrive depuis la base. */
export const DEFAULT_ICON: IconName = "Sparkles";

/** Noms triés, pour les sélecteurs de l'administration. */
export const ICON_NAMES = Object.keys(ICONS).sort((a, b) => a.localeCompare(b)) as IconName[];

export function isIconName(value: unknown): value is IconName {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(ICONS, value);
}

/** Convertit une valeur venant de la base en nom d'icône sûr. */
export function toIconName(value: unknown, fallback: IconName = DEFAULT_ICON): IconName {
  return isIconName(value) ? value : fallback;
}

/** Résout un nom d'icône en composant React (repli sur `DEFAULT_ICON`). */
export function resolveIcon(name: unknown): LucideIcon {
  return ICONS[toIconName(name)];
}
