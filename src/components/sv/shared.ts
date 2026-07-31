// Shared client-side item shapes handed from the runner pages to the practice
// components. Payloads stay `unknown` and are narrowed by taskType at render.

import type {
  SwedishExam,
  SwedishSkill,
  SwedishTaskType,
  CefrLevel,
  ObjectiveAnswer,
} from "@/lib/sv/types";

export interface RunnerItem {
  /** Stable server id (content hash of exam|skill|taskType|title|prompt|payload). Posted
   *  back so the server re-loads the item and grades against its OWN key.
   *
   *  THIS FIELD REPLACED `answer`. Until 2026-07-31 the served item carried its own
   *  answer key into the browser and the runner posted that key back to be marked
   *  against — so the key sat in the page before the learner answered, and a forged POST
   *  supplying both halves scored 100%. The key now never leaves the server; the correct
   *  answer comes back in the SUBMIT RESPONSE, after scoring, and only on the practice
   *  path. Do not re-add an `answer` field here. */
  id: string;
  title: string;
  prompt: string;
  exam: SwedishExam;
  skill: SwedishSkill;
  taskType: SwedishTaskType;
  /** CEFR level this task is pitched at — carried so the runner can report the level
   *  reached (there is no pass mark to band against) and the productive grader can
   *  judge at the right level. */
  cefr?: CefrLevel;
  payload: unknown;
  maxPoints: number;
}

export type ProductiveItem = Omit<RunnerItem, "maxPoints">;

export interface SubmitResult {
  ok: boolean;
  points: number;
  maxPoints: number;
  correct: boolean;
  /** The correct answer, returned by the server ONLY on the practice path and ONLY in
   *  the response to a scored submission. The mock route never sets it — there is no
   *  per-item reveal in a mock, so there is no key to harvest before committing. */
  answer?: ObjectiveAnswer | null;
}

/** What a runner is allowed to post. There is deliberately no `answer`, no `maxPoints`
 *  and no `taskType`: the server re-loads all of that from the item it looks up by id,
 *  so a client cannot state the standard it is marked against. Widening this type is how
 *  the original P0 would come back. */
export interface AttemptBody {
  itemId: string;
  response?: unknown;
  selfScore?: number | string | null;
}

/** The BCP-47 voice tag for listening audio — Swedish (all tracks). */
export function ttsLang(): string {
  return "sv-SE";
}

/** POST a graded/echoed attempt to the submit API. DB-optional, never throws. */
export async function submitAttempt(body: AttemptBody): Promise<SubmitResult | null> {
  try {
    return read(await fetch("/api/sv/submit", init(body)));
  } catch {
    return null;
  }
}

/** POST a graded/echoed attempt to the MOCK submit API. Same grading, but the route
 *  withholds the key: a mock reports one aggregate estimate at the end and never shows
 *  per-item answers, so nothing it returns can be harvested mid-attempt. Which of the
 *  two behaviours you get is decided by WHICH ROUTE runs — never by a client flag.
 *
 *  Both endpoints are written out as LITERALS in their own request, rather than passed
 *  as an argument to one shared helper. A helper that takes the endpoint as a parameter
 *  is indistinguishable, to a reader and to a scanner, from one whose host comes from
 *  user input — and this pair is the whole point: which endpoint runs decides whether a
 *  key comes back. That belongs at the call site, not in a variable. */
export async function submitMockAttempt(body: AttemptBody): Promise<SubmitResult | null> {
  try {
    return read(await fetch("/api/sv/mock/submit", init(body)));
  } catch {
    return null;
  }
}

function init(body: AttemptBody): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function read(res: Response): Promise<SubmitResult | null> {
  if (!res.ok) return null;
  return (await res.json()) as SubmitResult;
}

export type ProductiveBand = "CLEAR" | "BORDERLINE" | "BELOW";

export interface AiFeedback {
  band: ProductiveBand;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export type GradeOutcome =
  | { status: "graded"; feedback: AiFeedback }
  | { status: "unavailable" } // key not provisioned / model hiccup → self-rate
  | { status: "error"; message: string };

/**
 * Request honest AI feedback on a productive answer. Returns "unavailable" (not
 * an error) when the key isn't provisioned yet, so the caller falls back to the
 * self-rating flow. Never throws.
 */
export async function gradeProductive(body: {
  exam: SwedishExam;
  skill: SwedishSkill;
  taskType: SwedishTaskType;
  /** The level THIS task is pitched at — the grade route judges the answer at this
   *  level (via almi-data levelInstruction), never at the exam's "≈A2–B1+" label. */
  cefr?: CefrLevel;
  title: string;
  prompt: string;
  criteria: string[];
  response: string;
}): Promise<GradeOutcome> {
  try {
    const res = await fetch("/api/sv/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | ({ ok?: boolean; available?: boolean; error?: string } & Partial<AiFeedback>)
      | null;
    if (!res.ok || !data) {
      return { status: "error", message: data?.error ?? "Could not get feedback right now." };
    }
    if (data.available === false || !data.band) return { status: "unavailable" };
    return {
      status: "graded",
      feedback: {
        band: data.band,
        summary: data.summary ?? "",
        strengths: data.strengths ?? [],
        improvements: data.improvements ?? [],
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}
