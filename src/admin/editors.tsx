import type { Benefit, Domain, Faq, FeaturedProgram, Lang, Offer, Post, SiteContent } from "../constants/content";
import { contact as siteContact, type NavLink } from "../constants/content";
import type { IconName } from "../constants/icons";
import { Field, IconPicker, ItemCard, ListEditor, TextArea, TextInput, Toggle, listHelpers } from "./fields";

/* Écrans d'édition, un par rubrique du site. */

export interface EditorProps {
  content: SiteContent;
  lang: Lang;
  /** Remplace une rubrique entière (mise à jour immuable). */
  onSection: <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => void;
}

const rtl = (lang: Lang) => (lang === "ar" ? "rtl" : undefined);

/** Mutations partagées par tous les éditeurs de listes. */
function useList<T>(key: keyof SiteContent, prop: string, props: EditorProps) {
  const section = props.content[key] as Record<string, unknown>;
  const items = ((section[prop] ?? []) as T[]).slice();
  return {
    items,
    helpers: listHelpers<T>(items, (next) =>
      props.onSection(key, { ...section, [prop]: next } as unknown as SiteContent[typeof key])
    ),
  };
}

const grid = "grid gap-4 sm:grid-cols-2";

/* ─────────────────────────── Formations ─────────────────────────── */
export function FormationsEditor(props: EditorProps) {
  const { items, helpers } = useList<Domain>("formations", "domains", props);
  const section = props.content.formations;
  const dir = rtl(props.lang);

  return (
    <div className="space-y-6">
      <div className={grid}>
        <Field label="Surtitre">
          <TextInput value={section.eyebrow} dir={dir} onChange={(v) => props.onSection("formations", { ...section, eyebrow: v })} />
        </Field>
        <Field label="Titre (début)">
          <TextInput value={section.titlePre} dir={dir} onChange={(v) => props.onSection("formations", { ...section, titlePre: v })} />
        </Field>
        <Field label="Titre (partie colorée)">
          <TextInput
            value={section.titleAccent}
            dir={dir}
            onChange={(v) => props.onSection("formations", { ...section, titleAccent: v })}
          />
        </Field>
        <Field label="Libellé des thèmes">
          <TextInput
            value={section.themesLabel}
            dir={dir}
            onChange={(v) => props.onSection("formations", { ...section, themesLabel: v })}
          />
        </Field>
      </div>
      <Field label="Texte latéral">
        <TextArea value={section.sideDesc} dir={dir} onChange={(v) => props.onSection("formations", { ...section, sideDesc: v })} />
      </Field>
      <Field label="Texte du bouton">
        <TextInput value={section.cta} dir={dir} onChange={(v) => props.onSection("formations", { ...section, cta: v })} />
      </Field>

      <ListEditor
        items={items}
        title="Cours"
        addLabel="Ajouter un cours"
        onAdd={() =>
          helpers.add({
            icon: "Sparkles" as IconName,
            title: "Nouveau cours",
            description: "",
            tags: [],
            interest: "Nouveau cours",
          })
        }
      >
        {items.map((item, index) => (
          <ItemCard
            key={index}
            index={index}
            total={items.length}
            title={item.title}
            onMove={(d) => helpers.move(index, d)}
            onDuplicate={() => helpers.duplicate(index)}
            onRemove={() => helpers.remove(index)}
          >
            <div className={grid}>
              <Field label="Intitulé">
                <TextInput value={item.title} dir={dir} onChange={(v) => helpers.update(index, { title: v })} />
              </Field>
              <Field label="Sujet du formulaire de contact" hint="Valeur proposée dans la liste « Sujet »">
                <TextInput value={item.interest} dir={dir} onChange={(v) => helpers.update(index, { interest: v })} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description">
                <TextArea value={item.description} dir={dir} onChange={(v) => helpers.update(index, { description: v })} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Mots-clés" hint="Un mot-clé par ligne">
                <TextArea
                  rows={2}
                  value={item.tags.join("\n")}
                  dir={dir}
                  onChange={(v) =>
                    helpers.update(index, {
                      tags: v.split("\n").map((tag) => tag.trim()).filter(Boolean),
                    })
                  }
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Icône">
                <IconPicker value={item.icon} onChange={(v) => helpers.update(index, { icon: v })} />
              </Field>
              <Field label="Badge (facultatif)">
                <TextInput value={item.badge ?? ""} dir={dir} onChange={(v) => helpers.update(index, { badge: v })} />
              </Field>
              <div className="flex items-end pb-1">
                <Toggle
                  checked={Boolean(item.featured)}
                  onChange={(v) => helpers.update(index, { featured: v })}
                  label="Carte mise en avant"
                />
              </div>
            </div>
          </ItemCard>
        ))}
      </ListEditor>
    </div>
  );
}

