// Server-authoritative grading for one practice/mock attempt.
//
// The client posts only an itemId + its response. The item — and its answer key — is
// re-loaded server-side by id (getItemById), so a client-supplied key is never trusted
// and the key never had to ship in the served payload.
//
// ── WHAT THIS REPLACED ──
// /api/sv/submit used to destructure `answer`, `taskType`, `skill` and `maxPoints`
// straight off the request body and call gradeObjective(answer, response). A forged POST
// that supplied a key and a response agreeing with it scored 100% — the attacker never
// needed to know the real answer, because they wrote both halves. For MATCHING and CLOZE
// they controlled the denominator too, since maxPoints came from the posted key's own
// length. Every one of those fields is now derived from the loaded item and the body's
// copies are ignored; AttemptBody no longer has a place to put them.
//
// The item's correct answer is returned to the CALLER, which decides whether to disclose
// it: the practice route reveals it after scoring; the mock route withholds it. That
// practice-vs-mock split is decided by WHICH ROUTE runs, not by any client flag.

import { hasPaidAccess } from "@/lib/billing/plans";
import { prisma } from "@/lib/prisma";
import { gradeObjective } from "@/lib/sv/grading";
import { getItemById } from "@/lib/sv/items";
import { isObjectiveTask, isObjectiveSkill } from "@/lib/sv/types";
import type { ObjectiveAnswer } from "@/lib/sv/types";

type PaidUser = Parameters<typeof hasPaidAccess>[0] & { id: string };

/** Everything a client is allowed to say. Note what is ABSENT: no answer, no taskType,
 *  no skill, no maxPoints. Those are facts about the item, and the server owns them. */
export interface AttemptBody {
  itemId?: string;
  response?: unknown;
  selfScore?: number | string | null;
}

export type GradeOutcome =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      points: number;
      maxPoints: number;
      correct: boolean;
      selfScore: number | string | null;
      /** The item's correct answer — callers reveal this ONLY on the practice path. */
      correctAnswer: ObjectiveAnswer | null;
    };

export async function gradeAttempt(body: AttemptBody, user: PaidUser): Promise<GradeOutcome> {
  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  if (!itemId) return { ok: false, status: 400, error: "Missing itemId" };

  // An id that resolves to nothing FAILS LOUDLY. Returning a 0/0 "ok" here would be the
  // same defect in a quieter coat: the caller could not tell a wrong answer from an
  // unknown item, and a typo'd id would read as a legitimately failed attempt.
  const item = getItemById(itemId);
  if (!item) return { ok: false, status: 404, error: "Unknown item" };

  const objective = isObjectiveTask(item.taskType);
  // Everything is paid now; `productive` only decides whether an AI grader
  // runs, not whether the user is allowed in.
  const productive = !objective || !isObjectiveSkill(item.skill);

  // Gate: productive / AI tasks require paid access (owner + comp bypass inside).
  // Derived from the LOADED item's skill and taskType — a client that claimed
  // skill:"READING" over a WRITING item used to walk straight through this.
  if (productive && !hasPaidAccess(user)) {
    return { ok: false, status: 402, error: "Productive feedback is a Pro feature" };
  }

  let points = 0;
  let maxPoints = 0;
  let correct = false;
  let readiness: string | null = null;
  const selfScore = body.selfScore ?? null;

  if (objective && item.answer) {
    // Graded against the SERVER-held key, not anything the client supplied.
    const graded = gradeObjective(item.answer, body.response);
    points = graded.points;
    maxPoints = graded.maxPoints;
    correct = maxPoints > 0 && points === maxPoints;
    readiness = correct ? "CLEAR" : "BELOW";
  } else {
    readiness = typeof selfScore === "string" ? selfScore : null;
  }

  // Best-effort persistence. itemId is now a stable server id rather than a client
  // token, but SwedishAttempt.itemId is still a required FK to SwedishItem — a table
  // nothing populates, because items are served from JSON bundles. So this write still
  // fails into its own catch; that was true before this change and is unchanged by it.
  try {
    await prisma.swedishAttempt.create({
      data: {
        userId: user.id,
        itemId,
        status: objective ? "SCORED" : "EVALUATED",
        response: (body.response ?? { selfScore }) as object,
        points: objective ? points : null,
        maxPoints: objective ? maxPoints : null,
        readiness,
        submittedAt: new Date(),
      },
    });
  } catch {
    // attempts are optional this pass
  }

  return {
    ok: true,
    points,
    maxPoints,
    correct,
    selfScore,
    correctAnswer: objective ? item.answer : null,
  };
}
