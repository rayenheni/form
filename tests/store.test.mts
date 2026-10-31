/**
 * Tests de la couche contenu/administration.
 * Exécution : `npm run test:store` (esbuild + node, sans dépendance de test).
 */
import assert from "node:assert/strict";
import { content as bundled, type SiteContent } from "../src/constants/content";
import { DEFAULT_ICON, ICON_NAMES } from "../src/constants/icons";
import { createLocalStore, memoryKv } from "../src/store/localStore";
import { createSupabaseStore } from "../src/store/supabaseStore";
import { createLocalSession, isAdminPath, isAdminRoute } from "../src/store/adminSession";
import { coerceIcons, mergeContent } from "../src/store";
import { isDiagnosticRequested } from "../src/diagnostics/DiagnosticPanel";
import { cloneContent, hasChanges } from "../src/store/types";
import { createFakeSupabase } from "./fakeSupabase";

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

const fr = () => cloneContent(bundled.fr);

/* Matières officielles de la préparation au concours ENA. */
const ENA_SUBJECTS = {
  fr: [
    "Méthodologie juridique",
    "Anglais",
    "Droit constitutionnel",
    "Droit administratif",
    "Finances publiques",
    "Droit international public",
    "Droit fiscal",
  ],
  ar: [
    "المنهجية القانونية",
    "اللغة الإنجليزية",
    "القانون الدستوري",
    "القانون الإداري",
    "المالية العمومية",
    "القانون الدولي العام",
    "القانون الجبائي",
  ],
} as const;

await test("Contenu : le programme ENA couvre les sept matières du concours (FR et AR)", () => {
  for (const lang of ["fr", "ar"] as const) {
    const program = bundled[lang].programs.items.find((item) => item.id === "ena");
    assert.ok(program, `programme ENA absent en ${lang}`);
    assert.deepEqual(program.modules, [...ENA_SUBJECTS[lang]], `matières ENA incorrectes en ${lang}`);
  }
});

await test("Contenu : la galerie est renseignée et alignée entre FR et AR", () => {
  for (const lang of ["fr", "ar"] as const) {
    const gallery = bundled[lang].gallery;
    assert.ok(gallery.items.length > 0, `galerie vide en ${lang}`);
    for (const item of gallery.items) {
      assert.ok(item.src.startsWith("/galerie/") || /^https?:/.test(item.src), `chemin invalide en ${lang} : ${item.src}`);
      assert.ok(item.alt.trim().length > 10, `texte alternatif trop court en ${lang} : ${item.alt}`);
    }
    assert.ok(gallery.counterLabel.includes("{current}") && gallery.counterLabel.includes("{total}"), `libellé compteur incomplet en ${lang}`);
  }
  assert.deepEqual(
    bundled.fr.gallery.items.map((item) => item.src),
    bundled.ar.gallery.items.map((item) => item.src),
    "les deux langues doivent présenter les mêmes photos, dans le même ordre"
  );
});

await test("Diagnostic : activé par ?diagnostic=1 ou #diagnostic, jamais par défaut", () => {
  const at = (search: string, hash = "") => isDiagnosticRequested({ search, hash } as Location);
  assert.equal(at("?diagnostic=1"), true);
  assert.equal(at(""), false, "sans paramètre, aucun panneau");
  assert.equal(at("?site=1"), false);
  assert.equal(at("?diagnostic=0"), false);
  assert.equal(at("", "#diagnostic"), true);
  assert.equal(at("", "#/admin-fbl"), false, "la route admin ne déclenche pas le diagnostic");
});

await test("mergeContent : un texte distant vide retombe sur le texte intégré", () => {
  const merged = mergeContent(fr(), { hero: { titleA: "" } });
  assert.equal(merged.hero.titleA, bundled.fr.hero.titleA);
});

await test("mergeContent : un texte distant non vide remplace le texte intégré", () => {
  const merged = mergeContent(fr(), { hero: { titleA: "Nouveau titre" } });
  assert.equal(merged.hero.titleA, "Nouveau titre");
});