/* ─────────────────────── Programmes phares ─────────────────────── */
export function ProgramsEditor(props: EditorProps) {
  const { items, helpers } = useList<FeaturedProgram>("programs", "items", props);
  const section = props.content.programs;
  const dir = rtl(props.lang);

  return (
    <div className="space-y-6">
      <div className={grid}>
        <Field label="Surtitre">
          <TextInput value={section.eyebrow} dir={dir} onChange={(v) => props.onSection("programs", { ...section, eyebrow: v })} />
        </Field>
        <Field label="Titre (début)">
          <TextInput value={section.titlePre} dir={dir} onChange={(v) => props.onSection("programs", { ...section, titlePre: v })} />
        </Field>
        <Field label="Titre (partie colorée)">
          <TextInput
            value={section.titleMark}
            dir={dir}
            onChange={(v) => props.onSection("programs", { ...section, titleMark: v })}
          />
        </Field>
        <Field label="Libellé du bouton d'intérêt">
          <TextInput
            value={section.interested}
            dir={dir}
            onChange={(v) => props.onSection("programs", { ...section, interested: v })}
          />
        </Field>
      </div>
      <Field label="Description">
        <TextArea value={section.desc} dir={dir} onChange={(v) => props.onSection("programs", { ...section, desc: v })} />
      </Field>

      <ListEditor
        items={items}
        title="Programmes (onglets)"
        onAdd={() =>
          helpers.add({
            id: `programme-${Date.now().toString(36)}`,
            tab: "Nouveau",
            icon: "Sparkles" as IconName,
            title: "Nouveau programme",
            description: "",
            audience: "",
            format: "",
            modules: [],
            interest: "Nouveau programme",
          })
        }
      >
        {items.map((item, index) => (
          <ItemCard
            key={item.id || index}
            index={index}
            total={items.length}
            title={item.tab}
            onMove={(d) => helpers.move(index, d)}
            onDuplicate={() =>
              helpers.add({ ...JSON.parse(JSON.stringify(item)), id: `programme-${Date.now().toString(36)}` })
            }
            onRemove={() => helpers.remove(index)}
          >
            <div className={grid}>
              <Field label="Onglet (court)">
                <TextInput value={item.tab} dir={dir} onChange={(v) => helpers.update(index, { tab: v })} />
              </Field>
              <Field label="Identifiant technique" hint="Doit rester unique">
                <TextInput value={item.id} onChange={(v) => helpers.update(index, { id: v.trim() })} />
              </Field>
              <Field label="Titre">
                <TextInput value={item.title} dir={dir} onChange={(v) => helpers.update(index, { title: v })} />
              </Field>
              <Field label="Sujet du formulaire de contact">
                <TextInput value={item.interest} dir={dir} onChange={(v) => helpers.update(index, { interest: v })} />
              </Field>
              <Field label="Public visé">
                <TextInput value={item.audience} dir={dir} onChange={(v) => helpers.update(index, { audience: v })} />
              </Field>
              <Field label="Format">
                <TextInput value={item.format} dir={dir} onChange={(v) => helpers.update(index, { format: v })} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description">
                <TextArea value={item.description} dir={dir} onChange={(v) => helpers.update(index, { description: v })} />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Icône">
                <IconPicker value={item.icon} onChange={(v) => helpers.update(index, { icon: v })} />
              </Field>
              <Field label="Modules" hint="Un module par ligne">
                <TextArea
                  rows={3}
                  value={item.modules.join("\n")}
                  dir={dir}
                  onChange={(v) =>
                    helpers.update(index, { modules: v.split("\n").map((m) => m.trim()).filter(Boolean) })
                  }
                />
              </Field>
            </div>
          </ItemCard>
        ))}
      </ListEditor>
    </div>
  );
}

