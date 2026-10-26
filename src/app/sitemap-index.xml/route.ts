// Next 16's generateSitemaps does NOT emit a sitemap index — it only serves the
// shards at /sitemap/[id].xml. We publish an explicit <sitemapindex> here so
// there's ONE URL to submit to Google Search Console; it lists every shard.
//
// MUST mirror sitemap.ts exactly: it fills study shards from TAUGHT_STUDY_TOTAL
// (taught-gated indexable leaves), NOT the full STUDY_TOTAL. Using STUDY_TOTAL
// here would advertise ~151 study shards while sitemap.ts fills ~56, leaving the
// tail as empty phantom shards. Keep this total === sitemap.ts's TOTAL_SHARDS.
export const dynamic = "force-static";

const SITE = "https://almiswedish.almiworld.com";
const LASTMOD = "2026-07-10";
const TOTAL_SHARDS = 1; // COST FIX 2026-10-26: keep-set only — the study/jobs leaves answer 410 Gone.

export function GET(): Response {
  const items = Array.from({ length: TOTAL_SHARDS }, (_, i) =>
    `<sitemap><loc>${SITE}/sitemap/${i}.xml</loc><lastmod>${LASTMOD}</lastmod></sitemap>`,
  ).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}
