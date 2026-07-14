// Deterministic, honest, varied content generator for the pSEO matrix.
// Every page is composed from its axes' REAL attributes; phrasing variants are
// selected by hash(slug) so text distributes across millions of pages without
// thin duplication. Honesty guardrails (spec §7): readiness = band/estimate,
// never an official UDI / Ministry result; citizenship NEVER a fixed year
// count — always "confirm with UDI".

import { ALL_EXAMS, examBySlug, type ExamMeta } from "@/lib/no/registry";
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

const SITE = "https://alminorwegian.almiworld.com";

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

// The exam anchors the funnel links to. Norskprøven B1–B2 (B1–B2) is the
// citizenship language exam and the lead hook; Norskprøven A2–B1 (A2–B1) is the
// permanent-residence exam; Bergenstesten (≈C1) is the university route; the
// Statsborgerprøven is the citizenship society-knowledge test.
const NORSKPROVE_B1B2 = examBySlug("norskprove-b1b2")!; // citizenship language exam (B1–B2)
const NORSKPROVE_A2B1 = examBySlug("norskprove-a2b1")!; // permanent residence (A2–B1)
const STUDIE = examBySlug("bergenstesten")!; // university admission (≈C1)
const INDF = examBySlug("statsborgerproven")!; // citizenship knowledge test

// A short roster of well-known Norwegian universities, named generically so the
// copy never fabricates a specific programme claim.
const DK_UNIS = "the University of Copenhagen, Aarhus University and other Norwegian universities";

// Shared honest fragments -----------------------------------------------------
const READINESS_LINE =
  "AlmiNorwegian gives you an honest readiness estimate — a per-skill band (Clear or Borderline) against each exam's real criteria — never an invented official UDI or Ministry result.";
const CITIZENSHIP_HEDGE =
  "Norwegian citizenship commonly requires Norskprøven B1–B2 (B1–B2) and the Statsborgerprøven (a Norwegian society knowledge test), alongside residency and other conditions. The exams sit under the HK-dir (the Directorate for Higher Education and Skills), and applications are handled by UDI. The rules change, so we don't state a fixed number of residency years or a fixed step — always confirm the current requirement with UDI. We help you prepare fairly; we never claim to help anyone shortcut or beat the process.";
const MISSION_LINE =
  "25% of AlmiNorwegian proceeds fund the Shamool Foundation's social mission.";
const CTA_LINE =
  "Reading and Listening practice is free; AI feedback on Writing and Speaking and the full timed mock become available with a 7-day free trial ($12/month after, cancel anytime).";

function levelForSubject(subjectSlug: string): ExamMeta {
  // Norwegian-taught study typically asks for roughly B1–B2. We point demanding /
  // regulated fields at Norskprøven B1–B2 (B1–B2) and others at Norskprøven A2–B1
  // (A2–B1) as the honest general practice target; the specific university sets
  // its own exact required level (Bergenstesten for higher-level programmes).
  return SUBJECT_META[subjectSlug]?.regulated ? NORSKPROVE_B1B2 : NORSKPROVE_A2B1;
}

// Display label for an exam. Append the level only when the name doesn't already
// carry it, to avoid "Norskprøven B1–B2 (B1–B2)" duplication when the name already
// shows the level. Knowledge tests carry "Knowledge test" as their level label.
function examLabel(e: ExamMeta): string {
  return e.name.includes(e.cefr) ? e.name : `${e.name} (${e.cefr})`;
}

// A few sibling internal links (same subject, other origin countries).
function relatedStudy(subject: SeoSubject, country: SeoCountry, seed: number): { href: string; label: string }[] {
  const others = COUNTRIES.filter((c) => c.slug !== country.slug);
  const picks = [others[seed % others.length], others[(seed * 7 + 3) % others.length], others[(seed * 13 + 5) % others.length]]
    .filter((c, i, a) => c && a.findIndex((x) => x.slug === c.slug) === i);
  const uniPick = UNIVERSITIES[(seed * 17) % UNIVERSITIES.length];
  return picks.map((c) => ({ href: studyPath(subject.slug, c.slug, uniPick.slug), label: `${subject.name} in Norway from ${c.name}` }));
}