await test("mergeContent : les tableaux distants sont repris tels quels", () => {
  const domains = [{ icon: "Scale", title: "Droit", description: "d", tags: ["a"], interest: "Droit" }];
  const merged = mergeContent(fr(), { formations: { domains } });
  assert.equal(merged.formations.domains.length, 1);
  assert.equal(merged.formations.domains[0].title, "Droit");
  assert.deepEqual(merged.formations.domains[0].tags, ["a"]);
});

await test("mergeContent : une valeur distante invalide ne casse pas la structure", () => {
  const merged = mergeContent(fr(), null);
  assert.equal(merged.contactUi.eyebrow, bundled.fr.contactUi.eyebrow);
});

await test("hasChanges : détecte une modification de texte", () => {
  const next = fr();
  assert.equal(hasChanges(fr(), next), false);
  next.news.eyebrow = "Modifié";
  assert.equal(hasChanges(fr(), next), true);
});

await test("coerceIcons : remplace un nom d'icône inconnu par l'icône par défaut", () => {
  const data = fr() as unknown as Record<string, unknown>;
  (data.formations as { domains: { icon: string }[] }).domains[0].icon = "Licorne";
  coerceIcons(data);
  assert.equal((data.formations as { domains: { icon: string }[] }).domains[0].icon, DEFAULT_ICON);
});

await test("coerceIcons : conserve les noms valides", () => {
  const data = fr() as unknown as Record<string, unknown>;
  const before = (data.formations as { domains: { icon: string }[] }).domains[0].icon;
  assert.ok(ICON_NAMES.includes(before as never), `« ${before} » doit être dans le registre`);
  coerceIcons(data);
  assert.equal((data.formations as { domains: { icon: string }[] }).domains[0].icon, before);
});

await test("le registre d'icônes expose au moins les 16 icônes du contenu intégré", () => {
  assert.ok(ICON_NAMES.length >= 16, `${ICON_NAMES.length} icônes`);
});

/* ─────────────── Magasin Supabase (faux client) ─────────────── */

await test("Supabase : publier crée la version 1 et un jalon d'historique", async () => {
  const { client, calls } = createFakeSupabase();
  const store = createSupabaseStore({ client });
  const data = fr();
  data.formations.eyebrow = "v1";

  const published = await store.writePublished("fr", data, "Première publication", "rayen");
  assert.equal(published.version, 1);
  assert.equal((await store.readPublished("fr"))?.data.formations.eyebrow, "v1");

  const revisions = await store.listRevisions("fr");
  assert.equal(revisions.length, 1);
  assert.equal(revisions[0].note, "Première publication");
  assert.equal(revisions[0].author, "rayen");
  assert.ok(calls.includes("upsert:published_content"), "aucun upsert envoyé");
});

await test("Supabase : deux publications incrémentent la version", async () => {
  const { client } = createFakeSupabase();
  const store = createSupabaseStore({ client });
  await store.writePublished("fr", fr(), "v1", "rayen");
  const second = await store.writePublished("fr", fr(), "v2", "rayen");
  assert.equal(second.version, 2);
  assert.equal((await store.readPublished("fr"))?.version, 2);
});

await test("Supabase : l'historique est trié du plus récent au plus ancien", async () => {
  const { client } = createFakeSupabase();
  const store = createSupabaseStore({ client });
  await store.writePublished("fr", fr(), "v1", "rayen");
  await store.writePublished("fr", fr(), "v2", "rayen");
  const revisions = await store.listRevisions("fr");
  assert.deepEqual(
    revisions.map((item) => item.note),
    ["v2", "v1"]
  );
});

