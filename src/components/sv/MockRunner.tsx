"use client";

// Full-mock runner. Sequences every section in exam order with NO marking until
// the end, then reports what was scored and the LEVEL the auto-marked tasks
// evidence — not a readiness verdict, because the exams in this product do not
// share a threshold to be ready against (see ExamMeta.resultBasis).
// Always labelled "estimate, never an official result".
// Objective skills are auto-graded; productive skills
// (Writing/Speaking) are self-rated for now (AI grading arrives in a later phase).

import { useMemo, useState } from "react";
import type {
  SwedishExam,
  SwedishSkill,
} from "@/lib/sv/types";
import {
  aggregateReadout,
  skillReadout,
  achievedReadout,
  NO_LEVEL_REACHED_TEXT,
  UNDECLARED_LEVEL_TEXT,
  type SkillReadout,
  type AchievedReadout,
} from "@/lib/sv/grading";
import type { LevelScored } from "@smnasiruz016-blip/almi-data";
import { SKILL_LABELS } from "@/lib/sv/registry";
import { ObjectiveTask } from "./ObjectiveTask";
import { submitAttempt, type RunnerItem } from "./shared";

export interface MockSection {
  skill: SwedishSkill;
  objective: boolean;
  items: RunnerItem[];
}

interface FlatStep {
  skill: SwedishSkill;
  objective: boolean;
  item: RunnerItem;
  index: number;
}

const RATING_PCT: Record<string, number> = { CLEAR: 85, BORDERLINE: 60, BELOW: 40 };
const RATINGS = ["CLEAR", "BORDERLINE", "BELOW"] as const;
const RATING_LABEL: Record<string, string> = {
  CLEAR: "Met all criteria", BORDERLINE: "Met some criteria", BELOW: "Struggled",
};

export function MockRunner({
  examName,
  mockMinutes,
  sections,
  resultBasis,
}: {
  examName: string;
  exam: SwedishExam;
  mockMinutes: number;
  sections: MockSection[];
  /** ExamMeta.resultBasis — what THIS exam's real result is. Optional on purpose:
   *  an exam with no sourced basis stays silent rather than being handed a
   *  one-size-fits-all sentence that is false for some of the list. */
  resultBasis?: string;
}) {
  const flat = useMemo<FlatStep[]>(() => {
    let n = 0;
    return sections.flatMap((sec) =>
      sec.items.map((item) => ({ skill: sec.skill, objective: sec.objective, item, index: n++ })),
    );
  }, [sections]);

  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, unknown>>({});
  const [texts, setTexts] = useState<Record<number, string>>({});
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<React.ReactNode | null>(null);

  if (flat.length === 0) {
    return (
      <div className="rounded-2xl border border-almi-accent/40 bg-almi-accent/10 px-4 py-6 text-sm text-almi-ink">
        No mock content is available for this exam yet. Content is being added — check back soon.
      </div>
    );
  }

  const cur = flat[step];
  const isLast = step === flat.length - 1;

  async function finish() {
    setGrading(true);
    const perSkill: Partial<Record<SwedishSkill, { points: number; max: number }>> = {};
    const prodPct: Partial<Record<SwedishSkill, number[]>> = {};
    // Level evidence, gathered from OBJECTIVE items only. A self-rating is the
    // learner's own opinion of their writing; letting it crown a CEFR level would
    // make the level claim softer than the sentence that reports it.
    const levelScored: LevelScored[] = [];

    for (const f of flat) {
      if (f.objective) {
        const g = await submitAttempt({
          exam: f.item.exam,
          skill: f.item.skill,
          taskType: f.item.taskType,
          answer: f.item.answer,
          maxPoints: f.item.maxPoints,
          response: responses[f.index] ?? null,
        });
        const points = g?.points ?? 0;
        const max = g?.maxPoints ?? f.item.maxPoints ?? 1;
        const acc = perSkill[f.skill] ?? { points: 0, max: 0 };
        perSkill[f.skill] = { points: acc.points + points, max: acc.max + max };
        levelScored.push({ cefr: f.item.cefr, points, maxPoints: max });
      } else {
        const r = ratings[f.index];
        if (typeof r === "string") {
          (prodPct[f.skill] ??= []).push(RATING_PCT[r] ?? 40);
        }
        // Persist the productive attempt (best-effort, gated server-side).
        await submitAttempt({
          exam: f.item.exam,
          skill: f.item.skill,
          taskType: f.item.taskType,
          response: { text: texts[f.index] ?? "" },
          selfScore: r ?? null,
        });
      }
    }

    const readouts: SkillReadout[] = [];
    for (const sec of sections) {
      if (sec.objective) {
        const s = perSkill[sec.skill];
        if (s) readouts.push(skillReadout(sec.skill, s.points, s.max));
      } else {
        const pcts = prodPct[sec.skill] ?? [];
        const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
        // Synthesize points/max so the shared engine derives the readiness band.
        const max = pcts.length || 1;
        readouts.push(skillReadout(sec.skill, Math.round((avg / 100) * max), max));
      }
    }
    const agg = aggregateReadout(readouts);
    setResult(
      <MockResult
        examName={examName}
        readouts={readouts}
        agg={agg}
        achieved={achievedReadout(levelScored)}
        resultBasis={resultBasis}
      />,
    );
    setGrading(false);
  }

  if (result) return <div className="space-y-5">{result}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-almi-text-muted">
        <span>Step {step + 1} of {flat.length} · {SKILL_LABELS[cur.skill].en}</span>
        <span>~{mockMinutes} min total</span>
      </div>

      <div className="space-y-4 rounded-2xl border border-almi-bg-peach bg-almi-bg-peach/30 p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-almi-teal/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-almi-teal">
            {SKILL_LABELS[cur.skill].en}
          </span>
          <h3 className="text-base font-semibold text-almi-ink">{cur.item.title}</h3>
        </div>
        <p className="text-sm text-almi-text">{cur.item.prompt}</p>

        {cur.objective ? (
          <ObjectiveTask
            key={cur.index}
            item={cur.item}
            disabled={false}
            onChange={(r) => setResponses((prev) => ({ ...prev, [cur.index]: r }))}
          />
        ) : (
          <ProductiveStep
            key={cur.index}
            text={texts[cur.index] ?? ""}
            rating={ratings[cur.index] ?? null}
            onText={(t) => setTexts((prev) => ({ ...prev, [cur.index]: t }))}
            onRating={(r) => setRatings((prev) => ({ ...prev, [cur.index]: r }))}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex min-h-[44px] items-center rounded-full border border-almi-bg-peach px-5 py-2 text-sm font-semibold text-almi-text disabled:opacity-40"
        >
          ← Back
        </button>
        {!isLast ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex min-h-[44px] items-center rounded-full bg-almi-ink px-6 py-2 text-sm font-semibold text-almi-paper hover:opacity-90"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={grading}
            className="inline-flex min-h-[44px] items-center rounded-full bg-almi-coral px-6 py-2 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep disabled:opacity-40"
          >
            {grading ? "Scoring…" : "Finish mock & see estimate →"}
          </button>
        )}
      </div>
    </div>
  );
}

