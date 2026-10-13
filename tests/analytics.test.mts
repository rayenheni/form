/**
 * Tests de l'analytique : calculs purs, magasin local et magasin Supabase.
 * Exécution : `npm run test:analytics`
 */
import assert from "node:assert/strict";
import {
  DIRECT_SOURCE,
  dayKey,
  formatCount,
  formatDelta,
  formatPercent,
  hostOf,
  parseSource,
  reservationsToCsv,
  summarize,
  type Pageview,
  type Reservation,
} from "../src/lib/analytics";
import { createLocalAnalyticsStore, createSupabaseAnalyticsStore } from "../src/store/analytics";
import { memoryKv } from "../src/store/localStore";
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

/* Référence fixe : 15 mars 2026 à midi UTC. */
const NOW = new Date("2026-03-15T12:00:00.000Z");

const view = (daysAgo: number, overrides: Partial<Pageview> = {}): Pageview => ({
  id: `v-${daysAgo}-${Math.random().toString(36).slice(2)}`,
  path: "/",
  referrer: "",
  source: DIRECT_SOURCE,
  lang: "fr",
  visitorId: `visitor-${daysAgo}`,
  createdAt: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
  ...overrides,
});

const reservation = (daysAgo: number, overrides: Partial<Reservation> = {}): Reservation => ({
  id: `r-${daysAgo}-${Math.random().toString(36).slice(2)}`,
  name: "Amina",
  email: "amina@example.tn",
  phone: "+216 94 825 735",
  interest: "Droit des affaires",
  message: "",
  source: DIRECT_SOURCE,
  lang: "fr",
  status: "new",
  createdAt: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
  ...overrides,
});

/* ───────────────────────── Identification des sources ───────────────────────── */

await test("parseSource : aucun référant → Direct", () => {
  assert.equal(parseSource(""), DIRECT_SOURCE);
  assert.equal(parseSource("   "), DIRECT_SOURCE);
});

await test("parseSource : référants connus regroupés sous leur marque", () => {
  assert.equal(parseSource("https://www.google.com/search?q=formation"), "Google");
  assert.equal(parseSource("https://m.facebook.com/"), "Facebook");
  assert.equal(parseSource("https://lnkd.in/abc"), "LinkedIn");
  assert.equal(parseSource("https://wa.me/21694825735"), "WhatsApp");
  assert.equal(parseSource("https://youtu.be/xyz"), "YouTube");
});

await test("parseSource : domaine inconnu conservé sans www", () => {
  assert.equal(parseSource("https://www.partenaire.tn/page"), "partenaire.tn");
});

await test("parseSource : utm_source prioritaire sur le référant", () => {
  assert.equal(parseSource("https://google.com", "?utm_source=campagne_linkedin"), "Campagne Linkedin");
});

await test("parseSource : URL invalide ne lève pas", () => {
  assert.equal(parseSource("::::pas-une-url"), DIRECT_SOURCE);
});

await test("hostOf : extrait l'hôte en minuscules", () => {
  assert.equal(hostOf("https://WWW.Example.TN/x"), "www.example.tn");
  assert.equal(hostOf(""), "");
});

/* ───────────────────────── Agrégation ───────────────────────── */

await test("summarize : compte les visites et les visiteurs uniques", () => {
  const summary = summarize(
    [view(0), view(0, { visitorId: "autre" }), view(1)],
    [],
    7,
    NOW
  );
  assert.equal(summary.visits, 3);
  assert.equal(summary.uniqueVisitors, 3);
});

await test("summarize : ignore les visites hors fenêtre", () => {
  const summary = summarize([view(0), view(30)], [], 7, NOW);
  assert.equal(summary.visits, 1);
});

await test("summarize : série continue, un point par jour même sans visite", () => {
  const summary = summarize([view(0)], [], 7, NOW);
  assert.equal(summary.series.length, 7);
  assert.equal(summary.series[6].visits, 1);
  assert.equal(summary.series[0].visits, 0);
});

await test("summarize : variation par rapport à la période précédente", () => {
  const previous = [view(8), view(9)];
  const current = [view(0), view(1), view(2)];
  const summary = summarize([...previous, ...current], [], 7, NOW);
  assert.equal(summary.previousVisits, 2);
  assert.equal(summary.visits, 3);
  assert.equal(summary.visitsDelta, 50);
});