await test("Supabase : restaurer une révision republie son contenu", async () => {
  const { client } = createFakeSupabase();
  const store = createSupabaseStore({ client });
  const v1 = fr();
  v1.formations.eyebrow = "Avant";
  const v2 = fr();
  v2.formations.eyebrow = "Après";

  await store.writePublished("fr", v1, "v1", "rayen");
  await store.writePublished("fr", v2, "v2", "rayen");
  const oldest = (await store.listRevisions("fr")).at(-1);
  assert.ok(oldest, "révision v1 introuvable");

  const restored = await store.restoreRevision("fr", oldest.id, "rayen");
  assert.equal(restored.version, 3);
  assert.equal((await store.readPublished("fr"))?.data.formations.eyebrow, "Avant");
});

await test("Supabase : restaurer une révision inconnue lève une erreur explicite", async () => {
  const { client } = createFakeSupabase();
  const store = createSupabaseStore({ client });
  await assert.rejects(() => store.restoreRevision("fr", 999, "rayen"), /introuvable/);
});

await test("Supabase : brouillon enregistré, relu, puis jeté", async () => {
  const { client } = createFakeSupabase();
  const store = createSupabaseStore({ client });
  assert.equal(await store.readDraft("fr"), null);

  const draft = fr();
  draft.hero.titleA = "Brouillon";
  await store.writeDraft("fr", draft);
  assert.equal((await store.readDraft("fr"))?.data.hero.titleA, "Brouillon");

  await store.discardDraft("fr");
  assert.equal(await store.readDraft("fr"), null);
});

await test("Supabase : le contenu arabe est stocké séparément du français", async () => {
  const { client } = createFakeSupabase();
  const store = createSupabaseStore({ client });
  const ar = cloneContent(bundled.ar);
  ar.formations.eyebrow = "دورات";
  await store.writePublished("fr", fr(), "fr", "rayen");
  await store.writePublished("ar", ar, "ar", "rayen");

  assert.equal((await store.readPublished("ar"))?.data.formations.eyebrow, "دورات");
  assert.equal((await store.readPublished("fr"))?.data.formations.eyebrow, bundled.fr.formations.eyebrow);
});

await test("isAdminRoute : accepte le chemin secret ou ?admin=1, jamais sans chemin secret", () => {
  const opt = { adminPath: "admin-fbl-7k2" };
  assert.equal(isAdminRoute({ hash: "#/admin-fbl-7k2", search: "" }, opt), true);
  assert.equal(isAdminRoute({ hash: "", search: "?admin=1" }, opt), true);
  assert.equal(isAdminRoute({ hash: "", search: "?admin=0" }, opt), false);
  assert.equal(isAdminRoute({ hash: "#/contact", search: "" }, opt), false);
  assert.equal(
    isAdminRoute({ hash: "", search: "?admin=1" }, { adminPath: "" }),
    false,
    "sans VITE_ADMIN_PATH, l'admin reste fermée"
  );
});

await test("isAdminRoute : en mode aperçu, l'admin est la vue par défaut sauf ?site=1", () => {
  const secret = "admin-fbl-7k2";
  const preview = { adminPath: secret, adminIsDefault: true };
  assert.equal(isAdminRoute({ hash: "", search: "" }, preview), true, "racine => administration");
  assert.equal(isAdminRoute({ hash: "", search: "?site=1" }, preview), false, "?site=1 => site public");
  assert.equal(
    isAdminRoute({ hash: "#/admin-fbl-7k2", search: "?site=1" }, preview),
    true,
    "le lien admin du pied de page l'emporte sur ?site=1"
  );
  assert.equal(
    isAdminRoute({ hash: "", search: "" }, { adminPath: "", adminIsDefault: true }),
    false,
    "sans VITE_ADMIN_PATH, même l'aperçu reste fermé"
  );
});

/* ─────────────── Magasin local (sans backend) ─────────────── */

await test("Local : le contenu publié est amorcé depuis le contenu intégré", async () => {
  const store = createLocalStore(memoryKv());
  const published = await store.readPublished("fr");
  assert.ok(published);
  assert.equal(published.version, 1);
  assert.equal(published.data.contactUi.eyebrow, bundled.fr.contactUi.eyebrow);
});