/* ─────────────────────────── Actualités ─────────────────────────── */
export function NewsEditor(props: EditorProps) {
  const { items, helpers } = useList<Post>("news", "posts", props);
  const section = props.content.news;
  const dir = rtl(props.lang);

  return (
    <div className="space-y-6">
      <div className={grid}>
        <Field label="Surtitre">
          <TextInput value={section.eyebrow} dir={dir} onChange={(v) => props.onSection("news", { ...section, eyebrow: v })} />
        </Field>
        <Field label="Titre (début)">
          <TextInput value={section.titlePre} dir={dir} onChange={(v) => props.onSection("news", { ...section, titlePre: v })} />
        </Field>
        <Field label="Titre (partie colorée)">
          <TextInput
            value={section.titleAccent}
            dir={dir}
            onChange={(v) => props.onSection("news", { ...section, titleAccent: v })}
          />
        </Field>
        <Field label="Libellé « Suivre sur Facebook »">
          <TextInput value={section.followFb} dir={dir} onChange={(v) => props.onSection("news", { ...section, followFb: v })} />
        </Field>
      </div>
      <Field label="Description">
        <TextArea value={section.desc} dir={dir} onChange={(v) => props.onSection("news", { ...section, desc: v })} />
      </Field>

      <ListEditor
        items={items}
        title="Publications"
        onAdd={() => helpers.add({ tag: "Actualité", title: "Nouvelle publication", excerpt: "", image: { src: "", alt: "" } })}
      >
        {items.map((item, index) => (
          <ItemCard
            key={index}
            index={index}
            total={items.length}
            title={item.title}
            onMove={(d) => helpers.move(index, d)}
            onDuplicate={() => helpers.duplicate(index)}
            onRemove={() => helpers.remove(index)}
          >
            <div className={grid}>
              <Field label="Étiquette">
                <TextInput value={item.tag} dir={dir} onChange={(v) => helpers.update(index, { tag: v })} />
              </Field>
              <Field label="Titre">
                <TextInput value={item.title} dir={dir} onChange={(v) => helpers.update(index, { title: v })} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Extrait">
                <TextArea
                  value={item.excerpt ?? ""}
                  dir={dir}
                  onChange={(v) => helpers.update(index, { excerpt: v })}
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1.6fr_1fr]">
              <Field label="URL de l'image" hint="Image hébergée (Pexels, votre site, Supabase Storage…)">
                <TextInput
                  value={item.image.src}
                  onChange={(v) => helpers.update(index, { image: { ...item.image, src: v.trim() } })}
                />
              </Field>
              <Field label="Texte alternatif">
                <TextInput
                  value={item.image.alt}
                  dir={dir}
                  onChange={(v) => helpers.update(index, { image: { ...item.image, alt: v } })}
                />
              </Field>
            </div>
            {item.image.src && (
              <img
                src={item.image.src}
                alt=""
                className="mt-3 h-32 w-full rounded-lg border border-slate-200 object-cover"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.opacity = "0.25";
                }}
              />
            )}
          </ItemCard>
        ))}
      </ListEditor>
    </div>
  );
}

