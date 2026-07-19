// AlmiSwedish — the "Choose a Test" tree + exam metadata.
// Four goal-based tracks → exams → skills. Drives navigation, content filtering,
// and the honest readiness thresholds used by the scoring engine. All "pass"
// figures are framed as READINESS estimates, never an official UHR result.
//
// FACT BASE (verified 2026-07; re-check before editing any claim here):
//   • Law in force 6 June 2026: habitual residence 5 → 8 years, a self-sufficiency
//     requirement, and Medborgarskapsprovet mandatory for ages 16–66. No
//     transitional arrangements — Migrationsverket assesses undecided cases under
//     the new rules.
//   • UHR develops/administers/marks the test. Migrationsverket assesses
//     applications and instructs applicants to register.
//   • SOCIETY component only. First sitting 15 Aug 2026 at Stockholmsmässan is an
//     *utprövningsprov* (pilot), free of charge. Provisional format per UHR: ~60
//     four-option MCQ, 90 minutes, Swedish, on paper, from UHR's "Sverige i fokus".
//     PASS MARK NOT PUBLISHED.
//   • LANGUAGE component: UHR indicates autumn 2028 at the earliest; no CEFR level
//     set. We ship NO practice for it. Do not add one until UHR publishes a spec.
//   • Tisus: Stockholms universitet, ≈C1, for Swedish-taught university admission.
//     It IS a real pass/fail examination — the one exam here that awards a verdict.
//     ⚠️ FOUNDER-SUPPLIED, NOT YET SOURCED TO A URL: that Tisus is judged pass/fail
//     by Stockholms universitet. Treat as an assumption until confirmed against SU's
//     own page. The ≈C1 label remains OUR approximation — SU publishes no CEFR level,
//     so nothing may band a learner against C1.
//   • SFI: courses A–D over 3 study paths. Skolverket maps A/B ≈ A1–A2, C/D ≈
//     B1/B1+. The SFI scale is NOT CEFR — always say "approximately".
//   • Swedex is excluded: it cannot be taken after 31 Dec 2026.

import type {
  SwedishTrack,
  SwedishExam,
  LanguageExam,
  KnowledgeExam,
  SwedishSkill,
  LanguageSkill,
} from "./types";

export interface ExamMeta {
  exam: SwedishExam;
  track: SwedishTrack;
  slug: string; // URL slug
  name: string; // display name (official Swedish exam name)
  cefr: string; // CEFR level label, or "Knowledge test" for the MCQ test
  // NOTE — there is deliberately NO goal level field on this interface, and that
  // absence is a finding rather than unfinished work.
  //
  // The siblings each band readiness against a verified pass mark: danish B2, dutch
  // A2, icelandic A2, norwegian B1 in the oral part alone. Sweden has none. No binding
  // language pass mark is in force (see LANGUAGE_TEST_HEDGE), and the `cefr` strings
  // below are approximations of where a course or test SITS ("≈A2–B1+"), not a
  // standard anyone is measured against. Collapsing one into a goal would manufacture
  // the very requirement this product refuses to invent.
  //
  // So every language skill here reports the level REACHED (achievedReadout in
  // grading.ts) instead of a readiness band. When a real standard is finally set,
  // add the goal then — sourced, not inferred from these labels.
  blurb: string; // one-line description
  // What the REAL result for this exam is, in one sentence — rendered under every
  // score so the estimate is framed against the right thing.
  //
  // This exists because a single blanket footer cannot be honest across this list.
  // "There is no pass mark to measure this against" is true of the citizenship
  // LANGUAGE component (which we deliberately ship no practice for) and vacuously
  // true of our own B1–B2 ladder — but it is FALSE of Tisus, which is a real
  // examination with a real verdict. Asserting it there would be the mirror image
  // of inventing a standard: denying one that exists.
  //
  // Optional on purpose. An exam whose result basis is not yet sourced must be able
  // to say nothing rather than be forced into a sentence someone made up.
  resultBasis?: string;
  skills: SwedishSkill[];
  knowledge?: boolean; // true = society/citizenship MCQ test (single KNOWLEDGE module)
  lead?: boolean; // the citizenship hook — Medborgarskapsprovet
  mockMinutes: number; // full timed mock duration guidance
  isNew?: boolean; // test is new/provisional — UI must show the hedge
}

// Medborgarskapsprovet is developed, administered and marked by UHR; citizenship
// applications are assessed by Migrationsverket. We never present a practice score
// as an official result from either. UHR explicitly disclaims responsibility for
// unofficial practice tests online — so our not-official framing must stay loud.
export const AUTHORITY = {
  ministry: "UHR (Universitets- och högskolerådet, the Swedish Council for Higher Education)",
  agency: "Migrationsverket (the Swedish Migration Agency)",
} as const;