await test("Local : publication, historique et restauration", async () => {
  const store = createLocalStore(memoryKv());
  const v1 = fr();
  v1.pricing.eyebrow = "Tarifs v1";
  const v2 = fr();
  v2.pricing.eyebrow = "Tarifs v2";

  await store.writePublished("fr", v1, "v1", "admin");
  await store.writePublished("fr", v2, "v2", "admin");
  const revisions = await store.listRevisions("fr");
  assert.deepEqual(
    revisions.map((item) => item.note),
    ["v2", "v1"]
  );

  await store.restoreRevision("fr", revisions[1].id, "admin");
  assert.equal((await store.readPublished("fr"))?.data.pricing.eyebrow, "Tarifs v1");
  assert.equal((await store.readPublished("fr"))?.version, 3);
});

await test("Local : deux magasins sur la même clé partagent les données", async () => {
  const kv = memoryKv();
  const data = fr();
  data.faq.eyebrow = "Partagé";
  await createLocalStore(kv).writePublished("fr", data, "v1", "admin");
  assert.equal((await createLocalStore(kv).readPublished("fr"))?.data.faq.eyebrow, "Partagé");
});

/* ─────────────── Session d'administration ─────────────── */

await test("isAdminPath : n'accepte que le chemin secret exact", () => {
  assert.equal(isAdminPath("#/admin-fbl-7k2", "admin-fbl-7k2"), true);
  assert.equal(isAdminPath("#admin-fbl-7k2", "admin-fbl-7k2"), true);
  assert.equal(isAdminPath("#/admin-fbl-7k2", "admin-fbl-7k2"), true);
  assert.equal(isAdminPath("#/contact", "admin-fbl-7k2"), false);
  assert.equal(isAdminPath("#/admin-fbl-7k2/autre", "admin-fbl-7k2"), false);
  assert.equal(isAdminPath("#/admin", ""), false, "sans chemin secret, l'admin doit rester fermée");
});

await test("Session locale : installation, connexion, mot de passe erroné, déconnexion", async () => {
  const kv = memoryKv();
  const session = createLocalSession(kv);
  assert.equal(session.isLocalSetup?.(), true, "sans mot de passe, l'installation doit être demandée");

  const user = await session.setupLocal?.("motdepasse-secret");
  assert.equal(user?.email, "admin@local");
  assert.equal(session.isLocalSetup?.(), false, "après création, plus d'installation à faire");
  assert.deepEqual(await session.getSession(), { id: user?.id, email: "admin@local" });

  await assert.rejects(() => session.signIn("admin@local", "mauvais"), /incorrects/);
  await assert.rejects(() => session.signIn("autre@local", "motdepasse-secret"), /incorrects/);
  assert.deepEqual(await session.signIn("ADMIN@LOCAL", "motdepasse-secret"), { id: user?.id, email: "admin@local" });

  await session.signOut();
  assert.equal(await session.getSession(), null);
});

await test("Session locale : mot de passe trop court refusé", async () => {
  const session = createLocalSession(memoryKv());
  await assert.rejects(() => session.setupLocal?.("court"), /8 caractères/);
  assert.equal(session.isLocalSetup?.(), true, "mot de passe refusé : l'installation reste à faire");
});

await test("Session locale : connexion impossible avant installation", async () => {
  const session = createLocalSession(memoryKv());
  await assert.rejects(() => session.signIn("admin@local", "motdepasse-secret"), /Aucun administrateur/);
});

await test("Session locale : changement de mot de passe", async () => {
  const kv = memoryKv();
  const session = createLocalSession(kv);
  await session.setupLocal?.("premier-motdepasse");
  await assert.rejects(() => session.changePassword?.("faux", "deuxieme-motdepasse"), /actuel incorrect/);
  await session.changePassword?.("premier-motdepasse", "deuxieme-motdepasse");
  await assert.rejects(() => session.signIn("admin@local", "premier-motdepasse"), /incorrects/);
  assert.ok(await session.signIn("admin@local", "deuxieme-motdepasse"));
});

