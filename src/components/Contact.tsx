import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import { contact } from "../constants/content";
import { useLang } from "../i18n/LanguageContext";
import { submitLead, type SubmitResult } from "../lib/leads";
import { cn } from "../utils/cn";
import { ArrowFwd, FacebookIcon, Reveal } from "./ui";

type Status = "idle" | "submitting" | "error" | SubmitResult;

const FIELD_ORDER = ["name", "email", "phone", "interest", "consent"] as const;
type Field = (typeof FIELD_ORDER)[number];

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-brand-950 placeholder:text-slate-400 transition duration-200 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:bg-rose-50/60";
const labelClass = "mb-1.5 block text-sm font-semibold text-brand-950";
const errorClass = "mt-1.5 text-xs font-medium text-rose-600";

interface ContactProps {
  interest: string;
  onInterestChange: (value: string) => void;
}

export default function Contact({ interest, onInterestChange }: ContactProps) {
  const { t, lang } = useLang();
  const s = t.contactUi;
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const next: Partial<Record<Field, string>> = {};
    if (name.length < 2) next.name = s.errors.name;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = s.errors.email;
    if (phone && !/^\+?[\d\s.-]{8,20}$/.test(phone)) next.phone = s.errors.phone;
    if (!interest) next.interest = s.errors.interest;
    if (!data.get("consent")) next.consent = s.errors.consent;

    setErrors(next);
    const firstInvalid = FIELD_ORDER.find((key) => next[key]);
    if (firstInvalid) {
      const field = form.elements.namedItem(firstInvalid);
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    setStatus("submitting");
    try {
      const result = await submitLead({
        name,
        email,
        phone: phone || undefined,
        interest,
        message: message || undefined,
        source: "site-web",
        submittedAt: new Date().toISOString(),
        locale: lang,
      });
      form.reset();
      setStatus(result);
    } catch {
      setStatus("error");
    }
  };

  const done = status === "sent" || status === "mailto";

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative bg-white py-20 sm:py-24 lg:py-32">
      <div className="container-x">
        <Reveal>
          <div className="on-blue relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-5 py-12 shadow-2xl shadow-brand-900/25 sm:rounded-[2.5rem] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            <div aria-hidden="true" className="bg-grid-white absolute inset-0 -z-10" />
            <div aria-hidden="true" className="animate-blob absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-sun-400/30 blur-3xl rtl:-left-24 rtl:-right-auto" />
            <div aria-hidden="true" className="absolute -bottom-32 -left-24 -z-10 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl rtl:-right-24 rtl:-left-auto" />

            <div className="grid items-start gap-10 sm:gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              {/* Texte */}
              <div className="text-white">
                <span className="eyebrow inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sun-300 ring-1 ring-white/20">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sun-400" aria-hidden="true" />
                  {s.eyebrow}
                </span>
                <h2
                  id="contact-title"
                  className="mt-5 font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.12]"
                >
                  {s.titlePre} <span className="text-sun-300">{s.titleAccent}</span>
                </h2>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">{s.desc}</p>

                <ul className="mt-9 space-y-4">
                  <li className="flex items-center gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-sun-300 ring-1 ring-white/15">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-semibold">{s.address}</span>
                  </li>
                  <li>
                    <a href={`mailto:${contact.email}`} className="group flex items-center gap-4 rounded-xl">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-sun-300 ring-1 ring-white/15 transition-colors group-hover:bg-sun-400 group-hover:text-brand-950">
                        <Mail className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="break-all font-semibold underline-offset-4 group-hover:underline">{contact.email}</span>
                    </a>
                  </li>
                  {contact.phone && (
                    <li>
                      <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="group flex items-center gap-4 rounded-xl">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-sun-300 ring-1 ring-white/15 transition-colors group-hover:bg-sun-400 group-hover:text-brand-950">
                          <Phone className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span dir="ltr" className="font-semibold underline-offset-4 group-hover:underline">{contact.phone}</span>
                      </a>
                    </li>
                  )}
                  <li>
                    <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-xl">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-sun-300 ring-1 ring-white/15 transition-colors group-hover:bg-sun-400 group-hover:text-brand-950">
                        <FacebookIcon className="h-5 w-5" />
                      </span>
                      <span className="font-semibold underline-offset-4 group-hover:underline">{s.fbLabel}</span>
                      <span className="sr-only">{t.programs.newTab}</span>
                    </a>
                  </li>
                </ul>

                <div className="mt-9 flex flex-wrap gap-2.5">
                  {s.reassurances.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0 text-sun-300" strokeWidth={3} aria-hidden="true" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Formulaire */}
              <div aria-live="polite" className="on-light rounded-3xl bg-white p-5 shadow-2xl shadow-brand-950/30 sm:p-8">
                {done ? (
                  <div role="status" className="flex flex-col items-center py-8 text-center">
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="grid h-20 w-20 place-items-center rounded-full bg-sun-400 text-brand-950 shadow-xl shadow-sun-500/30"
                    >
                      <Check className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
                    </motion.span>
                    <h3 className="mt-6 font-display text-2xl font-extrabold text-brand-950">
                      {status === "sent" ? s.successSent : s.successMailto}
                    </h3>
                    <p className="mt-3 max-w-sm text-slate-600">
                      {status === "sent" ? (
                        s.sentDesc
                      ) : (
                        <>
                          {s.mailtoPre}{" "}
                          <a href={`mailto:${contact.email}`} className="font-semibold text-brand-600 underline underline-offset-4">
                            {contact.email}
                          </a>
                          .
                        </>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus("idle")}
                      className="mt-8 rounded-lg text-sm font-bold text-brand-600 transition-colors hover:text-brand-800"
                    >
                      {s.another}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div>
                      <h3 className="font-display text-xl font-extrabold text-brand-950 sm:text-2xl">{s.formTitle}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {s.requiredNote} <span className="font-bold text-rose-500">{s.requiredMark}</span>
                        {lang === "fr" && " sont obligatoires."}
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="lead-name" className={labelClass}>
                          {s.nameLabel} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="lead-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          placeholder={s.namePlaceholder}
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? "lead-name-error" : undefined}
                          className={fieldClass}
                        />
                        {errors.name && <p id="lead-name-error" className={errorClass}>{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="lead-phone" className={labelClass}>
                          {s.phoneLabel}
                        </label>
                        <input
                          id="lead-phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+216 …"
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={errors.phone ? "lead-phone-error" : undefined}
                          className={fieldClass}
                        />
                        {errors.phone && <p id="lead-phone-error" className={errorClass}>{errors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lead-email" className={labelClass}>
                        {s.emailLabel} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="lead-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="nom@exemple.tn"
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "lead-email-error" : undefined}
                        className={fieldClass}
                      />
                      {errors.email && <p id="lead-email-error" className={errorClass}>{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="lead-interest" className={labelClass}>
                        {s.subjectLabel} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="lead-interest"
                          name="interest"
                          value={interest}
                          onChange={(event) => onInterestChange(event.target.value)}
                          aria-invalid={Boolean(errors.interest)}
                          aria-describedby={errors.interest ? "lead-interest-error" : undefined}
                          className={cn(fieldClass, "cursor-pointer appearance-none pe-11", !interest && "text-slate-400")}
                        >
                          <option value="" disabled>
                            {s.chooseSubject}
                          </option>
                          {t.interests.map((item) => (
                            <option key={item} value={item} className="text-brand-950">
                              {item}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                      </div>
                      {errors.interest && <p id="lead-interest-error" className={errorClass}>{errors.interest}</p>}
                    </div>

                    <div>
                      <label htmlFor="lead-message" className={labelClass}>
                        {s.messageLabel} <span className="font-normal text-slate-400">{s.optional}</span>
                      </label>
                      <textarea
                        id="lead-message"
                        name="message"
                        rows={3}
                        placeholder={s.messagePlaceholder}
                        className={cn(fieldClass, "resize-none")}
                      />
                    </div>

                    <div>
                      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-600">
                        <input
                          type="checkbox"
                          name="consent"
                          aria-invalid={Boolean(errors.consent)}
                          aria-describedby={errors.consent ? "lead-consent-error" : undefined}
                          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-brand-600"
                        />
                        <span>{s.consent}</span>
                      </label>
                      {errors.consent && <p id="lead-consent-error" className={errorClass}>{errors.consent}</p>}
                    </div>

                    {status === "error" && (
                      <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {s.sendErrorPre} {contact.email}.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="btn btn-primary group w-full disabled:cursor-wait disabled:opacity-80"
                    >
                      {status === "submitting" ? (
                        <>
                          <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                            aria-hidden="true"
                          />
                          {s.submitting}
                        </>
                      ) : (
                        <>
                          {s.submit}
                          <ArrowFwd className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