/* ───────────────────────────── Tarifs ───────────────────────────── */
export function PricingEditor(props: EditorProps) {
  const { items, helpers } = useList<Offer>("pricing", "offers", props);
  const section = props.content.pricing;
  const dir = rtl(props.lang);

  return (
    <div className="space-y-6">
      <div className={grid}>
        <Field label="Surtitre">
          <TextInput value={section.eyebrow} dir={dir} onChange={(v) => props.onSection("pricing", { ...section, eyebrow: v })} />
        </Field>
        <Field label="Titre (début)">
          <TextInput value={section.titlePre} dir={dir} onChange={(v) => props.onSection("pricing", { ...section, titlePre: v })} />
        </Field>
        <Field label="Titre (partie colorée)">
          <TextInput
            value={section.titleMark}
            dir={dir}
            onChange={(v) => props.onSection("pricing", { ...section, titleMark: v })}
          />
        </Field>
        <Field label="Étiquette de l'offre mise en avant">
          <TextInput
            value={section.featuredBadge}
            dir={dir}
            onChange={(v) => props.onSection("pricing", { ...section, featuredBadge: v })}
          />
        </Field>
      </div>
      <Field label="Description">
        <TextArea value={section.desc} dir={dir} onChange={(v) => props.onSection("pricing", { ...section, desc: v })} />
      </Field>
      <Field label="Note de bas de section">
        <TextInput value={section.footnote} dir={dir} onChange={(v) => props.onSection("pricing", { ...section, footnote: v })} />
      </Field>

      <ListEditor
        items={items}
        title="Offres"
        onAdd={() =>
          helpers.add({
            icon: "Sparkles" as IconName,
            name: "Nouvelle offre",
            tagline: "",
            price: "",
            priceNote: "",
            features: [],
            cta: "Je m'inscris",
            interest: "Nouvelle offre",
          })
        }
      >
        {items.map((item, index) => (
          <ItemCard
            key={index}
            index={index}
            total={items.length}
            title={item.name}
            onMove={(d) => helpers.move(index, d)}
            onDuplicate={() => helpers.duplicate(index)}
            onRemove={() => helpers.remove(index)}
          >
            <div className={grid}>
              <Field label="Nom de l'offre">
                <TextInput value={item.name} dir={dir} onChange={(v) => helpers.update(index, { name: v })} />
              </Field>
              <Field label="Accroche">
                <TextInput value={item.tagline} dir={dir} onChange={(v) => helpers.update(index, { tagline: v })} />
              </Field>
              <Field label="Prix affiché">
                <TextInput value={item.price} dir={dir} onChange={(v) => helpers.update(index, { price: v })} />
              </Field>
              <Field label="Précision sous le prix">
                <TextInput value={item.priceNote} dir={dir} onChange={(v) => helpers.update(index, { priceNote: v })} />
              </Field>
              <Field label="Texte du bouton">
                <TextInput value={item.cta} dir={dir} onChange={(v) => helpers.update(index, { cta: v })} />
              </Field>
              <Field label="Sujet du formulaire de contact">
                <TextInput value={item.interest} dir={dir} onChange={(v) => helpers.update(index, { interest: v })} />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Icône">
                <IconPicker value={item.icon} onChange={(v) => helpers.update(index, { icon: v })} />
              </Field>
              <div className="flex items-end pb-1">
                <Toggle
                  checked={Boolean(item.highlighted)}
                  onChange={(v) => helpers.update(index, { highlighted: v })}
                  label="Offre mise en avant"
                />
              </div>
            </div>
            <div className="mt-4">
              <Field label="Ce qui est inclus" hint="Une ligne par avantage">
                <TextArea
                  rows={4}
                  value={item.features.join("\n")}
                  dir={dir}
                  onChange={(v) =>
                    helpers.update(index, { features: v.split("\n").map((f) => f.trim()).filter(Boolean) })
                  }
                />
              </Field>
            </div>
          </ItemCard>
        ))}
      </ListEditor>
    </div>
  );
}