/* ─────────────────────────── Sécurité ─────────────────────────── */

await test("Session locale : mot de passe trivial ou trop long refusé", async () => {
  const session = createLocalSession(memoryKv());
  await assert.rejects(() => session.setupLocal?.("12345678"), /trop courant/);
  await assert.rejects(() => session.setupLocal?.("x".repeat(129)), /ne doit pas dépasser/);
});

await test("Session locale : trop d'essais verrouille même le bon mot de passe", async () => {
  const kv = memoryKv();
  const session = createLocalSession(kv);
  await session.setupLocal?.("motdepasse-solide");
  for (let essai = 0; essai < 4; essai += 1) {
    await assert.rejects(() => session.signIn("admin@local", `faux-${essai}`), /incorrects/);
  }
  await assert.rejects(() => session.signIn("admin@local", "faux-4"), /Trop d'essais/, "le 5e échec verrouille");
  await assert.rejects(() => session.signIn("admin@local", "motdepasse-solide"), /Trop d'essais/);
  assert.ok((session.lockoutRemainingMs?.() ?? 0) > 0, "un délai de verrouillage doit être exposé");
});

await test("Session locale : un succès réinitialise le compteur d'échecs", async () => {
  const kv = memoryKv();
  const session = createLocalSession(kv);
  await session.setupLocal?.("motdepasse-solide");
  for (let essai = 0; essai < 4; essai += 1) {
    await assert.rejects(() => session.signIn("admin@local", `faux-${essai}`), /incorrects/);
  }
  assert.ok(await session.signIn("admin@local", "motdepasse-solide"));
  assert.equal(session.lockoutRemainingMs?.(), 0);
  await assert.rejects(() => session.signIn("admin@local", "faux"), /incorrects/, "le compteur repart de zéro");
});

await test("Session locale : expiration après 12 heures d'inactivité", async () => {
  const kv = memoryKv();
  const session = createLocalSession(kv);
  const user = await session.setupLocal?.("motdepasse-solide");
  assert.ok(await session.getSession());
  const admin = JSON.parse(kv.getItem("fbl.admin.v1") ?? "{}");
  kv.setItem("fbl.admin.session.v1", JSON.stringify({ id: admin.id, at: Date.now() - 13 * 3_600_000 }));
  assert.equal(await session.getSession(), null, "session expirée : accès refusé");
  assert.ok(await session.signIn("admin@local", "motdepasse-solide"), "une connexion rouvre une session valide");
  assert.deepEqual(await session.getSession(), { id: user?.id, email: "admin@local" });
});

await test("Session locale : anciens formats (session et haché) acceptés puis modernisés", async () => {
  const kv = memoryKv();
  const salt = "sel-ancien";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:motdepasse-ancien`));
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  kv.setItem("fbl.admin.v1", JSON.stringify({ id: "local-ancien", email: "admin@local", salt, hash }));
  const session = createLocalSession(kv);
  kv.setItem("fbl.admin.session.v1", "local-ancien");
  assert.ok(await session.getSession(), "l'ancien format de session doit rester valide");
  assert.ok(await session.signIn("admin@local", "motdepasse-ancien"), "l'ancien haché doit rester vérifiable");
  const updated = JSON.parse(kv.getItem("fbl.admin.v1") ?? "{}");
  assert.notEqual(updated.algo, undefined, "le haché doit être modernisé après connexion");
  assert.notEqual(updated.salt, salt, "le sel doit être renouvelé à la migration");
  assert.ok(await session.signIn("admin@local", "motdepasse-ancien"), "la connexion redevient possible après migration");
});

/* ─────────────────────────── Bilan ─────────────────────────── */

console.log(`\n${passed} test(s) réussi(s), ${failures.length} échec(s).`);
if (failures.length > 0) {
  console.log(`Échecs : ${failures.join(", ")}`);
  process.exit(1);
}
