import type { MetadataRoute } from "next";
import {
  JOBS_TOTAL,
  jobsComboAtIndex, studyPath, jobsPath,
} from "@/lib/seo/axes";
import { TAUGHT_STUDY_TOTAL, taughtStudyComboAtIndex } from "@/lib/seo/taught-index";
import { ALL_EXAMS } from "@/lib/sv/registry";

const SITE = "https://almiswedish.almiworld.com";
const PER = 50_000; // Google's max URLs per sitemap
const LASTMOD = "2026-07-15";

// Only the TAUGHT study leaves are indexable, so only those go in the sitemap —
// the untaught majority render noindex and must not burn crawl budget / ISR writes.
const STUDY_SHARDS = Math.ceil(TAUGHT_STUDY_TOTAL / PER); // ~56
const JOBS_SHARDS = Math.ceil(JOBS_TOTAL / PER); //   ~7
// Shard 0 = core + level pages; 1..STUDY_SHARDS = study; then jobs.
const TOTAL_SHARDS = 1 + STUDY_SHARDS + JOBS_SHARDS;

// One entry per shard → Next emits /sitemap/[id].xml + an index at /sitemap.xml.
export async function generateSitemaps(): Promise<{ id: number }[]> {
  return Array.from({ length: TOTAL_SHARDS }, (_, id) => ({ id }));
}

function entry(path: string, priority = 0.5): MetadataRoute.Sitemap[number] {
  return { url: `${SITE}${path}`, lastModified: LASTMOD, changeFrequency: "monthly", priority };
}

// CRITICAL (Next 16): `id` arrives as a Promise<string> from the metadata-route
// loader. Must be `async` and `Number(await id)` — a synchronous `{id:number}`
// makes every comparison fail and each shard emits an empty <urlset> (110 bytes).
export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const shard = Number(await id);
  // Shard 0 — core marketing + auth + Swedish-exam hub/levels.
  if (shard === 0) {
    const core = ["", "/pricing", "/signup", "/login", "/exams", "/study-in-sweden", "/work-in-sweden", "/requirements/sweden/medborgarskapsprov"]
      .map((p) => entry(p, p === "" ? 1 : 0.7));
    const levels = ALL_EXAMS.map((e) => entry(`/exams/${e.slug}`, 0.8));
    return [...core, ...levels];
  }

  // Study shards: 1 .. STUDY_SHARDS
  if (shard >= 1 && shard <= STUDY_SHARDS) {
    const start = (shard - 1) * PER;
    const end = Math.min(start + PER, TAUGHT_STUDY_TOTAL);
    const out: MetadataRoute.Sitemap = [];
    for (let i = start; i < end; i++) {
      const c = taughtStudyComboAtIndex(i);
      if (c) out.push(entry(studyPath(c.subject.slug, c.country.slug, c.university.slug)));
    }
    return out;
  }

  // Jobs shards: STUDY_SHARDS+1 .. STUDY_SHARDS+JOBS_SHARDS
  const jobShard = shard - (STUDY_SHARDS + 1);
  if (jobShard >= 0 && jobShard < JOBS_SHARDS) {
    const start = jobShard * PER;
    const end = Math.min(start + PER, JOBS_TOTAL);
    const out: MetadataRoute.Sitemap = [];
    for (let i = start; i < end; i++) {
      const c = jobsComboAtIndex(i);
      if (c) out.push(entry(jobsPath(c.role.slug, c.country.slug, c.hub.slug)));
    }
    return out;
  }

  return [];
}
