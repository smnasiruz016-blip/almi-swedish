// AI grading for the gated productive skills (Writing / Speaking). Sends the task
// + the learner's written answer to Sonnet and returns an HONEST practice
// readiness band (CLEAR / BORDERLINE / BELOW) with constructive, level-aware
// feedback against the exam's own criteria — never an official Directorate of
// Education or HK-dir (the Directorate for Higher Education and Skills) result.
//
// Graceful degradation: if ANTHROPIC_API_KEY is not yet provisioned the route
// returns { ok: true, available: false } (HTTP 200) so the client falls back to
// the honest self-rating flow instead of surfacing a 500.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/billing/plans";
import { prisma } from "@/lib/prisma";
import { getAnthropicClient, recordCost } from "@/lib/ai/anthropic-client";
import { MODELS } from "@/lib/ai/models";
import { examBySlug } from "@/lib/no/registry";
import type { NorwegianSkill, NorwegianTaskType } from "@/lib/no/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface GradeBody {
  itemId?: string;
  exam?: string;
  skill?: NorwegianSkill;
  taskType?: NorwegianTaskType;
  title?: string;
  prompt?: string;
  criteria?: string[];
  response?: string;
}

type Band = "CLEAR" | "BORDERLINE" | "BELOW";
const BANDS: Band[] = ["CLEAR", "BORDERLINE", "BELOW"];

interface AiFeedback {
  band: Band;
  summary: string;
  strengths: string[];
  improvements: string[];
}

function keyAvailable(): boolean {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && k.length >= 20 && k !== "TODO_FOUNDER_PROVIDES";
}

// Defensive JSON extraction — models occasionally wrap JSON in prose or fences.
function parseFeedback(raw: string): AiFeedback | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const band = typeof o.band === "string" ? o.band.toUpperCase() : "";
  if (!BANDS.includes(band as Band)) return null;
  const summary = typeof o.summary === "string" ? o.summary.trim() : "";
  if (!summary) return null;
  const toList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 5) : [];
  return {
    band: band as Band,
    summary,
    strengths: toList(o.strengths),
    improvements: toList(o.improvements),
  };
}

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  // Productive AI feedback is the paid value (owner + comp bypass live inside).
  if (!hasPaidAccess(user)) {
    return NextResponse.json(
      { ok: false, error: "AI feedback is a Pro feature" },
      { status: 402 },
    );
  }

  let body: GradeBody;
  try {
    body = (await req.json()) as GradeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const response = (body.response ?? "").trim();
  if (response.length < 20) {
    return NextResponse.json(
      { ok: false, error: "Write a fuller answer before requesting feedback." },
      { status: 400 },
    );
  }

  // Key not provisioned yet → tell the client to fall back to self-rating.
  if (!keyAvailable()) {
    return NextResponse.json({ ok: true, available: false });
  }

  const exam = body.exam ? examBySlug(body.exam) : undefined;
  const examName = exam?.name ?? "the Norwegian exam";
  const cefr = exam?.cefr ?? "the target";
  const isSpeaking = body.taskType === "SPEAKING_PROMPT";
  const criteria = (body.criteria ?? []).filter((c) => typeof c === "string" && c.trim().length > 0);

  const system = [
    `You are an experienced Norwegian-language examiner for ${examName} (CEFR ${cefr}).`,
    `You give an HONEST practice readiness estimate against the task's own criteria — this is a study aid, never an official UDI or Ministry result, and you never claim otherwise.`,
    isSpeaking
      ? `This is a SPEAKING task; the learner has typed the answer they would say aloud, so judge content, structure, range and appropriacy, not pronunciation.`
      : `This is a WRITING task; judge task fulfilment, coherence, range and accuracy at the ${cefr} level.`,
    `Be constructive, specific and level-aware. Do not inflate. Reply with STRICT JSON only, no prose, no code fences, in this exact shape:`,
    `{"band":"CLEAR|BORDERLINE|BELOW","summary":"1-2 sentence honest estimate","strengths":["..."],"improvements":["..."]}`,
    `Bands: CLEAR = comfortably meets the criteria at ${cefr}; BORDERLINE = partially meets them, could go either way; BELOW = does not yet meet them.`,
  ].join(" ");

  const userMsg = [
    body.title ? `Task: ${body.title}` : null,
    body.prompt ? `Instructions: ${body.prompt}` : null,
    criteria.length ? `Criteria the answer should meet:\n- ${criteria.join("\n- ")}` : null,
    `\nLearner's answer:\n"""${response.slice(0, 6000)}"""`,
  ]
    .filter(Boolean)
    .join("\n");

  let feedback: AiFeedback | null = null;
  try {
    const client = getAnthropicClient();
    const msg = await client.messages.create({
      model: MODELS.SONNET,
      max_tokens: 700,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    await recordCost({
      userId: user.id,
      feature: "is.grade.productive",
      model: MODELS.SONNET,
      usage: {
        inputTokens: msg.usage.input_tokens,
        outputTokens: msg.usage.output_tokens,
      },
      success: true,
    });

    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    feedback = parseFeedback(text);
  } catch (e) {
    await recordCost({
      userId: user.id,
      feature: "is.grade.productive",
      model: MODELS.SONNET,
      usage: { inputTokens: 0, outputTokens: 0 },
      success: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    // Fall back to self-rating rather than 500 on a transient model error.
    return NextResponse.json({ ok: true, available: false });
  }

  if (!feedback) {
    return NextResponse.json({ ok: true, available: false });
  }

  // Best-effort persistence — bundled items have no DB id, so a missing/unknown
  // itemId simply skips the write (never 500s on an empty database).
  if (body.itemId) {
    try {
      await prisma.norwegianAttempt.create({
        data: {
          userId: user.id,
          itemId: body.itemId,
          status: "EVALUATED",
          response: { text: response } as object,
          aiFeedback: feedback as unknown as object,
          readiness: feedback.band,
          submittedAt: new Date(),
        },
      });
    } catch {
      // ignore — attempts are optional this pass
    }
  }

  return NextResponse.json({ ok: true, available: true, ...feedback });
}