await test("summarize : aucune visite précédente mais des visites courantes → +100 %", () => {
  const summary = summarize([view(0)], [], 7, NOW);
  assert.equal(summary.previousVisits, 0);
  assert.equal(summary.visitsDelta, 100);
});

await test("summarize : taux de conversion = réservations ÷ visiteurs uniques", () => {
  const summary = summarize(
    [view(0), view(0, { visitorId: "b" }), view(0, { visitorId: "c" }), view(0, { visitorId: "d" })],
    [reservation(0)],
    7,
    NOW
  );
  assert.equal(summary.uniqueVisitors, 4);
  assert.equal(summary.reservations, 1);
  assert.equal(summary.conversionRate, 25);
});

await test("summarize : aucun visiteur → conversion à 0 sans division par zéro", () => {
  const summary = summarize([], [], 7, NOW);
  assert.equal(summary.conversionRate, 0);
  assert.equal(summary.visitsDelta, 0);
  assert.equal(summary.peak, null);
});

await test("summarize : répartition par source triée par volume", () => {
  const summary = summarize(
    [
      view(0, { source: "Google" }),
      view(0, { source: "Google" }),
      view(0, { source: "Facebook" }),
    ],
    [],
    7,
    NOW
  );
  assert.equal(summary.bySource[0].label, "Google");
  assert.equal(summary.bySource[0].count, 2);
  assert.equal(summary.bySource[1].label, "Facebook");
});

await test("summarize : pic du jour le plus chargé", () => {
  const summary = summarize([view(2), view(2), view(2), view(5)], [], 7, NOW);
  assert.equal(summary.peak?.visits, 3);
  assert.equal(summary.peak?.date, dayKey(view(2).createdAt));
});

await test("summarize : source vide retombée sur Direct", () => {
  const summary = summarize([view(0, { source: "" })], [], 7, NOW);
  assert.equal(summary.bySource[0].label, DIRECT_SOURCE);
});

await test("summarize : statuts des réservations libellés en français", () => {
  const summary = summarize([view(0)], [reservation(0, { status: "booked" })], 7, NOW);
  assert.equal(summary.reservationsByStatus[0].label, "Réservée");
});

await test("dayKey : clé AAAA-MM-JJ en UTC", () => {
  assert.equal(dayKey("2026-03-15T23:30:00.000Z"), "2026-03-15");
  assert.equal(dayKey("invalide"), "");
});

/* ───────────────────────── Formatage ───────────────────────── */

await test("formatCount : groupement des milliers et négatifs ramenés à 0", () => {
  /* `Intl` insère une espace fine insécable (U+202F) en français. */
  assert.equal(formatCount(1234), "1\u202f234");
  assert.equal(formatCount(-5), "0");
});

await test("formatPercent : une décimale", () => {
  assert.equal(formatPercent(12.5), "12,5 %");
  assert.equal(formatPercent(0), "0,0 %");
});

await test("formatDelta : signe explicite", () => {
  assert.equal(formatDelta(12.5), "+12,5 %");
  assert.equal(formatDelta(-3), "−3,0 %");
});

/* ───────────────────────── Export CSV ───────────────────────── */

await test("reservationsToCsv : BOM UTF-8, séparateur point-virgule, guillemets échappés", () => {
  const csv = reservationsToCsv([
    reservation(0, { name: 'Ben "Ali"', message: "ligne1\nligne2" }),
  ]);
  assert.ok(csv.startsWith("\uFEFF"), "BOM absent");
  assert.ok(csv.includes('"Ben ""Ali"""'), "guillemets mal échappés");
  assert.ok(!csv.includes("ligne1\nligne2"), "saut de ligne non aplati");
  assert.ok(csv.includes("Nouvelle"), "statut non libellé");
  assert.equal(csv.split("\r\n").length, 3, "en-tête + 1 ligne + vide final");
});

/* ───────────────────────── Magasin local ───────────────────────── */

