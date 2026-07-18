// AlmiSwedish — shared type contracts for the four-track item bank.
// String-literal unions mirror the Prisma enums (kept in sync by hand) so the
// scoring engine, content pipeline, and UI don't depend on the generated client.

// The "Choose a Test" tree is organised by the user's GOAL, not by the exam name.
// NOTE there is no PERMANENT_RESIDENCE track: Sweden does not currently impose a
// language or knowledge test for permanent residence, and we do not invent one.
export type SwedishTrack =
  | "CITIZENSHIP" // → Medborgarskapsprovet (society component only — see registry)
  | "UNIVERSITY" // → Tisus (≈C1)
  | "GETTING_STARTED" // → SFI Courses A–B
  | "PROFICIENCY"; // → SFI Courses C–D → Swedish B1–B2

// The Swedish language ladder. SFI is municipal adult education (courses A–D over
// three study paths) rather than a single national exam; we model the A–B and C–D
// bands as separate exams so the tree and content can target a goal. Tisus is a
// real single exam, run by Stockholms universitet.
//
// There is deliberately NO exam here for the citizenship LANGUAGE component: UHR
// indicates autumn 2028 at the earliest and has set no level. Adding one would mean
// inventing a spec. Don't.
export type LanguageExam =
  | "SFI_AB"
  | "SFI_CD"
  | "SVENSKA_B1B2"
  | "TISUS";
// Knowledge test (Swedish society) — multiple-choice only, a single KNOWLEDGE
// module rather than four language skills. Exactly one: Sweden has one society test.
export type KnowledgeExam = "MEDBORGARSKAPSPROV";
export type SwedishExam = LanguageExam | KnowledgeExam;

// The four language skills are shared by all language exams; KNOWLEDGE is the
// single objective module used by the society test.
export type LanguageSkill = "READING" | "LISTENING" | "WRITING" | "SPEAKING";
export type SwedishSkill = LanguageSkill | "KNOWLEDGE";

export type SwedishTaskType =
  | "MCQ_SINGLE"
  | "MATCHING"
  | "CLOZE"
  | "ORDERING"
  | "TRUE_FALSE"
  | "WRITING_PROMPT"
  | "SPEAKING_PROMPT";

export type SwedishDifficulty = "FOUNDATION" | "CORE" | "STRETCH";

// The CEFR level a single task is PITCHED at — distinct from `difficulty`, which is a
// FOUNDATION/CORE/STRETCH ladder *inside* an exam and crosses levels freely.
//
// Sweden leans on this harder than any sibling. There is no language pass mark in
// force to band against (see LANGUAGE_TEST_HEDGE), so the level tag is not a step
// toward a verdict — it IS the result. Optional: an untagged task is UNDECLARED and
// never silently folded into a level.
export type { CefrLevel } from "@smnasiruz016-blip/almi-data";

export const OBJECTIVE_TASK_TYPES: SwedishTaskType[] = [
  "MCQ_SINGLE",
  "MATCHING",
  "CLOZE",
  "ORDERING",
  "TRUE_FALSE",
];

export const PRODUCTIVE_TASK_TYPES: SwedishTaskType[] = [
  "WRITING_PROMPT",
  "SPEAKING_PROMPT",
];

export function isObjectiveTask(t: SwedishTaskType): boolean {
  return OBJECTIVE_TASK_TYPES.includes(t);
}

/** A skill is "free to taste" (auto-graded) vs gated (AI-graded / mock).
 *  Free taste = Reading + Listening + Knowledge (all objective, auto-graded).
 *  Gated = Writing + Speaking (AI-graded) + the full mock. */
export function isFreeSkill(skill: SwedishSkill): boolean {
  return skill === "READING" || skill === "LISTENING" || skill === "KNOWLEDGE";
}

// ---- Task payload shapes (validated in items.ts) ----

/** One multiple-choice / true-false option group. */
export interface McqPayload {
  passage?: string; // reading passage (READING) — omitted for LISTENING
  transcript?: string; // listening transcript (LISTENING) — rendered as audio via TTS
  question: string;
  options: string[]; // 3–4 options
}

export interface MatchingPayload {
  transcript?: string;
  passage?: string;
  instructions: string;
  left: string[]; // prompts
  right: string[]; // candidate matches (may include distractors)
}

export interface ClozePayload {
  passage: string; // text with {{1}} {{2}} … gap markers
  gaps: { id: number; options: string[] }[];
}

export interface OrderingPayload {
  instructions: string;
  items: string[]; // presented shuffled; answer = correct order of indices
}

/** Objective answer keys keyed by taskType. */
export type ObjectiveAnswer =
  | { type: "MCQ_SINGLE"; correctIndex: number }
  | { type: "TRUE_FALSE"; correctIndex: number }
  | { type: "MATCHING"; pairs: [number, number][] } // [leftIndex, rightIndex]
  | { type: "CLOZE"; correct: { id: number; index: number }[] }
  | { type: "ORDERING"; order: number[] };

/** Productive prompt (Writing / Speaking) — AI-graded. */
export interface ProductivePayload {
  stimulus?: string; // context / situation (NB)
  criteria: string[]; // what the answer must show (feeds AI feedback)
  charBand?: { min: number; max: number }; // writing length guidance
  minSeconds?: number; // speaking guidance
}
