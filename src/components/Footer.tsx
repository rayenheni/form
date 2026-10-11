import { ArrowUp, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { contact, telHref } from "../constants/content";
import { useLang } from "../i18n/LanguageContext";
import { BUILD_LABEL } from "../constants/buildInfo";
import { ADMIN_PATH } from "../store";
import { ArrowFwd, FacebookIcon, Logo } from "./ui";

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-brand-50">
      <div aria-hidden="true" className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-sun-400" />

      <div className="container-x py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[1.4fr_1fr_0.8fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-600">{t.footer.desc}</p>
            <a
              href={contact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.footer.fbAria}
              className="mt-6 inline-grid h-10 w-10 place-items-center rounded-full bg-white text-brand-600 shadow-card ring-1 ring-brand-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-600 hover:text-white"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>
          </div>

          <nav aria-label={t.footer.formationsAria}>
            <p className="text-sm font-extrabold text-brand-950">{t.footer.colFormations}</p>
            <ul className="mt-4 space-y-2.5">
              {t.formations.domains.slice(0, 6).map((domain) => (
                <li key={domain.title}>
                  <a href="#formations" className="text-sm text-slate-600 transition-colors hover:text-brand-600">
                    {domain.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t.footer.navAria}>
            <p className="text-sm font-extrabold text-brand-950">{t.footer.colNav}</p>
            <ul className="mt-4 space-y-2.5">
              {t.navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-slate-600 transition-colors hover:text-brand-600">
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#contact" className="text-sm text-slate-600 transition-colors hover:text-brand-600">
                  {t.footer.contactLink}
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <p className="text-sm font-extrabold text-brand-950">{t.footer.colContact}</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                {t.contactUi.address}
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-start gap-2.5 break-all transition-colors hover:text-brand-600">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {contact.email}
                </a>
              </li>
              {contact.phones.map((number) => (
                <li key={number}>
                  <a
                    href={telHref(number)}
                    className="flex items-start gap-2.5 transition-colors hover:text-brand-600"
                  >
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    <span dir="ltr">{number}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-brand-100 pt-8 sm:mt-14 sm:flex-row">
          <p className="text-center text-sm text-slate-500 sm:text-start">
            {t.footer.copyright.replace("{year}", String(year))}
            <span className="ms-2 align-middle text-[10px] font-semibold text-slate-300" title="Identifiant de build">
              build {BUILD_LABEL}
            </span>
          </p>
          <a
            href="#top"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full text-sm font-bold text-brand-700 transition-colors hover:text-brand-900"
          >
            {t.footer.backTop}
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sun-400 text-brand-950 transition-transform duration-300 group-hover:-translate-y-0.5">
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </span>
          </a>
        </div>

        {/* Accès administrateur : visible uniquement si VITE_ADMIN_PATH est défini. */}
        {ADMIN_PATH && (
          <div className="mt-8 flex justify-center border-t border-brand-100 pt-8">
            <a
              href={`#/${ADMIN_PATH}`}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-950 px-5 py-2.5 text-sm font-bold text-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-600"
            >
              <ShieldCheck className="h-4 w-4 text-sun-400" aria-hidden="true" />
              Administration
              <ArrowFwd className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </a>
          </div>
        )}
      </div>
    </footer>
  );
}
