// Deterministic, honest, varied content generator for the pSEO matrix.
// Every page is composed from its axes' REAL attributes; phrasing variants are
// selected by hash(slug) so text distributes across millions of pages without
// thin duplication.
//
// HONESTY GUARDRAILS — these are not style notes, they are product rules:
//   • Readiness is a per-skill band/estimate, NEVER an official UHR result.
//   • Never state a pass mark for Medborgarskapsprovet. UHR has not published one.
//   • Never imply the citizenship LANGUAGE test exists or that we prepare for it.
//     UHR indicates autumn 2028 at the earliest and has set no level.
//   • Citizenship residency: the eight-year main rule is published and may be
//     stated, but always paired with "confirm with Migrationsverket".
//   • Facts about Swedish institutions must be TRUE and Swedish. This file's
//     ancestor shipped Danish universities described as Norwegian, and a Danish   hygiene-allow
//     health regulator labelled "the Norwegian Patient Safety Authority", to      hygiene-allow
//     production. Check every proper noun against the country you are in.

import { ALL_EXAMS, examBySlug, SOCIETY_FORMAT_HEDGE, type ExamMeta } from "@/lib/sv/registry";
import {
  hash, pick, studyPath, jobsPath,
  UNIVERSITIES, COUNTRIES, HUBS,
  type SeoUniversity, type SeoRole, type SeoCountry, type SeoSubject, type SeoHub,
} from "@/lib/seo/axes";
import { uniTeaches } from "@/lib/seo/subject-mapper";
import type { OriginBlock } from "@/lib/seo/origin-localization";

// Strip trailing punctuation from a concern fragment so it reads cleanly when
// we quote it inline (e.g. `"…recognised back home"` not `"…back home?."`).
const cleanConcern = (s: string) => s.replace(/\s*[.?;]+\s*$/, "").trim();

const SITE = "https://almiswedish.almiworld.com";

export interface SeoPage {
  h1: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  /** Taught-gate: false = thin/untaught cell → route emits robots:{index:false}. */
  indexable: boolean;
  intro: string[];
  sections: { heading: string; body: string[] }[];
  faq: { q: string; a: string }[];
  related: { href: string; label: string }[];
  breadcrumbs: { name: string; path: string }[];
  jsonLd: Record<string, unknown>;
}

// Honest per-subject descriptors + whether the field is typically regulated.
// `regulated` drives the extra licensing paragraph, NOT the language level —
// see levelForStudy() for why.
const SUBJECT_META: Record<string, { field: string; regulated: boolean }> = {
  "medicine-health-sciences": { field: "medicine, nursing and the health sciences", regulated: true },
  "engineering-technology": { field: "engineering and applied technology", regulated: false },
  "computer-science-it": { field: "computer science, software and IT", regulated: false },
  "business-management": { field: "business, management and economics", regulated: false },
  "law": { field: "law and legal studies", regulated: true },
  "natural-sciences": { field: "the natural sciences", regulated: false },
  "arts-humanities": { field: "the arts and humanities", regulated: false },
  "social-sciences": { field: "the social sciences", regulated: false },
  "education": { field: "education and teaching", regulated: true },
  "mathematics-statistics": { field: "mathematics and statistics", regulated: false },
  "architecture-design": { field: "architecture and design", regulated: true },
  "agriculture-environment": { field: "agriculture and environmental science", regulated: false },
};

// The exams the funnel links to.
const TISUS = examBySlug("tisus")!; // university admission (≈C1) — equivalent to Svenska 3
const SVENSKA_B1B2 = examBySlug("svenska-b1b2")!; // general working Swedish (B1–B2)
const SFI_CD = examBySlug("sfi-cd")!; // the common SFI exit (≈A2–B1+)
const MEDBORGARSKAPSPROV = examBySlug("medborgarskapsprov")!; // citizenship society test (lead)

// A short roster of well-known Swedish universities, named generically so the copy
// never fabricates a specific programme claim. These are SWEDISH institutions —
// verify before ever editing this line.
const SE_UNIS =
  "Uppsala University, Lund University, Stockholm University, KTH Royal Institute of Technology and other Swedish universities";

// Shared honest fragments -----------------------------------------------------
const READINESS_LINE =
  "AlmiSwedish gives you an honest readiness estimate — a per-skill band (Clear or Borderline) against each exam's real criteria — never an invented official result. AlmiSwedish is not affiliated with UHR, and UHR does not endorse unofficial practice tests, including ours.";
