"use client";

// Objective practice runner. Steps through auto-marked items (Reading/Listening),
// submits each to /api/sv/submit for deterministic grading, shows per-item
// correctness, and closes with the LEVEL these tasks evidence — not a readiness band,
// because there is no single threshold to band against. All labels are framed as a
// "practice estimate" — never an official result.

import { useState } from "react";
import type { SwedishSkill } from "@/lib/sv/types";
import {
  achievedReadout,
  NO_LEVEL_REACHED_TEXT,
  UNDECLARED_LEVEL_TEXT,
} from "@/lib/sv/grading";
import { SKILL_LABELS } from "@/lib/sv/registry";
import { ObjectiveTask } from "./ObjectiveTask";
import { submitAttempt, type RunnerItem, type SubmitResult } from "./shared";

export function PracticeRunner({
  examName,
  skill,
  items,
  resultBasis,
}: {
  examName: string;
  skill: SwedishSkill;
  items: RunnerItem[];
  /** ExamMeta.resultBasis — what this exam's real result is. Optional: an exam with
   *  no sourced basis says nothing rather than being given an invented sentence. */
  resultBasis?: string;
}) {
  const [step, setStep] = useState(0);
  const [response, setResponse] = useState<unknown>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<SubmitResult[]>([]);
  const [done, setDone] = useState(false);

  const item = items[step];
  const isLast = step === items.length - 1;

  async function submit() {
    if (result || busy) return;
    setBusy(true);
    const graded = await submitAttempt({
      exam: item.exam,
      skill: item.skill,
      taskType: item.taskType,
      answer: item.answer,
      maxPoints: item.maxPoints,
      response,
    });
    setBusy(false);
    const r: SubmitResult =
      graded ?? { ok: false, points: 0, maxPoints: item.maxPoints || 1, correct: false };
    setResult(r);
    setResults((prev) => [...prev, r]);
  }

  function next() {
    if (isLast) {
      setDone(true);
      return;
    }
    setStep((s) => s + 1);
    setResponse(null);
    setResult(null);
  }

  if (done) {
    const points = results.reduce((s, r) => s + r.points, 0);
    const maxPoints = results.reduce((s, r) => s + r.maxPoints, 0);
    // Sweden has no language pass mark in force, so there is no target to band
    // against — "are you ready?" has no referent. Report the level reached instead.
    // results are in item order, so results[i] pairs with items[i].
    const achieved = achievedReadout(
      results.map((r, i) => ({
        cefr: items[i]?.cefr,
        points: r.points,
        maxPoints: r.maxPoints,
      })),
    );
    return (
      <div className="space-y-5 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-almi-accent-deep">
            {examName} · {SKILL_LABELS[skill].en} · practice estimate
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-almi-ink">
            {points} / {maxPoints} correct
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {achieved.workingAt ? (
            <span className="rounded-full bg-almi-teal/15 px-3 py-1 text-sm font-semibold text-almi-teal">
              Working at {achieved.workingAt}
            </span>
          ) : (
            <span className="text-sm text-almi-text-muted">
              {/* Two different facts, never conflated: tasks that carry no level at
                  all (SFI, Tisus) vs. levelled tasks where none was cleared. */}
              {achieved.levelGraded ? NO_LEVEL_REACHED_TEXT : UNDECLARED_LEVEL_TEXT}
            </span>
          )}
          {achieved.reachingFor && (
            <span className="text-sm text-almi-text-muted">
              reaching for {achieved.reachingFor}
            </span>
          )}
        </div>
        {achieved.byLevel.length > 0 && (
          <p className="text-sm text-almi-text-muted">
            {achieved.byLevel
              .map(
                (l) =>
                  `${l.cefr}: ${l.points}/${l.maxPoints} on ${l.count} task${
                    l.count === 1 ? "" : "s"
                  }${l.sufficient ? "" : " (too few to judge)"}`,
              )
              .join(" · ")}
          </p>
        )}
        <p className="text-xs text-almi-text-muted">
          {/* Exam-aware: what the real result IS differs per exam, so the blanket
              "there is no pass mark" claim cannot be printed here — it is false of
              Tisus. See ExamMeta.resultBasis. */}
          {resultBasis ? `${resultBasis} ` : ""}
          This reports the level these tasks evidence, not whether you passed — a practice
          estimate from the tasks you were served, never an official result.
        </p>
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setResponse(null);
            setResult(null);
            setResults([]);
            setDone(false);
          }}
          className="inline-flex min-h-[44px] items-center rounded-full bg-almi-coral px-6 py-2 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep"
        >
          Practise again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-almi-text-muted">
        <span>
          Question {step + 1} of {items.length}
        </span>
        <span>{item.taskType.replace("_", " ").toLowerCase()}</span>
      </div>

      <div className="space-y-4 rounded-2xl border border-almi-bg-peach bg-almi-bg-peach/30 p-5">
        <h3 className="text-base font-semibold text-almi-ink">{item.title}</h3>
        <p className="text-sm text-almi-text">{item.prompt}</p>
        <ObjectiveTask
          key={step}
          item={item}
          disabled={!!result}
          onChange={setResponse}
        />
      </div>

      {result && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            result.correct
              ? "bg-almi-teal/15 text-almi-teal"
              : "bg-almi-coral/15 text-almi-coral-deep"
          }`}
        >
          {result.correct ? "Correct" : "Not quite"} · {result.points}/{result.maxPoints} point
          {result.maxPoints === 1 ? "" : "s"}
        </div>
      )}

      <div className="flex gap-3">
        {!result ? (
          <button
            type="button"
            onClick={submit}
            disabled={busy || response === null}
            className="inline-flex min-h-[44px] items-center rounded-full bg-almi-coral px-6 py-2 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep disabled:opacity-40"
          >
            {busy ? "Checking…" : "Check answer"}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="inline-flex min-h-[44px] items-center rounded-full bg-almi-ink px-6 py-2 text-sm font-semibold text-almi-paper hover:opacity-90"
          >
            {isLast ? "See readout →" : "Next question →"}
          </button>
        )}
      </div>
    </div>
  );
}
