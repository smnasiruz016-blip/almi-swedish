"use client";

// Full-mock runner. Sequences every section in exam order with NO marking until
// the end, then shows one honest aggregate estimate via aggregateReadout() over
// per-skill readouts. Always labelled "estimate, not the official Directorate /
// Ministry result". Objective skills are auto-graded; productive skills
// (Writing/Speaking) are self-rated for now (AI grading arrives in a later phase).

import { useMemo, useState } from "react";
import type {
  NorwegianExam,
  NorwegianSkill,
} from "@/lib/no/types";
import {
  aggregateReadout,
  skillReadout,
  readinessFromPct,
  type SkillReadout,
} from "@/lib/no/grading";
import { SKILL_LABELS } from "@/lib/no/registry";
import { ObjectiveTask } from "./ObjectiveTask";
import { submitAttempt, type RunnerItem } from "./shared";

export interface MockSection {
  skill: NorwegianSkill;
  objective: boolean;
  items: RunnerItem[];
}

interface FlatStep {
  skill: NorwegianSkill;
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
}: {
  examName: string;
  exam: NorwegianExam;
  mockMinutes: number;
  sections: MockSection[];
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
    const perSkill: Partial<Record<NorwegianSkill, { points: number; max: number }>> = {};
    const prodPct: Partial<Record<NorwegianSkill, number[]>> = {};

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
    setResult(<MockResult examName={examName} readouts={readouts} agg={agg} />);
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
}: {
  examName: string;
  readouts: SkillReadout[];
  agg: { meanPct: number; overall: string; label: string; weakest: NorwegianSkill | null; allClear: boolean };
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-almi-accent-deep">
          {examName} · full mock · estimate
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-almi-ink">{agg.label}</h2>
        <p className="text-sm text-almi-text-muted">
          Mean {agg.meanPct}% · overall readiness {readinessFromPct(agg.meanPct)}
          {agg.weakest ? ` · focus on ${SKILL_LABELS[agg.weakest].en}` : ""}
        </p>
      </div>
      <ul className="space-y-2">
        {readouts.map((r) => (
          <li key={r.skill} className="flex items-center justify-between rounded-xl border border-almi-bg-peach px-4 py-2 text-sm">
            <span className="text-almi-ink">
              {SKILL_LABELS[r.skill].en}
              {r.isEstimate ? <span className="ml-2 text-xs text-almi-text-muted">(self-rated)</span> : null}
            </span>
            <span className="font-semibold text-almi-text">{r.pct}% · {r.readiness}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-almi-text-muted">
        This is a practice estimate, not an official UDI or HK-dir (the Directorate for Higher Education and Skills)
        result. The real exam is judged pass/fail across all four skills against the official criteria.
      </p>
    </div>
  );
}