const CITIZENSHIP_HEDGE =
  "Since 6 June 2026, Swedish citizenship has required eight years' habitual residence as the main rule, self-sufficiency, and — for applicants aged 16–66 — Medborgarskapsprovet. Only the society component of that test exists: UHR's first sitting, on 15 August 2026, is a pilot. A Swedish language test is planned but UHR indicates it will not be ready before autumn 2028, and no level has been set for it. The rules are new and still moving, and there are no transitional arrangements — confirm the current requirements with Migrationsverket and UHR before you plan. We help you prepare fairly; we never claim to help anyone shortcut or beat the process.";
const MISSION_LINE =
  "25% of AlmiSwedish proceeds fund the Shamool Foundation's social mission.";
const CTA_LINE =
  "Reading and Listening practice is free; AI feedback on Writing and Speaking and the full timed mock become available with a 7-day free trial ($12/month after, cancel anytime).";
// Medborgarskapsprovet has no Writing/Speaking — it is a single KNOWLEDGE module.
// Offering "AI feedback on Writing and Speaking" on that page would be selling
// something the exam does not contain.
const CTA_LINE_KNOWLEDGE =
  "The civic practice questions are free and unlimited — no card needed. A subscription ($12/month after a 7-day free trial) covers the Swedish language ladder: AI feedback on Writing and Speaking, and the full timed mock.";

// Swedish-taught degree programmes require Svenska 3 / Svenska som andraspråk 3 as
// a GENERAL entry requirement, and Tisus is accepted as equivalent to Svenska 3.
// This holds regardless of subject — so, unlike the Norwegian ancestor of this file, hygiene-allow
// we do NOT vary the admission level by whether the field is regulated. Regulation
// changes what you need to PRACTISE the profession, not to be admitted.
function levelForStudy(): ExamMeta {
  return TISUS;
}

// Display label for an exam. Append the level only when the name doesn't already
// carry it, to avoid duplication like "Swedish B1–B2 (B1–B2)".
function examLabel(e: ExamMeta): string {
  return e.name.includes(e.cefr) ? e.name : `${e.name} (${e.cefr})`;
}

// A few sibling internal links (same subject, other origin countries).
function relatedStudy(subject: SeoSubject, country: SeoCountry, seed: number): { href: string; label: string }[] {
  const others = COUNTRIES.filter((c) => c.slug !== country.slug);
  const picks = [others[seed % others.length], others[(seed * 7 + 3) % others.length], others[(seed * 13 + 5) % others.length]]
    .filter((c, i, a) => c && a.findIndex((x) => x.slug === c.slug) === i);
  const uniPick = UNIVERSITIES[(seed * 17) % UNIVERSITIES.length];
  return picks.map((c) => ({ href: studyPath(subject.slug, c.slug, uniPick.slug), label: `${subject.name} in Sweden from ${c.name}` }));
}