// ---- STUDY PAGE -------------------------------------------------------------
export function buildStudyPage(subject: SeoSubject, country: SeoCountry, uni: SeoUniversity, origin: OriginBlock): SeoPage {
  const path = studyPath(subject.slug, country.slug, uni.slug);
  const seed = hash(path);
  const sm = SUBJECT_META[subject.slug] ?? { field: subject.name.toLowerCase(), regulated: false };
  const level = levelForSubject(subject.slug);
  const uniPlace = [uni.city, uni.countryName].filter(Boolean).join(", ");

  // TAUGHT-GATE (rule #3): index only where the reference institution actually
  // lists the subject. A thin, untaught cell is noindexed and canonicals UP to
  // the subject hub — a route that EXISTS — never to a subject×origin URL with
  // no page (404). Taught leaves stay self-canonical + indexed (real intent).
  const taught = uniTeaches(uni, subject.slug);
  const canonicalPath = taught ? path : `/study-in-norway/${subject.slug}`;

  const recognitionSection = {
    heading: `Using a Norwegian degree back in ${country.name}`,
    body: [
      origin.localized
        ? `In ${country.name}, recognition of a foreign degree goes through ${origin.recognitionBody}${origin.recognitionUrl ? ` (${origin.recognitionUrl})` : ""}. ${origin.equivalenceNote}`
        : origin.equivalenceNote,
      `A common concern for students from ${country.name} — "${cleanConcern(origin.commonConcern)}" — is worth planning early, alongside the language requirement.${origin.sourceNote ? ` (${origin.sourceNote})` : ""}${origin.searchTerms.length ? ` Students from ${country.name} commonly search for: ${origin.searchTerms.join(", ")}.` : ""}`,
    ],
  };

  const introVariants = [
    `Planning to study ${sm.field} in Norway from ${country.name}? ${DK_UNIS} offer strong programmes across ${subject.name.toLowerCase()}. Many master's courses are taught in English — but for a Norwegian-taught programme, and for daily life, the step students most often underestimate is Norwegian itself.`,
    `${subject.name} is a popular reason students from ${country.name} look to Norway. Whichever university and town you aim for, one thing shapes how smoothly you settle in and follow a Norwegian-taught programme: your Norwegian.`,
    `If you're coming from ${country.name} to study ${sm.field} in Norway, the academic side is only half the picture — where a programme is taught in Norwegian, the language pathway is what turns an offer into a place you can fully live and learn in.`,
  ];
  const uniLine = taught
    ? `${uni.name} — based in ${uniPlace} — lists programmes associated with ${subject.name.toLowerCase()}${uni.subjects.length ? ` (fields such as ${uni.subjects.slice(0, 3).join(", ")})` : ""}. Your degree background matters for admission, but Norwegian proficiency is assessed separately.`
    : `${uni.name} — based in ${uniPlace} — is in our directory, but its public listing doesn't specifically show ${subject.name.toLowerCase()}. For a verified overview see the ${subject.name} in Norway guide; here we focus on the Norwegian-language pathway, which applies wherever you study.`;

  return {
    h1: `Study ${subject.name} in Norway from ${country.name}`,
    subtitle: `Reference institution: ${uni.name} (${uniPlace})`,
    metaTitle: `Study ${subject.name} in Norway from ${country.name} — Norwegian language pathway`,
    metaDescription: `The Norwegian-language route for ${country.name} students studying ${sm.field} in Norway — typical level (${examLabel(level)}), degree recognition via ${origin.recognitionBody}, and honest readiness practice. A practice estimate, not an official result.`,
    canonicalPath,
    indexable: taught,
    intro: [pick(introVariants, seed), uniLine],
    sections: [
      {
        heading: "The Norwegian-language requirement",
        body: [
          `Norway offers a number of English-taught programmes, especially at master's level — those may not require Norwegian for admission. Norwegian-taught programmes typically ask for roughly B1–B2, which maps to ${NORSKPROVE_A2B1.name} or ${NORSKPROVE_B1B2.name}, and higher-level admission may go through Bergenstesten. Either way you'll need Norwegian for paperwork, part-time work and everyday life. Confirm the exact requirement with the specific university and programme.`,
          sm.regulated
            ? `${subject.name} is often a regulated field: beyond admission, professional practice in Norway can require a set Norwegian level plus separate recognition of your qualifications (for example authorisation through the Norwegian Patient Safety Authority, Styrelsen for Patientsikkerhed, for healthcare roles). Treat the exam as one step and confirm recognition with the relevant Norwegian authority.`
            : `For ${sm.field}, a solid B1–B2 lets you follow a Norwegian-taught programme, write assignments and integrate — aim a level above the minimum if you can.`,
        ],
      },
      recognitionSection,
      {
        heading: `Practise for ${examLabel(level)} — honestly`,
        body: [
          `AlmiNorwegian lets you practise the four skills — Reading (Leseforståelse), Listening (Lytteforståelse), Writing (Skriftlig framstilling) and Speaking (Muntlig) — at ${level.name} and the surrounding levels. ${READINESS_LINE}`,
          CTA_LINE,
        ],
      },
      {
        heading: "Thinking about staying after your studies?",
        body: [`If you plan to remain in Norway after graduating, the language also matters for residency and, later, citizenship. ${CITIZENSHIP_HEDGE}`],
      },
    ],
    faq: [
      { q: `Do I need Norwegian to study ${subject.name} in Norway?`, a: `For Norwegian-taught programmes, usually around B1–B2. Many English-taught master's waive it for admission, but you'll still need Norwegian day-to-day. Confirm with the university.` },
      { q: `Will a Norwegian degree be recognised in ${country.name}?`, a: origin.localized
        ? `Recognition of a foreign degree in ${country.name} goes through ${origin.recognitionBody}. ${origin.equivalenceNote} Confirm the current process on the official site${origin.recognitionUrl ? ` (${origin.recognitionUrl})` : ""}.`
        : origin.equivalenceNote },
      { q: `Which level should I aim for?`, a: `Most Norwegian-taught higher education sits around ${NORSKPROVE_A2B1.name} to ${NORSKPROVE_B1B2.name}, and higher-level programmes may use Bergenstesten. Regulated fields and professional practice may need more. AlmiNorwegian shows an honest per-skill readiness band, not an official score.` },
      { q: `Is the readiness estimate my real result?`, a: `No. It's a practice estimate against the real criteria to guide your prep. Only the official assessment issues a real result.` },
    ],
    related: [
      { href: `/exams/${level.slug}`, label: `${examLabel(level)} exam guide` },
      { href: `/exams/${STUDIE.slug}`, label: `Bergenstesten — university admission` },
      { href: `/exams/${NORSKPROVE_B1B2.slug}`, label: `Norskprøven B1–B2 (B1–B2) — citizenship language exam` },
      ...relatedStudy(subject, country, seed),
    ],
    breadcrumbs: [
      { name: "Study in Norway", path: "/study-in-norway" },
      { name: subject.name, path: `/study-in-norway/${subject.slug}` },
      { name: country.name, path: path },
    ],
    jsonLd: faqJsonLd([
      { q: `Do I need Norwegian to study ${subject.name} in Norway?`, a: `For Norwegian-taught programmes, usually around B1–B2; many English-taught master's waive it for admission. Confirm with the university.` },
    ], `${SITE}${path}`, `Study ${subject.name} in Norway from ${country.name}`),
  };
}