/* ─────────────────────────────── FAQ ─────────────────────────────── */
export function FaqEditor(props: EditorProps) {
  const { items, helpers } = useList<Faq>("faq", "items", props);
  const section = props.content.faq;
  const dir = rtl(props.lang);

  return (
    <div className="space-y-6">
      <div className={grid}>
        <Field label="Surtitre">
          <TextInput value={section.eyebrow} dir={dir} onChange={(v) => props.onSection("faq", { ...section, eyebrow: v })} />
        </Field>
        <Field label="Titre (début)">
          <TextInput value={section.titlePre} dir={dir} onChange={(v) => props.onSection("faq", { ...section, titlePre: v })} />
        </Field>
        <Field label="Titre (partie colorée)">
          <TextInput
            value={section.titleAccent}
            dir={dir}
            onChange={(v) => props.onSection("faq", { ...section, titleAccent: v })}
          />
        </Field>
        <Field label="Texte du bouton">
          <TextInput value={section.cta} dir={dir} onChange={(v) => props.onSection("faq", { ...section, cta: v })} />
        </Field>
      </div>
      <Field label="Description">
        <TextArea value={section.desc} dir={dir} onChange={(v) => props.onSection("faq", { ...section, desc: v })} />
      </Field>

      <ListEditor
        items={items}
        title="Questions fréquentes"
        onAdd={() => helpers.add({ question: "Nouvelle question", answer: "" })}
      >
        {items.map((item, index) => (
          <ItemCard
            key={index}
            index={index}
            total={items.length}
            title={item.question}
            onMove={(d) => helpers.move(index, d)}
            onDuplicate={() => helpers.duplicate(index)}
            onRemove={() => helpers.remove(index)}
          >
            <Field label="Question">
              <TextInput value={item.question} dir={dir} onChange={(v) => helpers.update(index, { question: v })} />
            </Field>
            <div className="mt-4">
              <Field label="Réponse">
                <TextArea rows={4} value={item.answer} dir={dir} onChange={(v) => helpers.update(index, { answer: v })} />
              </Field>
            </div>
          </ItemCard>
        ))}
      </ListEditor>
    </div>
  );
}

/* ───────────────────────────── Avantages ───────────────────────────── */
export function BenefitsEditor(props: EditorProps) {
  const { items, helpers } = useList<Benefit>("benefits", "items", props);
  const section = props.content.benefits;
  const dir = rtl(props.lang);

  return (
    <div className="space-y-6">
      <div className={grid}>
        <Field label="Surtitre">
          <TextInput
            value={section.eyebrow}
            dir={dir}
            onChange={(v) => props.onSection("benefits", { ...section, eyebrow: v })}
          />
        </Field>
        <Field label="Titre (début)">
          <TextInput
            value={section.titlePre}
            dir={dir}
            onChange={(v) => props.onSection("benefits", { ...section, titlePre: v })}
          />
        </Field>
        <Field label="Titre (partie colorée)">
          <TextInput
            value={section.titleMark}
            dir={dir}
            onChange={(v) => props.onSection("benefits", { ...section, titleMark: v })}
          />
        </Field>
        <Field label="Titre de l'encart">
          <TextInput
            value={section.overlayTitle}
            dir={dir}
            onChange={(v) => props.onSection("benefits", { ...section, overlayTitle: v })}
          />
        </Field>
      </div>
      <Field label="Description">
        <TextArea value={section.desc} dir={dir} onChange={(v) => props.onSection("benefits", { ...section, desc: v })} />
      </Field>
      <Field label="Texte de l'encart">
        <TextArea
          value={section.overlayDesc}
          dir={dir}
          onChange={(v) => props.onSection("benefits", { ...section, overlayDesc: v })}
        />
      </Field>

      <ListEditor
        items={items}
        title="Avantages"
        onAdd={() => helpers.add({ icon: "Sparkles" as IconName, title: "Nouvel avantage", description: "" })}
      >
        {items.map((item, index) => (
          <ItemCard
            key={index}
            index={index}
            total={items.length}
            title={item.title}
            onMove={(d) => helpers.move(index, d)}
            onDuplicate={() => helpers.duplicate(index)}
            onRemove={() => helpers.remove(index)}
          >
            <div className={grid}>
              <Field label="Titre">
                <TextInput value={item.title} dir={dir} onChange={(v) => helpers.update(index, { title: v })} />
              </Field>
              <Field label="Icône">
                <IconPicker value={item.icon} onChange={(v) => helpers.update(index, { icon: v })} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description">
                <TextArea value={item.description} dir={dir} onChange={(v) => helpers.update(index, { description: v })} />
              </Field>
            </div>
          </ItemCard>
        ))}
      </ListEditor>
    </div>
  );
}

