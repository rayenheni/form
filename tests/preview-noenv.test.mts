/**
 * Vérifie le build SANS variables d'environnement (cas réel des aperçus arena.site :
 * `.env.local` est gitignoré, donc absent du build). Le chemin d'admin doit retomber
 * sur le repli commité et rester joignable.
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Window } from "happy-dom";

const dist = readFileSync("dist/index.html", "utf8");
assert.ok(!dist.includes('VITE_ADMIN_PATH:"'), "ce test exige un build SANS VITE_ADMIN_PATH");

const scripts = [...dist.matchAll(/<script type="module"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
assert.equal(scripts.length, 1);
mkdirSync("tests/.tmp", { recursive: true });
const bundleFile = "tests/.tmp/bundle-noenv.mjs";
writeFileSync(bundleFile, scripts[0]);

let passed = 0;
const failures: string[] = [];

async function scenario(label: string, url: string, assertions: (html: string, win: Window) => void) {
  const window = new Window({ url, settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
  const withoutScripts = dist.replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/g, "");
  window.document.write(withoutScripts);
  const source = window as unknown as Record<string, unknown>;
  for (const name of ["window","document","navigator","location","HTMLElement","Element","Node","Event","CustomEvent","getComputedStyle","requestAnimationFrame","cancelAnimationFrame","localStorage","history","DOMParser","MutationObserver","ResizeObserver","matchMedia","fetch","CSS"]) {
    try { Object.defineProperty(globalThis, name, { value: source[name], writable: true, configurable: true }); } catch {}
  }
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = false;
  class IO { observe(){} unobserve(){} disconnect(){} takeRecords(){return[];} }
  Object.defineProperty(globalThis, "IntersectionObserver", { value: IO, writable: true, configurable: true });
  Object.defineProperty(window, "IntersectionObserver", { value: IO, writable: true, configurable: true });
  try {
    await import(`${process.cwd()}/${bundleFile}?v=${encodeURIComponent(url)}`);
    await new Promise((r) => setTimeout(r, 200));
    assertions(window.document.body.innerHTML, window);
    passed += 1; console.log(`OK   ${label}`);
  } catch (e) { failures.push(label); console.log(`FAIL ${label}\n     ${e instanceof Error ? e.message : String(e)}`); }
}

const base = "https://sbx-l224m3ykcpixobbd.arena.site";

// Sans VITE_PREVIEW_ADMIN, la racine = site public, SANS aucun bouton d'accès à
// l'administration (l'accès se fait par l'URL secrète `#/admin-fbl`).
// Vérifie aussi la collecte : les tests de dashboard injectent un magasin en mémoire,
// donc c'est ici le seul endroit où le chemin `browserKv()` du VRAI bundle est exercé.
// (Assertion dans CE scénario : `scenario()` cache-buste par URL, un second scénario
// sur la même URL réutiliserait le module et ne redémarrerait pas l'application.)
await scenario("racine (build sans env) → site public sans entrée admin visible + visite collectée", `${base}/`, (html, win) => {
  assert.ok(html.includes("lead-name") || html.includes("contact"), "formulaire de contact absent");
  assert.ok(!html.includes("#/admin-fbl"), "lien Administration encore visible (pied de page ou onglet)");
  assert.ok(html.includes("build admin-v3"), "repère de version absent");
  assert.ok(!html.includes("Ouvrir l'administration"), "onglet flottant Administration encore visible");

  const raw = win.localStorage.getItem("fbl.analytics.v1");
  assert.ok(raw, "aucune donnée analytique écrite dans localStorage");

  const state = JSON.parse(raw as string) as {
    pageviews?: { path: string; source: string; visitorId: string; createdAt: string }[];
  };
  const views = state.pageviews ?? [];
  assert.equal(views.length, 1, `1 visite attendue, ${views.length} enregistrée(s)`);
  assert.equal(views[0].path, "/", `chemin inattendu : « ${views[0].path} »`);
  assert.equal(views[0].source, "Direct", `source inattendue : « ${views[0].source} »`);
  assert.ok(views[0].visitorId.length > 5, "identifiant de visiteur absent");
  assert.ok(!Number.isNaN(Date.parse(views[0].createdAt)), "horodatage invalide");
});

// La route admin via le repli ouvre bien l'administration.
await scenario("#/admin-fbl (repli) → administration", `${base}/#/admin-fbl`, (html) => {
  assert.ok(html.includes("accès administrateur") || html.includes("Créer l"), `admin absente (extrait : ${html.slice(0,160)}…)`);
});

console.log(`\n${passed} scénario(s) réussi(s), ${failures.length} échec(s).`);
process.exit(failures.length > 0 ? 1 : 0);