// ---- JOBS PAGE --------------------------------------------------------------
export function buildJobsPage(role: SeoRole, country: SeoCountry, hub: SeoHub, origin: OriginBlock): SeoPage {
  const path = jobsPath(role.slug, country.slug, hub.slug);
  const seed = hash(path);
  const clientFacing = role.collar === "pink" || role.collar === "white";

  const introVariants = [
    `Moving from ${country.name} to work as a ${role.name} in ${hub.name}, Norway? ${hub.profile} How much Norwegian you need depends a lot on the role — and it's easy to underestimate.`,
    `${role.name}s from ${country.name} looking at ${hub.name} face two questions: is there demand, and how good does my Norwegian need to be? ${hub.profile}`,
    `Working in Norway as a ${role.name} — coming from ${country.name} — often starts with the language. ${hub.name}: ${hub.profile}`,
  ];

  return {
    h1: `Work in Norway as a ${role.name} from ${country.name}`,
    subtitle: `${hub.name} · ${hub.region}`,
    metaTitle: `Work in Norway as a ${role.name} from ${country.name} (${hub.name}) — the Norwegian you'll need`,
    metaDescription: `The Norwegian-language side of working as a ${role.name} in ${hub.name}, Norway, coming from ${country.name} — how much you'll need, which level, home-qualification recognition via ${origin.recognitionBody}, and honest readiness practice. Confirm specifics with employers and regulators.`,
    canonicalPath: path,
    indexable: true,
    intro: [pick(introVariants, seed)],
    sections: [
      {
        heading: `How much Norwegian does a ${role.name} need?`,
        body: [
          clientFacing
            ? `As a ${role.name}, you'll likely deal with colleagues, clients or patients directly, so employers often expect conversational-to-professional Norwegian — think B1–B2 and up. Even in workplaces that use English, Norwegian widens your options in ${hub.name}.`
            : `A ${role.name} in a technical or international team in ${hub.name} may work largely in English — common in parts of Norwegian tech, life sciences and shipping. But Norwegian still helps with admin, teammates and everyday life — and it's important if you plan to stay long-term.`,
          `Some professions are regulated and need formal recognition plus a set Norwegian level — confirm the exact requirement with the employer and the relevant Norwegian regulator. ${origin.localized ? `If you trained in ${country.name}, your qualification's home recognition runs through ${origin.recognitionBody}${origin.recognitionUrl ? ` (${origin.recognitionUrl})` : ""}; ${origin.equivalenceNote}` : origin.equivalenceNote} A common concern coming from ${country.name}: "${cleanConcern(origin.commonConcern)}".${origin.searchTerms.length ? ` Searches from ${country.name} often include: ${origin.searchTerms.join(", ")}.` : ""}`,
        ],
      },
      {
        heading: "Residency, and later citizenship",
        body: [`If working in ${hub.name} is a step toward settling in Norway, the language matters beyond the job. ${CITIZENSHIP_HEDGE} ${origin.citizenshipNote}`],
      },
      {
        heading: "Practise the Norwegian you'll actually use — honestly",
        body: [
          `Practise Reading, Listening, Writing and Speaking at the level you need. ${READINESS_LINE}`,
          CTA_LINE,
        ],
      },
    ],
    faq: [
      { q: `Do I need Norwegian to work as a ${role.name} in Norway?`, a: `It depends on the role. Client-facing and regulated jobs usually expect B1–B2 or more; some technical roles in ${hub.name} run in English. You'll still need Norwegian for daily life and long-term stay. Confirm with the employer.` },
      { q: `Which Norwegian level should I practise?`, a: `Norskprøven A2–B1 (A2–B1) is a common permanent-residence baseline and many jobs want B1–B2. AlmiNorwegian shows an honest readiness band, never an official result.` },
    ],
    related: [
      { href: `/exams/${NORSKPROVE_B1B2.slug}`, label: `Norskprøven B1–B2 (B1–B2) — citizenship language exam` },
      { href: `/exams/${NORSKPROVE_A2B1.slug}`, label: `${examLabel(NORSKPROVE_A2B1)} exam guide` },
      ...HUBS.filter((h) => h.slug !== hub.slug).map((h) => ({ href: jobsPath(role.slug, country.slug, h.slug), label: `${role.name} in ${h.name}` })),
    ],
    breadcrumbs: [
      { name: "Work in Norway", path: "/work-in-norway" },
      { name: role.name, path: `/work-in-norway/${role.slug}` },
      { name: `${country.name} · ${hub.name}`, path: path },
    ],
    jsonLd: faqJsonLd([
      { q: `Do I need Norwegian to work as a ${role.name} in Norway?`, a: `It depends on the role; client-facing and regulated jobs usually expect B1–B2. Confirm with the employer.` },
    ], `${SITE}${path}`, `Work in Norway as a ${role.name} from ${country.name}`),
  };
}