// Citizenship framing — hedged on purpose, because the test is genuinely new and
// still moving. Everything asserted below is published by UHR or Migrationsverket.
export const CITIZENSHIP_HEDGE =
  "Under rules in force since 6 June 2026, Swedish citizenship requires habitual residence of eight years (the main rule), self-sufficiency, and — for applicants aged 16–66 — Medborgarskapsprovet. Only the society component exists so far: UHR's first sitting, on 15 August 2026, is a pilot. A Swedish language test is planned, but UHR indicates it will not be ready before autumn 2028 and no level has been set. The rules are new and still changing — confirm the current requirements with UHR and Migrationsverket before you plan.";

// The single sentence that governs every claim about the society test's shape.
export const SOCIETY_FORMAT_HEDGE =
  "UHR describes the test provisionally as around 60 multiple-choice questions with four options, in about 90 minutes, in Swedish and on paper, drawn from its own study material Sverige i fokus. UHR has not published a pass mark, and the format may change before the test is established — confirm the current details with UHR.";

// The language component. Stated plainly rather than implied, so nobody buys a
// subscription expecting practice for a test that does not exist yet.
export const LANGUAGE_TEST_HEDGE =
  "The Swedish language component of the citizenship test does not exist yet. UHR indicates it cannot be ready before autumn 2028 at the earliest, and no CEFR level has been set for it. We do not offer practice for it, because there is nothing published to practise against. The general Swedish ladder below builds the language you will need either way — but it is not the citizenship language test, and we will not pretend otherwise.";

// Per-skill readiness thresholds (honest). We show a per-skill readiness band as
// an estimate, clearly labelled — never an official UHR result.
export const READY_PCT = 70; // CLEAR — comfortably meeting the level's demands
export const BORDERLINE_PCT = 55; // BORDERLINE — close, needs consolidation

export const LANGUAGE_SKILLS: LanguageSkill[] = ["READING", "LISTENING", "WRITING", "SPEAKING"];

export const SKILL_LABELS: Record<SwedishSkill, { sv: string; en: string }> = {
  READING: { sv: "Läsförståelse", en: "Reading" },
  LISTENING: { sv: "Hörförståelse", en: "Listening" },
  WRITING: { sv: "Skriftlig framställning", en: "Writing" },
  SPEAKING: { sv: "Muntlig framställning", en: "Speaking" },
  KNOWLEDGE: { sv: "Samhällskunskap", en: "Knowledge" },
};

// Track A — the Swedish language ladder. SFI A–B → SFI C–D → general B1–B2 → Tisus.
// Note what is NOT here: an exam for the citizenship language component. It has no
// published spec (see LANGUAGE_TEST_HEDGE).
export const LANGUAGE_EXAMS: ExamMeta[] = [
  {
    exam: "SFI_AB", track: "GETTING_STARTED", slug: "sfi-ab", name: "SFI Courses A–B", cefr: "≈A1–A2",
    blurb: "The first steps in Svenska för invandrare — everyday Swedish for work, family and daily life.",
    resultBasis:
      "SFI is a course, not a single exam — the result that counts comes from your school's assessment of the course, and Skolverket's SFI scale is not CEFR.",
    skills: ["READING", "LISTENING", "WRITING", "SPEAKING"], mockMinutes: 150,
  },
  {
    exam: "SFI_CD", track: "PROFICIENCY", slug: "sfi-cd", name: "SFI Courses C–D", cefr: "≈A2–B1+",
    blurb: "The SFI exit courses — Skolverket places Course D at roughly B1/B1+, the level most people aim to finish on.",
    resultBasis:
      "SFI is a course, not a single exam — the result that counts comes from your school's assessment of the course, and Skolverket's SFI scale is not CEFR.",
    skills: ["READING", "LISTENING", "WRITING", "SPEAKING"], mockMinutes: 180,
  },
  {
    exam: "SVENSKA_B1B2", track: "PROFICIENCY", slug: "svenska-b1b2", name: "Swedish B1–B2", cefr: "B1–B2",
    blurb: "General Swedish beyond SFI — the level that makes work, study and daily life in Sweden genuinely comfortable.",
    resultBasis:
      "This ladder is not an exam and no body awards a result for it — the level shown is only what these tasks evidence.",
    skills: ["READING", "LISTENING", "WRITING", "SPEAKING"], mockMinutes: 240,
  },
  {
    exam: "TISUS", track: "UNIVERSITY", slug: "tisus", name: "Tisus", cefr: "≈C1",
    blurb: "Test i svenska för universitets- och högskolestudier — the established route into Swedish-taught degree programmes, run by Stockholms universitet.",
    // The one exam here with a real verdict. Say so — denying it would be as
    // dishonest as inventing a standard elsewhere. But the ≈C1 is ours, not SU's,
    // so nothing may band a learner against C1.
    resultBasis:
      "Tisus is a real examination, judged pass/fail by Stockholms universitet against its own criteria. Stockholms universitet publishes no CEFR level for it — the ≈C1 label is our approximation, not a mark you are measured against.",
    skills: ["READING", "LISTENING", "WRITING", "SPEAKING"], mockMinutes: 300,
  },
];

