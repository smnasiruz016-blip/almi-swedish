import type { MetadataRoute } from "next";
import { ALL_EXAMS } from "@/lib/sv/registry";

const SITE = "https://almiswedish.almiworld.com";
const LASTMOD = "2026-07-15";

// COST FIX 2026-10-26 — the programmatic study/jobs combination pages are DELETED (owner ruling
// 17 Oct: deleted, no redirects) and answer 410 Gone from src/proxy.ts. The sitemap lists only the
// keep-set: one shard. Keep sitemap-index.xml at the same single shard.
const TOTAL_SHARDS = 1;

// One entry per shard → Next emits /sitemap/[id].xml + an index at /sitemap.xml.
export async function generateSitemaps(): Promise<{ id: number }[]> {
  return Array.from({ length: TOTAL_SHARDS }, (_, id) => ({ id }));
}

function entry(path: string, priority = 0.5): MetadataRoute.Sitemap[number] {
  return { url: `${SITE}${path}`, lastModified: LASTMOD, changeFrequency: "monthly", priority };
}

// CRITICAL (Next 16): `id` arrives as a Promise<string> from the metadata-route
// loader. Must be `async` and awaited — a synchronous `{id:number}` breaks the shard.
export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  void (await id); // Only shard 0 exists, but `id` must still be awaited (see above).

  // Shard 0 — core marketing + auth + exam hub/levels: the keep-set, all prerendered static pages.
  const core = ["", "/pricing", "/signup", "/login", "/exams", "/study-in-sweden", "/work-in-sweden", "/requirements/sweden/medborgarskapsprov"]
    .map((p) => entry(p, p === "" ? 1 : 0.7));
  const levels = ALL_EXAMS.map((e) => entry(`/exams/${e.slug}`, 0.8));
  return [...core, ...levels];
}
