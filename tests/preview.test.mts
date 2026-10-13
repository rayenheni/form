/**
 * Vérification « navigateur » : exécute le VRAI bundle de production
 * (dist/index.html, généré par `npm run build`) dans un DOM simulé et regarde
 * ce qui s'affiche réellement — pas une réimplémentation.
 *
 *   npm run test:preview
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Window } from "happy-dom";

const dist = readFileSync("dist/index.html", "utf8");
assert.ok(dist.includes("VITE_PREVIEW_ADMIN"), "dist/index.html ne contient pas la variable d'aperçu : relancez `npm run build`");

/* Extrait le script applicatif inliné par vite-plugin-singlefile. */
const scripts = [...dist.matchAll(/<script type="module"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
assert.equal(scripts.length, 1, `un seul script module attendu, ${scripts.length} trouvé(s)`);
mkdirSync("tests/.tmp", { recursive: true });
const bundleFile = "tests/.tmp/bundle.mjs";
writeFileSync(bundleFile, scripts[0]);

let passed = 0;
const failures: string[] = [];

async function scenario(label: string, url: string, assertions: (html: string) => void) {
  const window = new Window({ url, settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
  /* Injecte le HTML de production SANS son <script> (on exécute le bundle à la main). */
  const withoutScripts = dist.replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/g, "");
  window.document.write(withoutScripts);
  const globals = ["window", "document", "navigator", "location", "HTMLElement", "Element", "Node", "Event", "CustomEvent", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame", "localStorage", "history", "DOMParser", "MutationObserver", "ResizeObserver", "matchMedia", "fetch", "CSS"];
  const source = window as unknown as Record<string, unknown>;
  for (const name of globals) {
    try {
      Object.defineProperty(globalThis, name, { value: source[name], writable: true, configurable: true });
    } catch {
      /* `navigator` et quelques autres sont en lecture seule selon la version de Node */
    }
  }
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = false;
  /* framer-motion utilise IntersectionObserver (absent de happy-dom). */
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(globalThis, "IntersectionObserver", { value: IntersectionObserverStub, writable: true, configurable: true });
  Object.defineProperty(window, "IntersectionObserver", { value: IntersectionObserverStub, writable: true, configurable: true });

  try {
    await import(`${process.cwd()}/${bundleFile}?v=${encodeURIComponent(url)}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const html = window.document.body.innerHTML;
    assertions(html);
    passed += 1;
    console.log(`OK   ${label}`);
  } catch (error) {
    failures.push(label);
    console.log(`FAIL ${label}\n     ${error instanceof Error ? error.message : String(error)}`);
  }
}

const base = "https://5173-ish7guusm00sk9kr5vyie.e2b.app";

await scenario("racine de l'aperçu → administration", `${base}/`, (html) => {
  assert.ok(
    html.includes("Créer l") && html.includes("accès administrateur"),
    `écran de création d'accès absent (extrait : ${html.slice(0, 200)}…)`
  );
  assert.ok(html.includes("Mot de passe"), "champ mot de passe absent");
  assert.ok(!html.includes("Forma Business Lex — Centre"), "la landing page ne devrait pas s'afficher");
});

await scenario("?site=1 → site public sans entrée admin visible", `${base}/?site=1`, (html) => {
  assert.ok(html.includes("lead-name") || html.includes("contact"), "formulaire de contact absent");
  assert.ok(!html.includes("accès administrateur"), "l'administration ne devrait pas s'afficher");
  assert.ok(!html.includes("#/admin-fbl-demo"), "lien Administration encore visible");
  assert.ok(!html.includes("Ouvrir l'administration"), "onglet flottant Administration encore visible");
});

console.log(`\n${passed} scénario(s) réussi(s), ${failures.length} échec(s).`);
process.exit(failures.length > 0 ? 1 : 0);
