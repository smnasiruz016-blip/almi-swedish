// Renders the three sample pages the build spec asks to review before scale:
// study / jobs / citizenship. Run with:  npx tsx scripts/seo/preview.ts
//
// This is the cheap way to read what several million generated pages will actually
// say, without deploying. If a fact is wrong here, it is wrong a million times.

import { buildStudyPage, buildJobsPage, buildLevelPage } from "@/lib/seo/content";
import { SUBJECT_BY_SLUG, COUNTRY_BY_SLUG, UNI_BY_SLUG, ROLE_BY_SLUG, HUB_BY_SLUG } from "@/lib/seo/axes";
import { resolveOriginBlock } from "@/lib/seo/origin-localization";
import { leadExam } from "@/lib/sv/registry";

function show(title: string, p: ReturnType<typeof buildStudyPage>) {
  console.log("\n" + "=".repeat(80) + "\n" + title + "\n" + "=".repeat(80));
  console.log("URL:        ", p.canonicalPath);
  console.log("indexable:  ", p.indexable);
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

// Sample 1 — STUDY: Computer Science, from Nigeria, first reference university.
const uni = UNI_BY_SLUG.get([...UNI_BY_SLUG.keys()][0])!;
show("STUDY SAMPLE", buildStudyPage(
  SUBJECT_BY_SLUG.get("computer-science-it")!,
  COUNTRY_BY_SLUG.get("nigeria")!,
  uni,
  resolveOriginBlock(COUNTRY_BY_SLUG.get("nigeria")!),
));

// Sample 2 — JOBS: Registered Nurse, from India, Stockholm.
show("JOBS SAMPLE", buildJobsPage(
  ROLE_BY_SLUG.get("registered-nurse")!,
  COUNTRY_BY_SLUG.get("india")!,
  HUB_BY_SLUG.get("stockholm")!,
  resolveOriginBlock(COUNTRY_BY_SLUG.get("india")!),
));

// Sample 3 — CITIZENSHIP: Medborgarskapsprovet, the lead. This is the page whose
// every claim is load-bearing: no pass mark, no language test, pilot not launch.
show("CITIZENSHIP SAMPLE (Medborgarskapsprovet)", buildLevelPage(leadExam()));