// ---- STUDY PAGE -------------------------------------------------------------
export function buildStudyPage(subject: SeoSubject, country: SeoCountry, uni: SeoUniversity, origin: OriginBlock): SeoPage {
  const path = studyPath(subject.slug, country.slug, uni.slug);
  const seed = hash(path);
  const sm = SUBJECT_META[subject.slug] ?? { field: subject.name.toLowerCase(), regulated: false };
  const level = levelForStudy();
  const uniPlace = [uni.city, uni.countryName].filter(Boolean).join(", ");

  // TAUGHT-GATE: index only where the reference institution actually lists the
  // subject. A thin, untaught cell is noindexed and canonicals UP to the subject
  // hub — a route that EXISTS — never to a subject×origin URL with no page (404).
  const taught = uniTeaches(uni, subject.slug);
  const canonicalPath = taught ? path : `/study-in-sweden/${subject.slug}`;

  const recognitionSection = {
    heading: `Using a Swedish degree back in ${country.name}`,
    body: [
      origin.localized
        ? `In ${country.name}, recognition of a foreign degree goes through ${origin.recognitionBody}${origin.recognitionUrl ? ` (${origin.recognitionUrl})` : ""}. ${origin.equivalenceNote}`
        : origin.equivalenceNote,
      `A common concern for students from ${country.name} — "${cleanConcern(origin.commonConcern)}" — is worth planning early, alongside the language requirement.${origin.sourceNote ? ` (${origin.sourceNote})` : ""}${origin.searchTerms.length ? ` Students from ${country.name} commonly search for: ${origin.searchTerms.join(", ")}.` : ""}`,
    ],
  };

  const introVariants = [
    `Planning to study ${sm.field} in Sweden from ${country.name}? ${SE_UNIS} offer strong programmes across ${subject.name.toLowerCase()}. Many master's courses are taught in English — but for a Swedish-taught programme, and for daily life, the step students most often underestimate is Swedish itself.`,
    `${subject.name} is a popular reason students from ${country.name} look to Sweden. Whichever university and city you aim for, one thing shapes how smoothly you settle in and follow a Swedish-taught programme: your Swedish.`,
    `If you're coming from ${country.name} to study ${sm.field} in Sweden, the academic side is only half the picture — where a programme is taught in Swedish, the language pathway is what turns an offer into a place you can fully live and learn in.`,
  ];
  const uniLine = taught
    ? `${uni.name} — based in ${uniPlace} — lists programmes associated with ${subject.name.toLowerCase()}${uni.subjects.length ? ` (fields such as ${uni.subjects.slice(0, 3).join(", ")})` : ""}. Your degree background matters for admission, but Swedish proficiency is assessed separately.`
    : `${uni.name} — based in ${uniPlace} — is in our directory, but its public listing doesn't specifically show ${subject.name.toLowerCase()}. For a verified overview see the ${subject.name} in Sweden guide; here we focus on the Swedish-language pathway, which applies wherever you study.`;

  return {
    h1: `Study ${subject.name} in Sweden from ${country.name}`,
    subtitle: `Reference institution: ${uni.name} (${uniPlace})`,
    metaTitle: `Study ${subject.name} in Sweden from ${country.name} — Swedish language pathway`,
    metaDescription: `The Swedish-language route for ${country.name} students studying ${sm.field} in Sweden — the Svenska 3 / Tisus admission requirement, degree recognition via ${origin.recognitionBody}, and honest readiness practice. A practice estimate, not an official result.`,
    canonicalPath,
    indexable: taught,
    intro: [pick(introVariants, seed), uniLine],
    sections: [
      {
        heading: "The Swedish-language requirement",
        body: [
          `Sweden offers a large number of English-taught programmes, especially at master's level — those may not require Swedish for admission. For a Swedish-taught programme, the general entry requirement is Swedish equivalent to the upper-secondary course Svenska 3 (or Svenska som andraspråk 3). If you didn't go through Swedish upper secondary, the usual routes are ${TISUS.name} — which is accepted as equivalent to Svenska 3 — or a qualifying course in Swedish (behörighetsgivande kurs). Either way you'll need Swedish for paperwork, part-time work and everyday life. Confirm the exact requirement with the specific university and programme.`,
          sm.regulated
            ? `${subject.name} is often a regulated field: beyond admission, professional practice in Sweden can require a licence (legitimation) from Socialstyrelsen (the National Board of Health and Welfare) for healthcare roles, which sets its own Swedish requirement and its own assessment of your qualifications. Treat the exam as one step and confirm the current process with the relevant Swedish authority.`
            : `For ${sm.field}, getting comfortably past B1–B2 on the way to Svenska 3 / ${TISUS.name} lets you follow a Swedish-taught programme, write assignments and integrate — aim a level above the minimum if you can.`,
        ],
      },
      recognitionSection,
      {
        heading: `Practise for ${examLabel(level)} — honestly`,
        body: [
          `AlmiSwedish lets you practise the four skills — Reading (Läsförståelse), Listening (Hörförståelse), Writing (Skriftlig framställning) and Speaking (Muntlig framställning) — at ${level.name} and the levels leading up to it. ${READINESS_LINE}`,
          CTA_LINE,
        ],
      },
      {
        heading: "Thinking about staying after your studies?",
        body: [`If you plan to remain in Sweden after graduating, the language also matters for settling in and, later, citizenship. ${CITIZENSHIP_HEDGE}`],
      },
    ],
    faq: [
      { q: `Do I need Swedish to study ${subject.name} in Sweden?`, a: `For Swedish-taught programmes, yes — the general requirement is Swedish equivalent to Svenska 3, which ${TISUS.name} satisfies. Many English-taught master's waive it for admission, but you'll still need Swedish day-to-day. Confirm with the university.` },
      { q: `Will a Swedish degree be recognised in ${country.name}?`, a: origin.localized
        ? `Recognition of a foreign degree in ${country.name} goes through ${origin.recognitionBody}. ${origin.equivalenceNote} Confirm the current process on the official site${origin.recognitionUrl ? ` (${origin.recognitionUrl})` : ""}.`
        : origin.equivalenceNote },
      { q: `Which level should I aim for?`, a: `Swedish-taught higher education asks for Svenska 3 or its equivalent, and ${TISUS.name} (≈C1) is the usual route for applicants educated outside Sweden. Regulated fields and professional practice may need more. AlmiSwedish shows an honest per-skill readiness band, not an official score.` },
      { q: `Is the readiness estimate my real result?`, a: `No. It's a practice estimate against the real criteria to guide your prep. Only the official assessment issues a real result.` },
    ],
    related: [
      { href: `/exams/${level.slug}`, label: `${examLabel(level)} exam guide` },
      { href: `/exams/${SVENSKA_B1B2.slug}`, label: `${examLabel(SVENSKA_B1B2)} — the step before Tisus` },
      { href: `/exams/${MEDBORGARSKAPSPROV.slug}`, label: `${MEDBORGARSKAPSPROV.name} — the citizenship society test` },
      ...relatedStudy(subject, country, seed),
    ],
    breadcrumbs: [
      { name: "Study in Sweden", path: "/study-in-sweden" },
      { name: subject.name, path: `/study-in-sweden/${subject.slug}` },
      { name: country.name, path: path },
    ],
    jsonLd: faqJsonLd([
      { q: `Do I need Swedish to study ${subject.name} in Sweden?`, a: `For Swedish-taught programmes the general requirement is Swedish equivalent to Svenska 3, which Tisus satisfies; many English-taught master's waive it for admission. Confirm with the university.` },
    ], `${SITE}${path}`, `Study ${subject.name} in Sweden from ${country.name}`),
  };
}

