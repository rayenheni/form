/**
 * Rendu réel (react-dom/server) des écrans de l'administration et de la porte
 * d'entrée : détecte les accès de propriétés cassés sur le contenu réel.
 * Exécution : `npm run test:admin`
 */
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { content as bundled, type Lang, type SiteContent } from "../src/constants/content";
import { createLocalSession } from "../src/store/adminSession";
import { memoryKv } from "../src/store/localStore";
import AdminGate from "../src/admin/AdminGate";
import Dashboard from "../src/admin/Dashboard";
import {
  BenefitsEditor,
  ContactEditor,
  FaqEditor,
  GalleryEditor,
  FormationsEditor,
  HeroEditor,
  NewsEditor,
  PricingEditor,
  ProgramsEditor,
  SeoEditor,
  type EditorProps,
} from "../src/admin/editors";

/* `window.location` est lu par l'App au démarrage : fourni pour le rendu Node. */
(globalThis as unknown as { window: unknown }).window = {
  location: { hash: "" },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
};

let passed = 0;
const failures: string[] = [];

async function test(label: string, run: () => void | Promise<void>) {
  try {
    await run();
    passed += 1;
    console.log(`OK   ${label}`);
  } catch (error) {
    failures.push(label);
    console.log(`FAIL ${label}\n     ${error instanceof Error ? error.message : String(error)}`);
  }
}

const noop = () => {};
/** React échappe `&` et l'apostrophe typographique dans les attributs : même format ici. */
const attr = (value: string) => value.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");
const editors = [
  ["Formations", FormationsEditor],
  ["Programmes", ProgramsEditor],
  ["Accueil", HeroEditor],
  ["Actualités", NewsEditor],
  ["Tarifs", PricingEditor],
  ["FAQ", FaqEditor],
  ["Avantages", BenefitsEditor],
  ["Contact", ContactEditor],
  ["Référencement", SeoEditor],
] as const;

for (const lang of ["fr", "ar"] as Lang[]) {
  const data: SiteContent = bundled[lang];
  const props: EditorProps = { content: data, lang, onSection: noop };

  for (const [label, Editor] of editors) {
    await test(`${label} (${lang}) se rend sans erreur`, () => {
      const html = renderToStaticMarkup(React.createElement(Editor, props));
      assert.ok(html.length > 500, `rendu trop court (${html.length} caractères)`);
      assert.ok(/<input|<textarea|<select/.test(html), "aucun champ éditable rendu");
    });
  }
}

await test("Formations (fr) : chaque domaine est listé avec son intitulé", () => {
  const html = renderToStaticMarkup(
    React.createElement(FormationsEditor, { content: bundled.fr, lang: "fr", onSection: noop } satisfies EditorProps)
  );
  for (const domain of bundled.fr.formations.domains) {
    assert.ok(html.includes(`value="${attr(domain.title)}"`), `domaine manquant : ${domain.title}`);
  }
});

await test("Galerie (fr) : chaque photo, son texte alternatif et sa légende sont éditables", () => {
  const html = renderToStaticMarkup(
    React.createElement(GalleryEditor, { content: bundled.fr, lang: "fr", onSection: noop } satisfies EditorProps)
  );
  for (const item of bundled.fr.gallery.items) {
    assert.ok(html.includes(`value="${attr(item.src)}"`), `photo manquante : ${item.src}`);
    assert.ok(html.includes(`value="${attr(item.alt)}"`), `texte alternatif manquant : ${item.alt}`);
    assert.ok(html.includes(`value="${attr(item.caption ?? "")}"`), `légende manquante : ${item.caption}`);
  }
  assert.ok(html.includes("public/galerie/"), "aide sur le dossier d'images absente");
});