await test("Magasin local : enregistre et relit une visite", async () => {
  const store = createLocalAnalyticsStore(memoryKv());
  await store.recordPageview({ path: "/", referrer: "", source: "Google", lang: "fr", visitorId: "v1" });
  const views = await store.listPageviews(new Date(0).toISOString());
  assert.equal(views.length, 1);
  assert.equal(views[0].source, "Google");
  assert.ok(views[0].id, "identifiant manquant");
});

await test("Magasin local : enregistre une demande avec le statut « new »", async () => {
  const store = createLocalAnalyticsStore(memoryKv());
  const created = await store.recordReservation({
    name: "Amina",
    email: "a@example.tn",
    phone: "",
    interest: "Droit",
    message: "",
    source: "Direct",
    lang: "fr",
  });
  assert.equal(created?.status, "new");
  const items = await store.listReservations(new Date(0).toISOString());
  assert.equal(items.length, 1);
});

await test("Magasin local : mise à jour du statut persistée", async () => {
  const kv = memoryKv();
  const store = createLocalAnalyticsStore(kv);
  await store.recordReservation({
    name: "Sami",
    email: "s@example.tn",
    phone: "",
    interest: "Fiscal",
    message: "",
    source: "Direct",
    lang: "fr",
  });
  const [first] = await store.listReservations(new Date(0).toISOString());
  await store.setReservationStatus(first.id, "booked");

  /* Relecture depuis un magasin neuf : la persistance est bien réelle. */
  const reloaded = await createLocalAnalyticsStore(kv).listReservations(new Date(0).toISOString());
  assert.equal(reloaded[0].status, "booked");
});

await test("Magasin local : les demandes sont triées de la plus récente à la plus ancienne", async () => {
  const store = createLocalAnalyticsStore(memoryKv());
  await store.recordReservation({ name: "A", email: "", phone: "", interest: "", message: "", source: "", lang: "fr" });
  await store.recordReservation({ name: "B", email: "", phone: "", interest: "", message: "", source: "", lang: "fr" });
  const items = await store.listReservations(new Date(0).toISOString());
  assert.equal(items[0].name, "B");
});

/* ───────────────────────── Magasin Supabase ───────────────────────── */

await test("Magasin Supabase : écrit et relit les visites", async () => {
  const { client } = createFakeSupabase();
  const store = createSupabaseAnalyticsStore({ client });
  await store.recordPageview({ path: "/#formations", referrer: "https://google.com", source: "Google", lang: "ar", visitorId: "v9" });
  const views = await store.listPageviews("1970-01-01T00:00:00.000Z");
  assert.equal(views.length, 1);
  assert.equal(views[0].path, "/#formations");
  assert.equal(views[0].lang, "ar");
  assert.equal(views[0].visitorId, "v9");
});

await test("Magasin Supabase : écrit et relit une demande", async () => {
  const { client } = createFakeSupabase();
  const store = createSupabaseAnalyticsStore({ client });
  await store.recordReservation({
    name: "Leïla",
    email: "l@example.tn",
    phone: "+216 23 691 946",
    interest: "Droit",
    message: "Bonjour",
    source: "LinkedIn",
    lang: "fr",
  });
  const items = await store.listReservations("1970-01-01T00:00:00.000Z");
  assert.equal(items.length, 1);
  assert.equal(items[0].email, "l@example.tn");
  assert.equal(items[0].status, "new");
});

await test("Magasin Supabase : mise à jour du statut", async () => {
  const { client } = createFakeSupabase();
  const store = createSupabaseAnalyticsStore({ client });
  await store.recordReservation({
    name: "Karim",
    email: "k@example.tn",
    phone: "",
    interest: "Fiscal",
    message: "",
    source: "Direct",
    lang: "fr",
  });
  const [first] = await store.listReservations("1970-01-01T00:00:00.000Z");
  await store.setReservationStatus(String(first.id), "contacted");
  const after = await store.listReservations("1970-01-01T00:00:00.000Z");
  assert.equal(after[0].status, "contacted");
});

/* ─────────────────────────── Bilan ─────────────────────────── */

console.log(`\n${passed} test(s) réussi(s), ${failures.length} échec(s).`);
if (failures.length > 0) {
  console.log(`Échecs : ${failures.join(", ")}`);
  process.exit(1);
}