// ---- JOBS PAGE --------------------------------------------------------------
export function buildJobsPage(role: SeoRole, country: SeoCountry, hub: SeoHub, origin: OriginBlock): SeoPage {
  const path = jobsPath(role.slug, country.slug, hub.slug);
  const seed = hash(path);
  const clientFacing = role.collar === "pink" || role.collar === "white";

  const introVariants = [
    `Moving from ${country.name} to work as a ${role.name} in ${hub.name}, Sweden? ${hub.profile} How much Swedish you need depends a lot on the role — and it's easy to underestimate.`,
    `${role.name}s from ${country.name} looking at ${hub.name} face two questions: is there demand, and how good does my Swedish need to be? ${hub.profile}`,
    `Working in Sweden as a ${role.name} — coming from ${country.name} — often starts with the language. ${hub.name}: ${hub.profile}`,
  ];

  return {
    h1: `Work in Sweden as a ${role.name} from ${country.name}`,
    subtitle: `${hub.name} · ${hub.region}`,
    metaTitle: `Work in Sweden as a ${role.name} from ${country.name} (${hub.name}) — the Swedish you'll need`,
    metaDescription: `The Swedish-language side of working as a ${role.name} in ${hub.name}, Sweden, coming from ${country.name} — how much you'll need, which level, home-qualification recognition via ${origin.recognitionBody}, and honest readiness practice. Confirm specifics with employers and regulators.`,
    canonicalPath: path,
    indexable: true,
    intro: [pick(introVariants, seed)],
    sections: [
      {
        heading: `How much Swedish does a ${role.name} need?`,
        body: [
          clientFacing
            ? `As a ${role.name}, you'll likely deal with colleagues, clients or patients directly, so employers often expect conversational-to-professional Swedish — think B1–B2 and up. Even in workplaces that use English, Swedish widens your options in ${hub.name}.`
            : `A ${role.name} in a technical or international team in ${hub.name} may work largely in English — common in parts of Swedish tech, life sciences and engineering. But Swedish still helps with admin, teammates and everyday life — and it's important if you plan to stay long-term.`,
          `Some professions are regulated and need formal recognition plus a set Swedish level — for healthcare roles that runs through Socialstyrelsen (the National Board of Health and Welfare), which issues the licence (legitimation). Confirm the exact requirement with the employer and the relevant Swedish regulator. ${origin.localized ? `If you trained in ${country.name}, your qualification's home recognition runs through ${origin.recognitionBody}${origin.recognitionUrl ? ` (${origin.recognitionUrl})` : ""}; ${origin.equivalenceNote}` : origin.equivalenceNote} A common concern coming from ${country.name}: "${cleanConcern(origin.commonConcern)}".${origin.searchTerms.length ? ` Searches from ${country.name} often include: ${origin.searchTerms.join(", ")}.` : ""}`,
        ],
      },
      {
        heading: "Settling in Sweden, and later citizenship",
        body: [`If working in ${hub.name} is a step toward settling in Sweden, the language matters beyond the job. ${CITIZENSHIP_HEDGE} ${origin.citizenshipNote}`],
      },
      {
        heading: "Practise the Swedish you'll actually use — honestly",
        body: [
          `Practise Reading, Listening, Writing and Speaking at the level you need. ${READINESS_LINE}`,
          CTA_LINE,
        ],
      },
    ],
    faq: [
      { q: `Do I need Swedish to work as a ${role.name} in Sweden?`, a: `It depends on the role. Client-facing and regulated jobs usually expect B1–B2 or more; some technical roles in ${hub.name} run in English. You'll still need Swedish for daily life and long-term stay. Confirm with the employer.` },
      { q: `Which Swedish level should I practise?`, a: `Many jobs want B1–B2, which is roughly where ${SFI_CD.name} finishes and ${examLabel(SVENSKA_B1B2)} builds on. Swedish-taught university study needs more (${TISUS.name}). AlmiSwedish shows an honest readiness band, never an official result.` },
    ],
    related: [
      { href: `/exams/${SVENSKA_B1B2.slug}`, label: `${examLabel(SVENSKA_B1B2)} — working Swedish` },
      { href: `/exams/${SFI_CD.slug}`, label: `${examLabel(SFI_CD)} exam guide` },
      ...HUBS.filter((h) => h.slug !== hub.slug).map((h) => ({ href: jobsPath(role.slug, country.slug, h.slug), label: `${role.name} in ${h.name}` })),
    ],
    breadcrumbs: [
      { name: "Work in Sweden", path: "/work-in-sweden" },
      { name: role.name, path: `/work-in-sweden/${role.slug}` },
      { name: `${country.name} · ${hub.name}`, path: path },
    ],
    jsonLd: faqJsonLd([
      { q: `Do I need Swedish to work as a ${role.name} in Sweden?`, a: `It depends on the role; client-facing and regulated jobs usually expect B1–B2. Confirm with the employer.` },
    ], `${SITE}${path}`, `Work in Sweden as a ${role.name} from ${country.name}`),
  };
}

