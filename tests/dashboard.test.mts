/**
 * Vérifie que le tableau de bord affiche de VRAIES données, et pas seulement son
 * état de chargement : rendu réel dans un DOM simulé, effets React exécutés.
 *
 * `renderToStaticMarkup` (tests/admin.test.mts) n'exécute pas les effets : les
 * statistiques arrivent dans un `useEffect`, donc sans DOM on ne voit que
 * « Chargement des statistiques… ». Ce test comble ce trou.
 *
 *   npm run test:dashboard
 */
import assert from "node:assert/strict";
import { Window } from "happy-dom";

/* ─────────────────────────── DOM simulé ─────────────────────────── */

const window = new Window({
  url: "http://localhost/#/admin-fbl",
  settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true },
});
window.document.write('<!doctype html><html><body><div id="root"></div></body></html>');

const GLOBALS = [
  "window", "document", "navigator", "location", "HTMLElement", "Element", "Node",
  "Event", "CustomEvent", "getComputedStyle", "requestAnimationFrame",
  "cancelAnimationFrame", "localStorage", "history", "DOMParser", "MutationObserver",
  "ResizeObserver", "matchMedia", "fetch", "CSS",
] as const;

const dom = window as unknown as Record<string, unknown>;
for (const name of GLOBALS) {
  try {
    Object.defineProperty(globalThis, name, { value: dom[name], writable: true, configurable: true });
  } catch {
    /* `navigator` et quelques autres sont en lecture seule selon la version de Node. */
  }
}
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

/* Absent de happy-dom ; utilisé par framer-motion et certains composants. */
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as Record<string, unknown>).IntersectionObserver = IntersectionObserverStub;

/* ─────────────────────────── Harnais ─────────────────────────── */

let passed = 0;
const failures: string[] = [];

async function test(label: string, run: () => Promise<void>) {
  try {
    await run();
    passed += 1;
    console.log(`OK   ${label}`);
  } catch (error) {
    failures.push(label);
    console.log(`FAIL ${label}\n     ${error instanceof Error ? error.message : String(error)}`);
  }
}

/* Importations dynamiques : le DOM doit exister AVANT que react-dom ne soit chargé. */
const React = await import("react");
const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { default: Dashboard } = await import("../src/admin/Dashboard");
const { createLocalAnalyticsStore, setAnalyticsStore } = await import("../src/store/analytics");
const { memoryKv } = await import("../src/store/localStore");

type Root = ReturnType<typeof createRoot>;

/** Monte le tableau de bord, laisse les effets se dérouler, renvoie le HTML produit. */
async function renderDashboard(): Promise<string> {
  const container = window.document.getElementById("root");
  assert.ok(container, "conteneur #root absent");
  container.innerHTML = "";

  const root: Root = createRoot(container as unknown as Parameters<typeof createRoot>[0]);
  await act(async () => {
    root.render(React.createElement(Dashboard));
  });
  /* Les statistiques sont chargées de façon asynchrone dans l'effet. */
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

  const html = container.innerHTML;
  await act(async () => {
    root.unmount();
  });
  return html;
}

/** Jeu de données connu : 5 visites (2 Google, 2 Facebook, 1 Direct) + 1 demande. */
async function seedKnownData(): Promise<void> {
  const store = createLocalAnalyticsStore(memoryKv());
  setAnalyticsStore(store);

  for (let index = 0; index < 2; index += 1) {
    await store.recordPageview({ path: "/", referrer: "https://google.com", source: "Google", lang: "fr", visitorId: `g-${index}` });
  }
  for (let index = 0; index < 2; index += 1) {
    await store.recordPageview({ path: "/#cours", referrer: "https://facebook.com", source: "Facebook", lang: "ar", visitorId: `f-${index}` });
  }
  await store.recordPageview({ path: "/", referrer: "", source: "Direct", lang: "fr", visitorId: "d-0" });

  await store.recordReservation({
    name: "Amina Test",
    email: "amina@example.tn",
    phone: "+216 94 825 735",
    interest: "Droit des affaires",
    message: "Bonjour, je souhaite m'inscrire.",
    source: "Google",
    lang: "fr",
  });
}

/* ─────────────────────────── Scénarios ─────────────────────────── */

await test("Tableau de bord : sort de l'état de chargement et affiche les indicateurs", async () => {
  await seedKnownData();
  const html = await renderDashboard();

  assert.ok(!html.includes("Chargement des statistiques"), "encore en état de chargement : les effets n'ont pas abouti");
  assert.ok(html.includes("Visites"), "indicateur « Visites » absent");
  assert.ok(html.includes("Visiteurs uniques"), "indicateur « Visiteurs uniques » absent");
  assert.ok(html.includes("Taux de conversion"), "indicateur « Taux de conversion » absent");
});

await test("Tableau de bord : le taux de conversion est calculé (1 demande / 5 visiteurs = 20 %)", async () => {
  await seedKnownData();
  const html = await renderDashboard();
  assert.ok(html.includes("20,0 %"), `taux de conversion attendu « 20,0 % » absent`);
});

await test("Tableau de bord : les sources de trafic sont listées", async () => {
  await seedKnownData();
  const html = await renderDashboard();
  assert.ok(html.includes("Google"), "source « Google » absente");
  assert.ok(html.includes("Facebook"), "source « Facebook » absente");
});

await test("Tableau de bord : les pages vues sont listées", async () => {
  await seedKnownData();
  const html = await renderDashboard();
  assert.ok(html.includes("/#cours"), "page « /#cours » absente");
});

await test("Tableau de bord : le jour de pic est signalé", async () => {
  await seedKnownData();
  const html = await renderDashboard();
  assert.ok(html.includes("Pic :"), "badge de pic absent");
});

await test("Tableau de bord : la demande apparaît avec son auteur et ses coordonnées", async () => {
  await seedKnownData();
  const html = await renderDashboard();
  assert.ok(html.includes("Amina Test"), "nom de la demande absent");
  assert.ok(html.includes("amina@example.tn"), "e-mail absent");
  assert.ok(html.includes("+216 94 825 735"), "téléphone absent");
  assert.ok(html.includes("Droit des affaires"), "sujet absent");
  assert.ok(html.includes("Nouvelle"), "statut initial absent");
});

await test("Tableau de bord : le bandeau « mode démonstration » s'affiche sans Supabase", async () => {
  await seedKnownData();
  const html = await renderDashboard();
  assert.ok(html.includes("Mode démonstration"), "bandeau d'avertissement absent");
});

await test("Tableau de bord : sans donnée, l'écran vide s'affiche", async () => {
  setAnalyticsStore(createLocalAnalyticsStore(memoryKv()));
  const html = await renderDashboard();
  assert.ok(!html.includes("Chargement des statistiques"), "encore en état de chargement");
  assert.ok(html.includes("Aucune visite enregistrée"), "état vide des visites absent");
  assert.ok(html.includes("Aucune demande pour l"), "état vide des demandes absent");
});

setAnalyticsStore(null);

/* ─────────────────────────── Bilan ─────────────────────────── */

console.log(`\n${passed} test(s) réussi(s), ${failures.length} échec(s).`);
if (failures.length > 0) {
  console.log(`Échecs : ${failures.join(", ")}`);
  process.exit(1);
}
process.exit(0);
