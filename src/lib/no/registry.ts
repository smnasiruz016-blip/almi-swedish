// AlmiNorwegian — the "Choose a Test" tree + exam metadata.
// Four goal-based tracks → exams → skills. Drives navigation, content filtering,
// and the honest readiness thresholds used by the scoring engine. All "pass"
// figures are framed as READINESS estimates, never the official UDI / Ministry
// result.

import type {
  NorwegianTrack,
  NorwegianExam,
  LanguageExam,
  KnowledgeExam,
  NorwegianSkill,
  LanguageSkill,
} from "./types";

export interface ExamMeta {
  exam: NorwegianExam;
  track: NorwegianTrack;
  slug: string; // URL slug
  name: string; // display name (official Norwegian exam name)
  cefr: string; // CEFR level label, or "Knowledge test" for the MCQ tests
  blurb: string; // one-line description
  skills: NorwegianSkill[];
  knowledge?: boolean; // true = society/citizenship MCQ test (single KNOWLEDGE module)
  lead?: boolean; // citizenship-relevant (Norskprøven B1–B2) — the lead hook
  mockMinutes: number; // full timed mock duration guidance
}

// The exams are administered under the HK-dir (the Directorate for Higher Education and Skills);
// residency and citizenship applications are handled by UDI. We never present a
// practice score as an official result from either.
export const AUTHORITY = {
  ministry: "HK-dir (the Directorate for Higher Education and Skills)",
  agency: "UDI (Utlendingsdirektoratet)",
} as const;

// Citizenship / residency framing — hedged on purpose. The rules shift, so we
// point people to UDI rather than stating fixed residency years or implying a
// shortcut.
export const CITIZENSHIP_HEDGE =
  "Norwegian citizenship commonly requires Norskprøven B1–B2 and the Statsborgerprøven, alongside residency and other conditions. The rules change over time — confirm the current requirements with UDI before you plan.";
export const RESIDENCE_HEDGE =
  "Permanent residence commonly requires Norskprøven A2–B1 and the Samfunnskunnskapsprøven, alongside residency, employment and other conditions. Confirm the current rules with UDI.";

// Per-skill readiness thresholds (honest). The exams are pass/fail against
// official criteria; we show a per-skill readiness band as an estimate, clearly
// labelled — never an official UDI / Ministry result.
export const READY_PCT = 70; // CLEAR — comfortably meeting the level's demands
export const BORDERLINE_PCT = 55; // BORDERLINE — close, needs consolidation

export const LANGUAGE_SKILLS: LanguageSkill[] = ["READING", "LISTENING", "WRITING", "SPEAKING"];

export const SKILL_LABELS: Record<NorwegianSkill, { da: string; en: string }> = {
  READING: { da: "Leseforståelse", en: "Reading" },
  LISTENING: { da: "Lytteforståelse", en: "Listening" },
  WRITING: { da: "Skriftlig framstilling", en: "Writing" },
  SPEAKING: { da: "Muntlig", en: "Speaking" },
  KNOWLEDGE: { da: "Samfunnskunnskap", en: "Knowledge" },
};

// Track A — Norskprøven ladder. Norskprøven B1–B2 (citizenship, B1–B2) is the
// lead hook: it is the language exam commonly required for Norwegian citizenship.
// The Statsborgerprøven (Norwegian society knowledge) is required in addition to it.
export const LANGUAGE_EXAMS: ExamMeta[] = [
  {
    exam: "NORSKPROVE_A1A2", track: "GETTING_STARTED", slug: "norskprove-a1a2", name: "Norskprøven A1–A2", cefr: "A1–A2",
    blurb: "The first step on the Norskprøven ladder — everyday Norwegian for work and family life.",
    skills: ["READING", "LISTENING", "WRITING", "SPEAKING"], mockMinutes: 150,
  },
  {
    exam: "NORSKPROVE_A2B1", track: "PERMANENT_RESIDENCE", slug: "norskprove-a2b1", name: "Norskprøven A2–B1", cefr: "A2–B1",
    blurb: "The A2–B1 Norwegian exam commonly required for permanent residence — Reading, Listening, Written Presentation and Speaking.",
    skills: ["READING", "LISTENING", "WRITING", "SPEAKING"], mockMinutes: 180,
  },
  {
    exam: "NORSKPROVE_B1B2", track: "CITIZENSHIP", slug: "norskprove-b1b2", name: "Norskprøven B1–B2", cefr: "B1–B2",
    blurb: "The B1–B2 Norwegian exam commonly required for Norwegian citizenship — Reading, Written Presentation and Speaking.",
    skills: ["READING", "LISTENING", "WRITING", "SPEAKING"], lead: true, mockMinutes: 240,
  },
  {
    exam: "BERGENSTEST", track: "UNIVERSITY", slug: "bergenstesten", name: "Bergenstesten", cefr: "Higher level",
    blurb: "The higher-level Norwegian test for admission to Norwegian-taught university programmes.",
    skills: ["READING", "LISTENING", "WRITING", "SPEAKING"], mockMinutes: 300,
  },
];