// ---- EXAM LEVEL PAGE --------------------------------------------------------
export function buildLevelPage(exam: ExamMeta): SeoPage {
  const path = `/exams/${exam.slug}`;
  const isLead = exam.lead === true; // Medborgarskapsprovet — the citizenship society test
  const isUniversity = exam.track === "UNIVERSITY"; // Tisus
  const isKnowledge = exam.knowledge === true; // Medborgarskapsprovet

  // The society test is new and provisional. Every claim about its shape is
  // fenced behind SOCIETY_FORMAT_HEDGE, and we say plainly that the language
  // component does not exist yet rather than letting readers assume it does.
  const knowledgeLine = ` It is a multiple-choice test of knowledge about Swedish society — a knowledge test, not a language-proficiency exam. UHR develops, administers and marks it; Migrationsverket assesses citizenship applications and instructs applicants to register.`;
  const universityLine = ` It is the advanced (≈C1) Swedish exam used for admission to Swedish-taught university programmes, run by Stockholms universitet, and it is accepted as equivalent to the upper-secondary course Svenska 3.`;
  const ladderLine = ` It sits on the Swedish ladder and assesses Reading (Läsförståelse), Listening (Hörförståelse), Writing (Skriftlig framställning) and Speaking (Muntlig framställning).`;
  const trackLine = isKnowledge ? knowledgeLine : isUniversity ? universityLine : ladderLine;

  const levelSentence = isKnowledge
    ? `${exam.name} is Sweden's new citizenship test of knowledge about Swedish society, introduced under rules in force since 6 June 2026 and mandatory for applicants aged 16–66.`
    : `${exam.name} sits at CEFR ${exam.cefr}.`;
  const levelQ = `What is ${exam.name}?`;
  const levelA = isKnowledge
    ? `${exam.name} is a multiple-choice knowledge test about Swedish society — not a language exam. ${SOCIETY_FORMAT_HEDGE} AlmiSwedish gives you honest original practice, never an official result.`
    : `${exam.name} maps to CEFR ${exam.cefr}. AlmiSwedish shows an honest per-skill readiness band, not an official result.`;

  const skillsAssessed = isKnowledge
    ? " It is answered as multiple-choice questions; a strong result means you know the material well."
    : " It assesses Reading, Listening, Writing and Speaking; a strong result means being ready across all four.";

  return {
    h1: isKnowledge
      ? `${exam.name} — Sweden's citizenship test of society knowledge`
      : isUniversity
        ? `${exam.name} (${exam.cefr}) — Swedish for university admission`
        : `${examLabel(exam)} — Swedish exam`,
    subtitle: exam.blurb,
    metaTitle: isKnowledge
      ? `${exam.name}: Sweden's new citizenship test — what's known, and honest practice`
      : isUniversity
        ? `${exam.name}: Swedish for university admission — format & honest practice`
        : `${examLabel(exam)} — Swedish exam format & honest practice`,
    metaDescription: `${examLabel(exam)}: what it tests, how it's structured, and honest readiness practice. ${isKnowledge ? "New in 2026 — the first sitting is a pilot and UHR has published no pass mark. Confirm current rules with UHR and Migrationsverket." : isUniversity ? "Accepted as equivalent to Svenska 3. A practice estimate, not an official result." : "A practice estimate, not an official result."}`,
    canonicalPath: path,
    indexable: true,
    intro: [
      `${levelSentence}${trackLine}${skillsAssessed}`,
    ],
    sections: [
      isKnowledge
        ? { heading: "What is actually known about this test", body: [SOCIETY_FORMAT_HEDGE, CITIZENSHIP_HEDGE] }
        : isUniversity
          ? { heading: `Who ${exam.name} is for`, body: [`${exam.blurb} For a Swedish-taught programme, the general entry requirement is Swedish equivalent to Svenska 3 — and ${exam.name} is accepted as equivalent. A qualifying course in Swedish (behörighetsgivande kurs) is the other common route. Confirm with the university and programme.`] }
          : { heading: `Who ${exam.name} is for`, body: [`${exam.blurb} It suits learners who can already handle Swedish at roughly ${exam.cefr} and want an honest read on whether they're ready across all four skills.`] },
      ...(isKnowledge
        ? [{
            heading: "Our practice is not UHR's test",
            body: [
              `Our questions are original practice written against the 13 society areas UHR's own study material Sverige i fokus covers — they are not UHR's question bank, and no practice score here is an official result. UHR has said plainly that it does not stand behind unofficial practice tests found online and that their quality is not checked by UHR. That includes ours. Use UHR's free material as your source of truth; use this to find your gaps.`,
            ],
          }]
        : []),
      {
        heading: "Honest readiness, not a fake score",
        body: [
          isKnowledge
            ? `Every question is auto-marked so you see exactly where you stand. Because UHR has not published a pass mark, we do not show one — we show what you got right and where the gaps are. ${READINESS_LINE}`
            : `Reading and Listening are auto-marked to a clear per-skill band — Clear or Borderline — against the real criteria. Writing and Speaking get AI feedback labelled an estimate. ${READINESS_LINE}`,
          isKnowledge ? CTA_LINE_KNOWLEDGE : CTA_LINE,
        ],
      },
      {
        heading: "Prepare by where you're coming from",
        body: [`Studying or working in Sweden? See the language pathway for your situation — from any country, for study or work.`],
      },
    ],
    faq: [
      { q: levelQ, a: levelA },
      isKnowledge
        ? { q: `Is there a Swedish language test for citizenship too?`, a: `Not yet. A language component is planned, but UHR indicates it cannot be ready before autumn 2028 at the earliest and no CEFR level has been set. We do not sell practice for it, because there is nothing published to practise against. The Swedish ladder on this site builds the language you'll need either way — but it is not the citizenship language test.` }
        : { q: `Is my AlmiSwedish result official?`, a: `No — it's an honest practice estimate to guide your prep. Only the official assessment issues a real result.` },
      ...(isKnowledge
        ? [{ q: `What score do I need to pass ${exam.name}?`, a: `UHR has not published a pass mark, so nobody can honestly tell you. Anyone quoting one is guessing. The first sitting, on 15 August 2026, is a pilot (utprövningsprov) and is free of charge. Check UHR for the current details.` }]
        : []),
    ],
    related: [
      ...ALL_EXAMS.filter((e) => e.slug !== exam.slug).map((e) => ({ href: `/exams/${e.slug}`, label: examLabel(e) })),
    ],
    breadcrumbs: [
      { name: "Swedish exams", path: "/exams" },
      { name: examLabel(exam), path: path },
    ],
    jsonLd: faqJsonLd(
      [{ q: levelQ, a: levelA }],
      `${SITE}${path}`,
      `${examLabel(exam)} — Swedish exam`,
    ),
  };
}

function faqJsonLd(faq: { q: string; a: string }[], url: string, name: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": url, name, url },
      { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
}

export { MISSION_LINE, MEDBORGARSKAPSPROV };
