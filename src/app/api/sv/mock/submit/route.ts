// MOCK submit endpoint. Identical server-authoritative grading to /api/sv/submit, and
// one deliberate difference: it does NOT return the correct answer.
//
// A mock reports one aggregate estimate at the end and never shows per-item answers, so
// there is nothing here for a mid-attempt reveal to leak. Withholding it at the route is
// what makes that structural rather than a UI habit: a client that called this endpoint
// item by item, in any order, at any point, still cannot obtain a key — the key is not in
// the served payload and it is not in this response either.
//
// The split lives in WHICH ROUTE runs. There is no `mode` field a client could set.

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

  // No `answer` key in this response, by design. Do not add one.
  return NextResponse.json({
    ok: true,
    points: graded.points,
    maxPoints: graded.maxPoints,
    correct: graded.correct,
    selfScore: graded.selfScore,
  });
}
