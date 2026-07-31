// PRACTICE submit endpoint. Grades objective items deterministically against the
// SERVER-held answer key, re-loaded by the posted itemId — the client never supplies a
// key and never states the standard it is marked against. See lib/sv/grade-attempt.ts
// for what this replaced and why.
//
// This is the REVEAL path: the correct answer is returned in the response, AFTER the
// submission has been scored, so the practice runner can show it. The mock path
// (/api/sv/mock/submit) runs the identical grading and withholds it. Which behaviour a
// caller gets is decided by which route it reached, never by a flag in its body.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { gradeAttempt, type AttemptBody } from "@/lib/sv/grade-attempt";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: AttemptBody;
  try {
    body = (await req.json()) as AttemptBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const graded = await gradeAttempt(body, user);
  if (!graded.ok) {
    return NextResponse.json({ ok: false, error: graded.error }, { status: graded.status });
  }

  return NextResponse.json({
    ok: true,
    points: graded.points,
    maxPoints: graded.maxPoints,
    correct: graded.correct,
    selfScore: graded.selfScore,
    // Post-scoring reveal — the practice runner shows this once the answer is in.
    answer: graded.correctAnswer,
  });
}