// Track B — the one Swedish society knowledge test. Multiple-choice, not language
// proficiency. New in 2026 and still provisional: every surface that renders this
// exam must also render SOCIETY_FORMAT_HEDGE.
export const KNOWLEDGE_EXAMS: ExamMeta[] = [
  {
    exam: "MEDBORGARSKAPSPROV", track: "CITIZENSHIP", slug: "medborgarskapsprov", name: "Medborgarskapsprovet", cefr: "Knowledge test",
    blurb: "Sweden's new citizenship test — knowledge of Swedish society, in multiple-choice form, developed and marked by UHR. Mandatory for applicants aged 16–66. The first sitting, on 15 August 2026, is a pilot.",
    resultBasis:
      "UHR has not published a pass mark for Medborgarskapsprovet, so there is no threshold to measure a score against yet.",
    skills: ["KNOWLEDGE"], knowledge: true, lead: true, isNew: true, mockMinutes: 90,
  },
];

export const ALL_EXAMS: ExamMeta[] = [...LANGUAGE_EXAMS, ...KNOWLEDGE_EXAMS];

// The goal-based "Choose a Test" tree. Each track is a reason someone studies
// Swedish; the exams under it are what that goal commonly requires.
export interface TrackMeta {
  track: SwedishTrack;
  label: string; // short UI label
  goal: string; // what this path is for
  requires: string; // the exams commonly required, in plain words
  examSlugs: string[]; // ordered exam slugs for this track
  lead?: boolean;
  caveat?: string; // shown wherever the track is surfaced
}

export const TRACKS: TrackMeta[] = [
  {
    track: "CITIZENSHIP", label: "Swedish citizenship", goal: "Working toward Swedish citizenship",
    requires: "Medborgarskapsprovet — the society component",
    examSlugs: ["medborgarskapsprov"], lead: true,
    caveat:
      "The society component is the only part that exists; a language test is expected no earlier than autumn 2028. Citizenship also requires eight years' habitual residence (the main rule) and self-sufficiency — confirm with Migrationsverket.",
  },
  {
    track: "UNIVERSITY", label: "University admission", goal: "Applying to a Swedish-taught degree",
    requires: "Tisus (≈C1)",
    examSlugs: ["tisus"],
  },
  {
    track: "GETTING_STARTED", label: "Getting started", goal: "Starting out in Swedish",
    requires: "SFI Courses A–B (≈A1–A2)",
    examSlugs: ["sfi-ab"],
  },
  {
    track: "PROFICIENCY", label: "Building proficiency", goal: "Getting to a working level of Swedish",
    requires: "SFI Courses C–D (≈A2–B1+) → Swedish B1–B2",
    examSlugs: ["sfi-cd", "svenska-b1b2"],
  },
];

export function examBySlug(slug: string): ExamMeta | undefined {
  return ALL_EXAMS.find((e) => e.slug === slug);
}

export function examsByTrack(track: SwedishTrack): ExamMeta[] {
  return ALL_EXAMS.filter((e) => e.track === track);
}

export function trackMeta(track: SwedishTrack): TrackMeta | undefined {
  return TRACKS.find((t) => t.track === track);
}

const LANGUAGE_EXAM_IDS: LanguageExam[] = ["SFI_AB", "SFI_CD", "SVENSKA_B1B2", "TISUS"];
const KNOWLEDGE_EXAM_IDS: KnowledgeExam[] = ["MEDBORGARSKAPSPROV"];

export function isLanguageExam(exam: SwedishExam): exam is LanguageExam {
  return (LANGUAGE_EXAM_IDS as string[]).includes(exam);
}

export function isKnowledgeExam(exam: SwedishExam): exam is KnowledgeExam {
  return (KNOWLEDGE_EXAM_IDS as string[]).includes(exam);
}

/** The lead exam (Medborgarskapsprovet) — the citizenship hook. */
export function leadExam(): ExamMeta {
  return ALL_EXAMS.find((e) => e.lead) ?? KNOWLEDGE_EXAMS[0];
}
