import { contact } from "../constants/content";
import type { Lang } from "../constants/content";

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  interest: string;
  message?: string;
  source: string;
  submittedAt: string;
  /** Langue du formulaire, pour localiser l'objet de l'e-mail de repli. */
  locale?: Lang;
}

/** "sent" : envoyé au serveur · "mailto" : messagerie du visiteur ouverte. */
export type SubmitResult = "sent" | "mailto";

/**
 * Transmet une demande de contact.
 *
 * - Si `VITE_LEADS_ENDPOINT` est défini (webhook CRM, Formspree, fonction serverless…),
 *   la demande est envoyée en JSON par POST.
 * - Sinon, la messagerie du visiteur s'ouvre avec la demande pré-remplie, adressée à
 *   `contact.email` : aucune demande n'est perdue silencieusement.
 */
export async function submitLead(payload: LeadPayload): Promise<SubmitResult> {
  const endpoint = import.meta.env.VITE_LEADS_ENDPOINT as string | undefined;

  if (endpoint) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Échec de l'envoi (statut ${response.status})`);
    }
    return "sent";
  }

  const isAr = payload.locale === "ar";
  const subject = isAr ? `طلب معلومات — ${payload.interest}` : `Demande d'information — ${payload.interest}`;
  const body = isAr
    ? [
        `الاسم : ${payload.name}`,
        `البريد الإلكتروني : ${payload.email}`,
        payload.phone ? `الهاتف : ${payload.phone}` : null,
        `الموضوع : ${payload.interest}`,
        payload.message ? `\nالرسالة :\n${payload.message}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : [
        `Nom : ${payload.name}`,
        `E-mail : ${payload.email}`,
        payload.phone ? `Téléphone : ${payload.phone}` : null,
        `Sujet : ${payload.interest}`,
        payload.message ? `\nMessage :\n${payload.message}` : null,
      ]
        .filter(Boolean)
        .join("\n");

  window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return "mailto";
}
