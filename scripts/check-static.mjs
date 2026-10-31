/**
 * Contrôle du build destiné à un hébergement statique classique
 * (InfinityFree, cPanel, OVH mutualisé, Ionos…).
 *
 *   npm run build:hosting     →  vite build && node scripts/check-static.mjs
 *
 * Vérifie que `dist/` est réellement autonome, puis affiche la marche à suivre.
 * Aucune dépendance : le script doit tourner même sur une machine minimale.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const DIST = "dist";
const problems = [];
const notices = [];

function fail(message) {
  problems.push(message);
}

function info(message) {
  notices.push(message);
}

if (!existsSync(DIST)) {
  console.error("✗ dossier dist/ absent — lancez `npm run build` d'abord.");
  process.exit(1);
}

/* ── 1. Les fichiers attendus ── */
const files = readdirSync(DIST).sort();
const index = join(DIST, "index.html");

if (!existsSync(index)) {
  fail("index.html absent de dist/");
} else {
  const html = readFileSync(index, "utf8");

  /* ── 2. Autonomie : aucun fichier CSS/JS local à côté ── */
  const localScripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((src) => !/^https?:/i.test(src));
  const localStyles = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((href) => !/^https?:/i.test(href));

  if (localScripts.length || localStyles.length) {
    fail(
      `le build n'est pas mono-fichier : ${[...localScripts, ...localStyles].join(", ")} ` +
        "(ces fichiers devraient être inlinés par vite-plugin-singlefile)"
    );
  } else {
    info("Build mono-fichier : CSS et JS inlinés dans index.html ✓");
  }

  /* ── 3. Supabase réellement configuré ? ──
   * La librairie @supabase/supabase-js embarque la chaîne littérale
   * « *.supabase.co » : on exige donc un vrai sous-domaine, jamais « * ». */
  const supabaseHosts = [
    ...new Set([...html.matchAll(/https:\/\/([a-z0-9-]+)\.supabase\.co/gi)].map((m) => m[1])),
  ];
  const expectedHost = (process.env.VITE_SUPABASE_URL ?? "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.supabase\.co$/i, "");

  if (supabaseHosts.length === 0) {
    if (expectedHost) {
      fail(
        `VITE_SUPABASE_URL est défini (${expectedHost}) mais l'URL n'apparaît pas dans le bundle : ` +
          "variable non transmise au build"
      );
    } else {
      info(
        "Aucune URL Supabase dans le bundle : le site fonctionnera sur son contenu intégré,\n" +
          "     et l'administration travaillera en MODE LOCAL (publications visibles dans ce seul navigateur).\n" +
          "     Pour publier réellement : renseignez .env.local puis relancez `npm run build:hosting`."
      );
    }
  } else {
    info(`Supabase configuré (projet : ${supabaseHosts.join(", ")}) : publication depuis l'administration ✓`);
    if (expectedHost && !supabaseHosts.includes(expectedHost)) {
      fail(`l'URL attendue (${expectedHost}) diffère de celle du bundle (${supabaseHosts.join(", ")})`);
    }
  }

  /* ── 4. Chemin de l'administration ── */
  const adminPath = (process.env.VITE_ADMIN_PATH ?? "").trim().replace(/^#/, "");
  if (!adminPath) {
    info(
      "Chemin d'admin : repli « #/admin-fbl » (VITE_ADMIN_PATH non défini).\n" +
        "     Ce repli est public et devinable : définissez VITE_ADMIN_PATH pour un chemin long et aléatoire."
    );
  } else if (html.includes(adminPath)) {
    info(`Chemin d'admin : « #/${adminPath} » figé au build ✓ (ce n'est pas un secret : la vraie protection est Supabase)`);
  } else {
    fail(`VITE_ADMIN_PATH (${adminPath}) n'apparaît pas dans le bundle : variable non transmise au build`);
  }

  /* ── 5. En-têtes : .htaccess présent ? ── */
  if (!existsSync(join(DIST, ".htaccess"))) {
    fail(
      ".htaccess absent de dist/ : màj de public/.htaccess, puis relancez le build\n" +
        "     (sans lui, index.html peut rester en cache et les anciens visiteurs verront l'ancien site)"
    );
  } else {
    info(".htaccess présent (anti-cache + en-têtes de sécurité Apache) ✓");
  }

  /* ── 6. Taille : limite d'upload de la plupart des file managers ── */
  const size = statSync(index).size;
  const mo = size / 1024 / 1024;
  info(`Taille d'index.html : ${(size / 1024).toFixed(0)} Ko${mo > 10 ? " ⚠️ > 10 Mo" : ""}`);
  if (mo > 10) fail("index.html dépasse 10 Mo : certains hébergements refusent l'upload");
}

const uploadable = files.filter((name) => name !== "_headers");
info(`À déposer dans htdocs/ : ${uploadable.join(", ")}`);
if (files.includes("_headers")) {
  info("(_headers ne concerne que Netlify/Cloudflare Pages : inutile ici)");
}

/* ── Bilan ── */
console.log("\n── Contrôle du build pour hébergement statique ──");
for (const message of notices) console.log(`  • ${message}`);

if (problems.length > 0) {
  console.log("\n✗ Build NON prêt :");
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exit(1);
}

console.log(`
✓ dist/ est prêt à être déposé tel quel.

  1. cPanel → Online File Manager (ou FTP) → dossier « htdocs/ »
  2. Vider le dossier, puis envoyer index.html ET .htaccess
     (afficher les fichiers cachés pour voir .htaccess)
  3. cPanel → SSL Certificates → certificat gratuit, puis décommenter
     le bloc HTTPS de .htaccess
  4. Ouvrir https://votre-sous-domaine.infinityfreeapp.com/ et recharger
     avec Ctrl/Cmd + Maj + R

  Guide complet : DEPLOY-INFINITYFREE.md
`);
