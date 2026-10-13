/**
 * Pousse le contenu intégré au build vers Supabase (tables `published_content`
 * et `content_revisions`). Utile pour amorcer un projet neuf sans ressaisir le site.
 *
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npm run seed:content
 *
 * La clé *service_role* est requise (elle contourne les politiques RLS) :
 * ne la mettez jamais dans le site, uniquement dans votre terminal ou votre CI.
 */
import process from "node:process";
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { content } from "../src/constants/content";
import { coerceIcons } from "../src/store";
import { cloneContent } from "../src/store/types";

/* Charge .env.local puis .env (mêmes noms de variables que Vite). */
function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key]) continue;
    process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !serviceKey) {
  console.error("Variables manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Exemple : SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... npm run seed:content");
  process.exit(1);
}

const client = createClient(url, serviceKey, { auth: { persistSession: false } });
const author = "amorçage";
const now = new Date().toISOString();

for (const lang of ["fr", "ar"] as const) {
  const data = cloneContent(content[lang]);
  coerceIcons(data);

  const { data: existing } = await client
    .from("published_content")
    .select("version")
    .eq("lang", lang)
    .maybeSingle();
  const version = Number(existing?.version ?? 0) + 1;

  const { error: publishError } = await client
    .from("published_content")
    .upsert({ lang, data, version, updated_at: now }, { onConflict: "lang" });
  if (publishError) {
    console.error(`Publication ${lang} impossible : ${publishError.message}`);
    console.error("Avez-vous exécuté supabase/schema.sql dans le SQL Editor ?");
    process.exit(1);
  }

  const { error: revisionError } = await client
    .from("content_revisions")
    .insert({ lang, version, note: "Amorçage depuis le contenu intégré", author, created_at: now, data });
  if (revisionError) {
    console.error(`Historique ${lang} impossible : ${revisionError.message}`);
    process.exit(1);
  }

  console.log(`✓ ${lang} publié (version ${version})`);
}

console.log("\nAmorçage terminé. Le site affiche maintenant ce contenu.");