/* ───────────────────────── Héro + barre de confiance ───────────────────────── */
export function HeroEditor(props: EditorProps) {
  const hero = props.content.hero;
  const trust = props.content.trust;
  const dir = rtl(props.lang);
  const points = listHelpers<string>(hero.points, (next) => props.onSection("hero", { ...hero, points: next }));
  const domains = listHelpers(hero.heroDomains, (next) => props.onSection("hero", { ...hero, heroDomains: next }));
  const highlights = listHelpers(trust.highlights, (next) => props.onSection("trust", { ...trust, highlights: next }));
  const audiences = listHelpers<string>(trust.audiences, (next) => props.onSection("trust", { ...trust, audiences: next }));

  return (
    <div className="space-y-6">
      <div className={grid}>
        <Field label="Badge (petite étiquette)">
          <TextInput value={hero.badge} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, badge: v })} />
        </Field>
        <Field label="Étiquette du badge">
          <TextInput value={hero.badgeTag} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, badgeTag: v })} />
        </Field>
        <Field label="Titre — partie 1">
          <TextInput value={hero.titleA} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, titleA: v })} />
        </Field>
        <Field label="Titre — partie colorée">
          <TextInput value={hero.titleAccent} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, titleAccent: v })} />
        </Field>
        <Field label="Titre — partie 2">
          <TextInput value={hero.titleB} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, titleB: v })} />
        </Field>
        <Field label="Titre — marque">
          <TextInput value={hero.titleMark} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, titleMark: v })} />
        </Field>
        <Field label="Titre — partie 3">
          <TextInput value={hero.titleC} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, titleC: v })} />
        </Field>
        <Field label="Badge de localisation">
          <TextInput
            value={hero.locationBadge}
            dir={dir}
            onChange={(v) => props.onSection("hero", { ...hero, locationBadge: v })}
          />
        </Field>
      </div>
      <Field label="Sous-titre">
        <TextArea rows={3} value={hero.subtitle} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, subtitle: v })} />
      </Field>
      <div className={grid}>
        <Field label="Bouton principal">
          <TextInput value={hero.ctaPrimary} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, ctaPrimary: v })} />
        </Field>
        <Field label="Bouton secondaire">
          <TextInput
            value={hero.ctaSecondary}
            dir={dir}
            onChange={(v) => props.onSection("hero", { ...hero, ctaSecondary: v })}
          />
        </Field>
        <Field label="Encart ENA — titre">
          <TextInput value={hero.enaTitle} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, enaTitle: v })} />
        </Field>
        <Field label="Encart ENA — sous-titre">
          <TextInput value={hero.enaSubtitle} dir={dir} onChange={(v) => props.onSection("hero", { ...hero, enaSubtitle: v })} />
        </Field>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-display text-lg font-extrabold text-slate-900">Points forts du héro</h3>
          {hero.points.map((point, index) => (
            <div key={index} className="flex items-start gap-2">
              <TextInput value={point} dir={dir} onChange={(v) => points.update(index, v as never)} />
              <button
                type="button"
                onClick={() => points.remove(index)}
                className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Supprimer le point"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => points.add("Nouveau point fort")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-400 hover:text-brand-700"
          >
            + Ajouter un point
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-extrabold text-slate-900">Domaines affichés dans le héro</h3>
          {hero.heroDomains.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_1.6fr_auto] items-end gap-2">
              <IconPicker value={item.icon} onChange={(v) => domains.update(index, { icon: v })} />
              <TextInput value={item.label} dir={dir} onChange={(v) => domains.update(index, { label: v })} />
              <button
                type="button"
                onClick={() => domains.remove(index)}
                className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Supprimer le domaine"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => domains.add({ icon: "Sparkles" as IconName, label: "Nouveau domaine" })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-400 hover:text-brand-700"
          >
            + Ajouter un domaine
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-display text-lg font-extrabold text-slate-900">Bandeau de confiance — atouts</h3>
          {trust.highlights.map((item, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="grid grid-cols-[1fr_auto_auto] items-start gap-2">
                <div className="min-w-0 space-y-2">
                  <TextInput value={item.title} dir={dir} onChange={(v) => highlights.update(index, { title: v })} />
                  <TextArea rows={2} value={item.description} dir={dir} onChange={(v) => highlights.update(index, { description: v })} />
                </div>
                <div className="w-40">
                  <IconPicker value={item.icon} onChange={(v) => highlights.update(index, { icon: v })} />
                </div>
                <button
                  type="button"
                  onClick={() => highlights.remove(index)}
                  className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Supprimer l'atout"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => highlights.add({ icon: "Sparkles" as IconName, title: "Nouvel atout", description: "" })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-400 hover:text-brand-700"
          >
            + Ajouter un atout
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-extrabold text-slate-900">Publics visés</h3>
          {trust.audiences.map((audience, index) => (
            <div key={index} className="flex items-start gap-2">
              <TextInput value={audience} dir={dir} onChange={(v) => audiences.update(index, v as never)} />
              <button
                type="button"
                onClick={() => audiences.remove(index)}
                className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Supprimer le public"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => audiences.add("Nouveau public")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-400 hover:text-brand-700"
          >
            + Ajouter un public
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Contact, menu et référencement ───────────────────── */
export function ContactEditor(props: EditorProps) {
  const ui = props.content.contactUi;
  const footer = props.content.footer;
  const nav = props.content.navLinks;
  const dir = rtl(props.lang);
  const links = listHelpers<NavLink>(nav, (next) => props.onSection("navLinks", next));
  const interests = listHelpers<string>(props.content.interests, (next) => props.onSection("interests", next));
  const reassurances = listHelpers<string>(ui.reassurances, (next) =>
    props.onSection("contactUi", { ...ui, reassurances: next })
  );

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Téléphone et e-mail affichés sur le site : <strong>{siteContact.phones.join(" · ")}</strong> —{" "}
        <strong>{siteContact.email}</strong>. Ils sont définis dans <code>src/constants/content.ts</code> (section{" "}
        <code>contact</code>).
      </p>

      <div className={grid}>
        <Field label="Surtitre">
          <TextInput value={ui.eyebrow} dir={dir} onChange={(v) => props.onSection("contactUi", { ...ui, eyebrow: v })} />
        </Field>
        <Field label="Titre (début)">
          <TextInput value={ui.titlePre} dir={dir} onChange={(v) => props.onSection("contactUi", { ...ui, titlePre: v })} />
        </Field>
        <Field label="Titre (partie colorée)">
          <TextInput
            value={ui.titleAccent}
            dir={dir}
            onChange={(v) => props.onSection("contactUi", { ...ui, titleAccent: v })}
          />
        </Field>
        <Field label="Adresse affichée">
          <TextInput value={ui.address} dir={dir} onChange={(v) => props.onSection("contactUi", { ...ui, address: v })} />
        </Field>
        <Field label="Libellé Facebook">
          <TextInput value={ui.fbLabel} dir={dir} onChange={(v) => props.onSection("contactUi", { ...ui, fbLabel: v })} />
        </Field>
        <Field label="Libellé WhatsApp">
          <TextInput value={ui.waLabel} dir={dir} onChange={(v) => props.onSection("contactUi", { ...ui, waLabel: v })} />
        </Field>
        <Field label="Titre du formulaire">
          <TextInput value={ui.formTitle} dir={dir} onChange={(v) => props.onSection("contactUi", { ...ui, formTitle: v })} />
        </Field>
        <Field label="Texte du bouton d'envoi">
          <TextInput value={ui.submit} dir={dir} onChange={(v) => props.onSection("contactUi", { ...ui, submit: v })} />
        </Field>
      </div>

      <Field label="Description">
        <TextArea value={ui.desc} dir={dir} onChange={(v) => props.onSection("contactUi", { ...ui, desc: v })} />
      </Field>
      <Field label="Texte de consentement">
        <TextArea value={ui.consent} dir={dir} onChange={(v) => props.onSection("contactUi", { ...ui, consent: v })} />
      </Field>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-display text-lg font-extrabold text-slate-900">Sujets du formulaire</h3>
          {props.content.interests.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <TextInput value={item} dir={dir} onChange={(v) => interests.update(index, v as never)} />
              <button
                type="button"
                onClick={() => interests.remove(index)}
                className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Supprimer le sujet"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => interests.add("Nouveau sujet")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-400 hover:text-brand-700"
          >
            + Ajouter un sujet
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-extrabold text-slate-900">Réassurances</h3>
          {ui.reassurances.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <TextInput value={item} dir={dir} onChange={(v) => reassurances.update(index, v as never)} />
              <button
                type="button"
                onClick={() => reassurances.remove(index)}
                className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Supprimer la réassurance"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => reassurances.add("Nouvelle réassurance")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-400 hover:text-brand-700"
          >
            + Ajouter
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-extrabold text-slate-900">Menu de navigation</h3>
        {nav.map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <TextInput value={item.label} dir={dir} onChange={(v) => links.update(index, { label: v })} />
            <TextInput value={item.href} onChange={(v) => links.update(index, { href: v.trim() })} />
            <button
              type="button"
              onClick={() => links.remove(index)}
              className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Supprimer le lien"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => links.add({ label: "Nouveau lien", href: "#contact" })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-400 hover:text-brand-700"
        >
          + Ajouter un lien
        </button>
      </div>

      <div className={grid}>
        <Field label="Pied de page — description">
          <TextArea value={footer.desc} dir={dir} onChange={(v) => props.onSection("footer", { ...footer, desc: v })} />
        </Field>
        <Field label="Pied de page — mentions">
          <TextInput
            value={footer.copyright}
            dir={dir}
            onChange={(v) => props.onSection("footer", { ...footer, copyright: v })}
          />
        </Field>
      </div>
    </div>
  );
}

export function SeoEditor(props: EditorProps) {
  const meta = props.content.meta;
  const dir = rtl(props.lang);

  return (
    <div className="space-y-4">
      <Field label="Titre de la page (onglet du navigateur)">
        <TextInput value={meta.title} dir={dir} onChange={(v) => props.onSection("meta", { ...meta, title: v })} />
      </Field>
      <Field label="Titre partagé sur les réseaux">
        <TextInput value={meta.ogTitle} dir={dir} onChange={(v) => props.onSection("meta", { ...meta, ogTitle: v })} />
      </Field>
      <Field label="Description (Google, réseaux sociaux)" hint="Idéalement entre 120 et 160 caractères">
        <TextArea rows={3} value={meta.description} dir={dir} onChange={(v) => props.onSection("meta", { ...meta, description: v })} />
      </Field>
      <p className="text-xs text-slate-500">
        {meta.description.length} caractères. Le titre et la description sont appliqués au chargement de la langue.
      </p>
    </div>
  );
}