// Track B — Norwegian society / active-citizenship knowledge tests. Multiple-choice,
// not language proficiency. Statsborgerprøven is required for citizenship in
// addition to Norskprøven B1–B2; Samfunnskunnskapsprøven is the permanent-residence /
// active-citizenship knowledge test.
export const KNOWLEDGE_EXAMS: ExamMeta[] = [
  {
    exam: "STATSBORGERPROVEN", track: "CITIZENSHIP", slug: "statsborgerproven", name: "Statsborgerprøven", cefr: "Knowledge test",
    blurb: "The Norwegian citizenship knowledge test — society, history and culture, in multiple-choice form. Required for citizenship in addition to Norskprøven B1–B2.",
    skills: ["KNOWLEDGE"], knowledge: true, mockMinutes: 30,
  },
  {
    exam: "SAMFUNNSKUNNSKAP", track: "PERMANENT_RESIDENCE", slug: "samfunnskunnskapsproven", name: "Samfunnskunnskapsprøven", cefr: "Knowledge test",
    blurb: "The active-citizenship knowledge test used on the permanent-residence path — everyday Norwegian society, in multiple-choice form.",
    skills: ["KNOWLEDGE"], knowledge: true, mockMinutes: 30,
  },
];

export const ALL_EXAMS: ExamMeta[] = [...LANGUAGE_EXAMS, ...KNOWLEDGE_EXAMS];

// The goal-based "Choose a Test" tree. Each track is a reason someone studies
// Norwegian; the exams under it are what that goal commonly requires.
export interface TrackMeta {
  track: NorwegianTrack;
  label: string; // short UI label
  goal: string; // what this path is for
  requires: string; // the exams commonly required, in plain words
  examSlugs: string[]; // ordered exam slugs for this track
  lead?: boolean;
}

export const TRACKS: TrackMeta[] = [
  {
    track: "CITIZENSHIP", label: "Norwegian citizenship", goal: "Working toward Norwegian citizenship",
    requires: "Norskprøven B1–B2 (B1–B2) + Statsborgerprøven",
    examSlugs: ["norskprove-b1b2", "statsborgerproven"], lead: true,
  },
  {
    track: "PERMANENT_RESIDENCE", label: "Permanent residence", goal: "Working toward permanent residence",
    requires: "Norskprøven A2–B1 (A2–B1) + Samfunnskunnskapsprøven",
    examSlugs: ["norskprove-a2b1", "samfunnskunnskapsproven"],
  },
  {
    track: "GETTING_STARTED", label: "Getting started", goal: "Starting out in Norwegian",
    requires: "Norskprøven A1–A2 (A1–A2)",
    examSlugs: ["norskprove-a1a2"],
  },
  {
    track: "UNIVERSITY", label: "University admission", goal: "Applying to a Norwegian-taught degree",
    requires: "Bergenstesten (≈C1)",
    examSlugs: ["bergenstesten"],
  },
];

export function examBySlug(slug: string): ExamMeta | undefined {
  return ALL_EXAMS.find((e) => e.slug === slug);
}

export function examsByTrack(track: NorwegianTrack): ExamMeta[] {
  return ALL_EXAMS.filter((e) => e.track === track);
}

export function trackMeta(track: NorwegianTrack): TrackMeta | undefined {
  return TRACKS.find((t) => t.track === track);
}

const LANGUAGE_EXAM_IDS: LanguageExam[] = ["NORSKPROVE_A1A2", "NORSKPROVE_A2B1", "NORSKPROVE_B1B2", "BERGENSTEST"];
const KNOWLEDGE_EXAM_IDS: KnowledgeExam[] = ["STATSBORGERPROVEN", "SAMFUNNSKUNNSKAP"];

export function isLanguageExam(exam: NorwegianExam): exam is LanguageExam {
  return (LANGUAGE_EXAM_IDS as string[]).includes(exam);
}

export function isKnowledgeExam(exam: NorwegianExam): exam is KnowledgeExam {
  return (KNOWLEDGE_EXAM_IDS as string[]).includes(exam);
}

/** The lead exam (Norskprøven B1–B2) — the citizenship hook. */
export function leadExam(): ExamMeta {
  return LANGUAGE_EXAMS.find((e) => e.lead) ?? LANGUAGE_EXAMS[2];
}
