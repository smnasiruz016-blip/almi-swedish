import { buildStudyPage, buildJobsPage, buildLevelPage } from "@/lib/seo/content";
import { SUBJECT_BY_SLUG, COUNTRY_BY_SLUG, UNI_BY_SLUG, ROLE_BY_SLUG, HUB_BY_SLUG } from "@/lib/seo/axes";
import { resolveOriginBlock } from "@/lib/seo/origin-localization";
import { LANGUAGE_EXAMS } from "@/lib/no/registry";

function show(title: string, p: ReturnType<typeof buildStudyPage>) {
  console.log("\n" + "=".repeat(80) + "\n" + title + "\n" + "=".repeat(80));
  console.log("URL:        ", p.canonicalPath);
  console.log("metaTitle:  ", p.metaTitle);
  console.log("metaDesc:   ", p.metaDescription);
  console.log("H1:         ", p.h1);
  console.log("subtitle:   ", p.subtitle);
  console.log("\nINTRO:");
  p.intro.forEach((x) => console.log("  " + x));
  p.sections.forEach((s) => {
    console.log("\n## " + s.heading);
    s.body.forEach((b) => console.log("  " + b));
  });
  console.log("\nFAQ:");
  p.faq.forEach((f) => console.log("  Q: " + f.q + "\n  A: " + f.a));
  console.log("\nRELATED:");
  p.related.forEach((r) => console.log("  → " + r.label + "  (" + r.href + ")"));
}

// Sample 1 — STUDY: Computer Science, from Nigeria, ref university (first in directory)
const uni = UNI_BY_SLUG.get([...UNI_BY_SLUG.keys()][0])!;
show("STUDY SAMPLE", buildStudyPage(
  SUBJECT_BY_SLUG.get("computer-science-it")!,
  COUNTRY_BY_SLUG.get("nigeria")!,
  uni,
  resolveOriginBlock(COUNTRY_BY_SLUG.get("nigeria")!),
));

// Sample 2 — JOBS: Registered Nurse, from India, Copenhagen
show("JOBS SAMPLE", buildJobsPage(
  ROLE_BY_SLUG.get("registered-nurse")!,
  COUNTRY_BY_SLUG.get("india")!,
  HUB_BY_SLUG.get("copenhagen")!,
  resolveOriginBlock(COUNTRY_BY_SLUG.get("india")!),
));

// Sample 3 — LEVEL: Prøve i Dansk 3 (B1–B2) — the citizenship language exam (the lead)
show("LEVEL SAMPLE (Prøve i Dansk 3)", buildLevelPage(LANGUAGE_EXAMS[2]));