// ---- EXAM LEVEL PAGE --------------------------------------------------------
export function buildLevelPage(exam: ExamMeta): SeoPage {
  const path = `/exams/${exam.slug}`;
  const isLead = exam.lead === true; // Norskprøven B1–B2 — citizenship language exam
  const isUniversity = exam.track === "UNIVERSITY"; // Bergenstesten
  const isKnowledge = exam.knowledge === true; // Statsborgerprøven / Samfunnskunnskapsprøven

  const leadLine = ` It is the B1–B2 Norwegian exam commonly required for Norwegian citizenship, administered under the HK-dir (the Directorate for Higher Education and Skills) and covering Reading, Written Presentation and Speaking. Citizenship also requires the Statsborgerprøven and other conditions — confirm the current rules with UDI.`;
  const universityLine = ` It is the advanced (≈C1) Norwegian exam for admission to Norwegian-taught university programmes, assessing the four language skills at a high level.`;
  const knowledgeLine = ` It is a multiple-choice test of Norwegian society, history and culture — a knowledge test, not a language-proficiency exam.`;
  const ladderLine = ` It sits on the Norskprøven ladder and assesses Reading (Leseforståelse), Listening (Lytteforståelse), Writing (Skriftlig framstilling) and Speaking (Muntlig).`;
  const trackLine = isLead ? leadLine : isUniversity ? universityLine : isKnowledge ? knowledgeLine : ladderLine;

  const levelSentence = isKnowledge
    ? `${exam.name} is a Norwegian society knowledge test.`
    : `${exam.name} sits at CEFR ${exam.cefr}.`;
  const levelQ = `What is the ${exam.name}?`;
  const levelA = isKnowledge
    ? `${exam.name} is a multiple-choice knowledge test about Norwegian society — not a language exam. AlmiNorwegian gives you honest practice, never an official result.`
    : `${exam.name} maps to CEFR ${exam.cefr}. AlmiNorwegian shows an honest per-skill readiness band, not an official result.`;

  const skillsAssessed = isKnowledge
    ? " It is answered as multiple-choice questions; a strong result means you know the material well."
    : " It assesses Reading, Listening, Writing and Speaking; a strong result means being ready across all four.";

  return {
    h1: isLead
      ? `${exam.name} (${exam.cefr}) — the Norwegian citizenship language exam`
      : isKnowledge
        ? `${exam.name} — Norwegian society knowledge test`
        : `${examLabel(exam)} — Norwegian exam`,
    subtitle: exam.blurb,
    metaTitle: isLead
      ? `${exam.name}: the Norwegian citizenship language exam — format & honest practice`
      : isKnowledge
        ? `${exam.name} — Norwegian society knowledge test practice`
        : `${examLabel(exam)} — Norwegian exam format & honest practice`,
    metaDescription: `${examLabel(exam)}: what it tests, how it's structured, and honest readiness practice. ${isLead ? "Commonly required for Norwegian citizenship — confirm current residency rules with UDI." : isKnowledge ? "A practice knowledge test, not the official question bank." : "A practice estimate, not an official result."}`,
    canonicalPath: path,
    indexable: true,
    intro: [
      `${levelSentence}${trackLine}${skillsAssessed}`,
    ],
    sections: [
      isLead
        ? { heading: "Norskprøven B1–B2, residency and citizenship", body: [CITIZENSHIP_HEDGE] }
        : isKnowledge
          ? { heading: `About the ${exam.name}`, body: [`${exam.blurb} Our questions are original practice in the spirit of the real test — they are not the official question bank, and no practice score is an official result.`] }
          : { heading: `Who ${exam.name} is for`, body: [`${exam.blurb} It suits learners who can already handle Norwegian at roughly ${exam.cefr} and want an honest read on whether they're ready across all four skills.`] },
      {
        heading: "Honest readiness, not a fake score",
        body: [
          isKnowledge
            ? `Every question is auto-marked so you see exactly where you stand. ${READINESS_LINE}`
            : `Reading and Listening are auto-marked to a clear per-skill band — Clear or Borderline — against the real criteria. Writing and Speaking get AI feedback labelled an estimate. ${READINESS_LINE}`,
          CTA_LINE,
        ],
      },
      {
        heading: "Prepare by where you're coming from",
        body: [`Studying or working in Norway? See the language pathway for your situation — from any country, for study or work.`],
      },
    ],
    faq: [
      { q: levelQ, a: levelA },
      isLead
        ? { q: `Is Norskprøven B1–B2 what I need for Norwegian citizenship?`, a: `Norskprøven B1–B2 (B1–B2) is the language exam commonly required for naturalisation, together with the Statsborgerprøven. There are also residency and other conditions, and rules change — confirm the current requirement with UDI. We help you prepare fairly, never to shortcut the process.` }
        : { q: `Is my AlmiNorwegian result official?`, a: `No — it's an honest practice estimate to guide your prep. Only the official assessment issues a real result.` },
    ],
    related: [
      ...ALL_EXAMS.filter((e) => e.slug !== exam.slug).map((e) => ({ href: `/exams/${e.slug}`, label: examLabel(e) })),
    ],
    breadcrumbs: [
      { name: "Norwegian exams", path: "/exams" },
      { name: examLabel(exam), path: path },
    ],
    jsonLd: faqJsonLd(
      [{ q: levelQ, a: levelA }],
      `${SITE}${path}`,
      `${examLabel(exam)} — Norwegian exam`,
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

export { MISSION_LINE, INDF };
