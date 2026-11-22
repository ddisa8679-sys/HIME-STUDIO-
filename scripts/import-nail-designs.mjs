#!/usr/bin/env node
/**
 * Import up to TARGET unique, license-filtered nail design images into HIME STUDIO.
 *
 * Required environment:
 *   SUPABASE_URL=https://<project-ref>.supabase.co
 *   SUPABASE_ANON_KEY=<publishable or legacy anon key>
 *   (The legacy anon key is used as the public gateway JWT; no user token is needed.)
 *
 * Optional:
 *   TARGET=500
 *   BATCH_SIZE=20
 *   DELAY_MS=800
 *
 * Run: node scripts/import-nail-designs.mjs
 *
 * No service_role key is used or needed. Do not commit credentials.
 */

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const API_KEY = process.env.SUPABASE_ANON_KEY;
const TARGET = Math.max(1, Number.parseInt(process.env.TARGET || "500", 10));
const BATCH_SIZE = Math.min(20, Math.max(1, Number.parseInt(process.env.BATCH_SIZE || "20", 10)));
const DELAY_MS = Math.max(250, Number.parseInt(process.env.DELAY_MS || "800", 10));

const categories = [
  "French manicure", "nude nail art", "burgundy nails", "red nail art",
  "almond shape nails", "square nails", "rhinestone nails", "chrome nails",
  "bridal manicure", "floral nail art", "minimalist manicure", "short nail art",
  "long nail art", "geometric nail art", "gradient nails", "marble nails",
  "gel nail art", "nail polish art", "nail art close up", "manicure hands",
  "summer nail art", "pink nail art", "black nail art", "blue nail art",
  "glitter nails", "abstract nail art", "3d nail art", "nail extensions",
  "gel manicure", "press on nails", "colorful nail art", "natural nails",
  "elegant manicure", "holiday nail art", "ombre nails", "french tips",
  "Japanese nail art",
  "Korean nail art",
  "cat eye magnetic nails",
  "velvet nails",
  "aura nails",
  "butterfly nail art",
  "animal print nails",
  "tortoiseshell nails",
  "coffin nails",
  "stiletto nails",
  "oval nails",
  "squoval nails",
  "micro french nails",
  "reverse french manicure",
  "milky white nails",
  "pastel nail art",
  "orange nail art",
  "green nail art",
  "purple nail art",
  "silver chrome nails",
  "gold chrome nails",
  "pearl nail art",
  "bow nail art",
  "heart nail art",
  "lace nail art",
  "3d flower nails",
  "embossed nail art",
  "encapsulated glitter nails",
  "negative space nails",
  "abstract line nail art",
  "short almond manicure",
  "long coffin manicure",
  "natural nude manicure",
  "red french tips",
  "pink french tips",
  "blue french manicure",
  "holiday manicure closeup",
  "bridal nail design closeup",
  "hand painted nail art",
  "professional manicure closeup",
];

if (!SUPABASE_URL || !API_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
  console.error("Set them as environment variables. Never use or share the service_role key.");
  process.exit(1);
}

const endpoint = `${SUPABASE_URL}/functions/v1/import-nail-designs`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let totalImported = 0;
let totalFetched = 0;
let totalSkipped = 0;
let totalFailed = 0;
let calls = 0;
let catalogCount = 0;

async function importBatch(category, page) {
  const body = { category, limit: BATCH_SIZE, page };
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "apikey": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { raw: text.slice(0, 500) }; }

    if (response.ok) return result;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 3) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
    }
    const wait = Math.min(15000, 1000 * (2 ** attempt));
    console.warn(`Temporary HTTP ${response.status}; retrying in ${wait} ms`);
    await sleep(wait);
  }
}

console.log(`Starting HIME STUDIO import. Target: ${TARGET}; batch: ${BATCH_SIZE}; categories: ${categories.length}`);
console.log("Only CC0/Public Domain results are accepted by the server importer.");

for (const category of categories) {
  for (let page = 1; page <= 10; page++) {
    if (catalogCount >= TARGET) break;
    try {
      const result = await importBatch(category, page);
      calls++;
      const imported = Number(result.imported || 0);
      totalImported += imported;
      totalFetched += Number(result.fetched || 0);
      totalSkipped += Number(result.skipped || 0);
      totalFailed += Number(result.failed || 0);
      catalogCount = Number(result.totalInCatalog || catalogCount);

      console.log(
        `[${calls}] ${category} | page ${page} | +${imported} imported | catalog: ${result.totalInCatalog ?? "unknown"} | fetched: ${result.fetched ?? "?"} | skipped: ${result.skipped ?? "?"} | failed: ${result.failed ?? "?"}`
      );
      if (Array.isArray(result.errors) && result.errors.length) {
        for (const error of result.errors) console.warn(`  Import warning: ${error}`);
      }
      if (Number(result.fetched || 0) === 0) break;
    } catch (error) {
      console.error(`Batch failed: ${category}, page ${page}: ${error.message}`);
      // Continue to other pages/categories; a transient source failure shouldn't stop all imports.
    }
    await sleep(DELAY_MS);
  }
  if (catalogCount >= TARGET) break;
}

console.log("\nImport run finished.");
console.log(JSON.stringify({
  targetCatalogCount: TARGET,
  finalCatalogCount: catalogCount,
  importedThisRun: totalImported,
  fetched: totalFetched,
  skipped: totalSkipped,
  failed: totalFailed,
  requests: calls,
}, null, 2));
if (catalogCount < TARGET) {
  console.log("Target catalog count not reached. Re-run later; the importer skips already stored source URLs.");
}