function ProductiveStep({
  text,
  rating,
  onText,
  onRating,
}: {
  text: string;
  rating: string | null;
  onText: (t: string) => void;
  onRating: (r: string) => void;
}) {
  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={6}
        placeholder="Write your answer or jot down your notes here…"
        className="w-full rounded-xl border border-almi-bg-peach bg-almi-paper p-3 text-sm text-almi-text"
      />
      <fieldset>
        <legend className="text-sm font-semibold text-almi-ink">
          Practice estimate — self-rating (not an official score)
        </legend>
        <div className="mt-2 space-y-2">
          {RATINGS.map((r) => (
            <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-sm ${rating === r ? "border-almi-coral bg-almi-coral/5" : "border-almi-bg-peach bg-almi-paper"}`}>
              <input type="radio" name="mock-rate" checked={rating === r} onChange={() => onRating(r)} />
              <span className="text-almi-text">{RATING_LABEL[r]}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function MockResult({
  examName,
  readouts,
  agg,
  achieved,
  resultBasis,
}: {
  examName: string;
  readouts: SkillReadout[];
  agg: { meanPct: number; overall: string; label: string; weakest: SwedishSkill | null; allClear: boolean };
  achieved: AchievedReadout;
  resultBasis?: string;
}) {
  const points = readouts.reduce((s, r) => s + r.points, 0);
  const maxPoints = readouts.reduce((s, r) => s + r.maxPoints, 0);
  return (
    <div className="space-y-5 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-almi-accent-deep">
          {examName} · full mock · estimate
        </p>
        {/* Was agg.label ("On track (practice estimate)") over a readiness band.
            That banded against a threshold no exam here publishes. Report what was
            actually scored, then the level it evidences. */}
        <h2 className="mt-1 text-2xl font-semibold text-almi-ink">
          {points} / {maxPoints} correct
        </h2>
        <p className="text-sm text-almi-text-muted">
          Mean {agg.meanPct}% across the graded parts
          {agg.weakest ? ` · focus on ${SKILL_LABELS[agg.weakest].en}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {achieved.workingAt ? (
          <span className="rounded-full bg-almi-teal/15 px-3 py-1 text-sm font-semibold text-almi-teal">
            Working at {achieved.workingAt}
          </span>
        ) : (
          <span className="text-sm text-almi-text-muted">
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
          {" · from the auto-marked parts only"}
        </p>
      )}
      <ul className="space-y-2">
        {readouts.map((r) => (
          <li key={r.skill} className="flex items-center justify-between rounded-xl border border-almi-bg-peach px-4 py-2 text-sm">
            <span className="text-almi-ink">
              {SKILL_LABELS[r.skill].en}
              {r.isEstimate ? <span className="ml-2 text-xs text-almi-text-muted">(self-rated)</span> : null}
            </span>
            {/* The CLEAR/BORDERLINE/BELOW verdict is gone: ready for what? */}
            <span className="font-semibold text-almi-text">{r.points}/{r.maxPoints} · {r.pct}%</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-almi-text-muted">
        {/* Exam-aware. The old blanket line — "the real exam is judged pass/fail
            across all four skills against the official criteria" — was printed on
            the SFI ladder and on our own B1–B2 ladder, where no such exam exists. */}
        {resultBasis ? `${resultBasis} ` : ""}
        This is a practice estimate from the tasks you were served, never an official result.
      </p>
    </div>
  );
}