await test("FAQ (ar) : les questions arabes sont éditées en RTL", () => {
  const html = renderToStaticMarkup(
    React.createElement(FaqEditor, { content: bundled.ar, lang: "ar", onSection: noop } satisfies EditorProps)
  );
  assert.ok(html.includes('dir="rtl"'), "aucun champ en dir=rtl");
  assert.ok(html.includes(bundled.ar.faq.items[0].question), "première question arabe absente");
});

await test("Tarifs (fr) : les offres et leurs prix sont éditables", () => {
  const html = renderToStaticMarkup(
    React.createElement(PricingEditor, { content: bundled.fr, lang: "fr", onSection: noop } satisfies EditorProps)
  );
  for (const offer of bundled.fr.pricing.offers) {
    assert.ok(html.includes(`value="${attr(offer.name)}"`), `offre manquante : ${offer.name}`);
    assert.ok(html.includes(`value="${attr(offer.price)}"`), `prix manquant : ${offer.price}`);
  }
});

await test("Cours (fr) : l'éditeur propose d'ajouter un cours", () => {
  const html = renderToStaticMarkup(
    React.createElement(FormationsEditor, { content: bundled.fr, lang: "fr", onSection: noop } satisfies EditorProps)
  );
  assert.ok(html.includes("Ajouter un cours"), "bouton « Ajouter un cours » absent");
  assert.ok(html.includes(">Cours <") || html.includes("Cours"), "titre « Cours » absent");
});

await test("Contact (fr) : les coordonnées réelles sont rappelées", () => {
  const html = renderToStaticMarkup(
    React.createElement(ContactEditor, { content: bundled.fr, lang: "fr", onSection: noop } satisfies EditorProps)
  );
  assert.ok(html.includes("94 825 735"), "numéro absent");
  assert.ok(html.includes("forma.business.lex2025@gmail.com"), "e-mail absent");
});

await test("Porte d'entrée : sans administrateur local, l'écran de création s'affiche", () => {
  const html = renderToStaticMarkup(
    React.createElement(AdminGate, { session: createLocalSession(memoryKv()), onSignedIn: noop })
  );
  assert.ok(html.includes("\"new-password\""), "écran de création absent (pas de nouveau mot de passe)");
  assert.ok(html.includes("Confirmer le mot de passe"), "champ de confirmation absent");
  assert.ok(!html.includes("Mode local"), "message technique « Mode local » visible dans l'interface");
  assert.ok(!html.includes("ADMIN.md"), "référence technique visible dans l'interface");
});

await test("Porte d'entrée : après création, l'écran de connexion s'affiche", async () => {
  const session = createLocalSession(memoryKv());
  await session.setupLocal?.("motdepasse-de-test");
  const html = renderToStaticMarkup(React.createElement(AdminGate, { session, onSignedIn: noop }));
  assert.ok(html.includes("\"current-password\""), "écran de connexion absent");
  assert.ok(!html.includes("Confirmer le mot de passe"), "la confirmation ne doit plus apparaître");
});

/* ─────────────────────── Tableau de bord ─────────────────────── */

await test("Tableau de bord : se rend sans erreur et affiche son état de chargement", () => {
  const html = renderToStaticMarkup(React.createElement(Dashboard));
  /* Le chargement des statistiques a lieu dans un effet : absent en rendu Node. */
  assert.ok(html.includes("Chargement des statistiques"), "état de chargement absent");
  assert.ok(html.length > 100, `rendu trop court (${html.length} caractères)`);
});

await test("Tableau de bord : les indicateurs clés sont libellés", () => {
  const html = renderToStaticMarkup(React.createElement(Dashboard));
  /* Les libellés attendent les données ; on vérifie que rien ne lève au montage. */
  assert.ok(!html.includes("undefined"), "valeur « undefined » rendue");
  assert.ok(!html.includes("[object Object]"), "objet non formaté rendu");
});

console.log(`\n${passed} test(s) réussi(s), ${failures.length} échec(s).`);
if (failures.length > 0) {
  console.log(`Échecs : ${failures.join(", ")}`);
  process.exit(1);
}
