import { ArrowUp, Mail, MapPin, Phone } from "lucide-react";
import { contact } from "../constants/content";
import { useLang } from "../i18n/LanguageContext";
import { FacebookIcon, Logo } from "./ui";

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
              {contact.phone && (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="flex items-start gap-2.5 transition-colors hover:text-brand-600"
                  >
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    <span dir="ltr">{contact.phone}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-brand-100 pt-8 sm:mt-14 sm:flex-row">
          <p className="text-center text-sm text-slate-500 sm:text-start">
            {t.footer.copyright.replace("{year}", String(year))}
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
      </div>
    </footer>
  );
}
