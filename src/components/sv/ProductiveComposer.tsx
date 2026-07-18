"use client";

// Productive composer for the gated skills (Writing / Speaking). Shows the
// stimulus + criteria, a writing textarea with a live length counter (or a
// speaking notes area with timing guidance). Writing / Speaking answers get an
// honest AI readiness estimate (CLEAR/BORDERLINE/BELOW) with feedback against the
// exam's own criteria — NEVER an official Directorate / Ministry score. When AI
// grading isn't available (key not provisioned yet, or a transient hiccup) it
// falls back to a clearly-labelled self-rating.

import { useMemo, useState } from "react";
import type {
  SwedishSkill,
  ProductivePayload,
} from "@/lib/sv/types";
import { SKILL_LABELS } from "@/lib/sv/registry";
import {
  submitAttempt,
  gradeProductive,
  type ProductiveItem,
  type AiFeedback,
} from "./shared";

const RATINGS = ["CLEAR", "BORDERLINE", "BELOW"] as const;
const RATING_LABEL: Record<string, string> = {
  CLEAR: "I met all the criteria",
  BORDERLINE: "I met some criteria",
  BELOW: "I struggled with this",
};

function isWritingType(t: string): boolean {
  return t === "WRITING_PROMPT";
}

function readDisplay(item: ProductiveItem): {
  stimulus: string | null;
  criteria: string[];
  charBand: { min: number; max: number } | null;
  minSeconds: number | null;
  prompts: string[];
} {
  const base = {
    stimulus: null as string | null,
    criteria: [] as string[],
    charBand: null as { min: number; max: number } | null,
    minSeconds: null as number | null,
    prompts: [] as string[],
  };
  switch (item.taskType) {
    case "WRITING_PROMPT":
    case "SPEAKING_PROMPT": {
      const p = item.payload as ProductivePayload;
      return { ...base, stimulus: p.stimulus ?? null, criteria: p.criteria ?? [], charBand: p.charBand ?? null, minSeconds: p.minSeconds ?? null };
    }
    default:
      return base;
  }
}

export function ProductiveComposer({
  examName,
  skill,
  items,
}: {
  examName: string;
  skill: SwedishSkill;
  items: ProductiveItem[];
}) {
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [rating, setRating] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ratings, setRatings] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  // AI feedback state.
  const [ai, setAi] = useState<AiFeedback | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selfRate, setSelfRate] = useState(false); // revealed when AI is unavailable

  const item = items[step];
  const d = useMemo(() => readDisplay(item), [item]);
  const writing = isWritingType(item.taskType);
  const isLast = step === items.length - 1;
  const canGrade = text.trim().length >= 20;

  async function getFeedback() {
    if (aiBusy || saved || !canGrade) return;
    setAiBusy(true);
    setAiError(null);
    const outcome = await gradeProductive({
      exam: item.exam,
      skill: item.skill,
      taskType: item.taskType,
      cefr: item.cefr,
      title: item.title,
      prompt: item.prompt,
      criteria: d.criteria,
      response: text,
    });
    setAiBusy(false);
    if (outcome.status === "graded") {
      setAi(outcome.feedback);
      setSaved(true);
      setRatings((prev) => [...prev, outcome.feedback.band]);
    } else if (outcome.status === "unavailable") {
      setSelfRate(true); // fall back to the honest self-rating flow
    } else {
      setAiError(outcome.message);
    }
  }

  async function save() {
    if (saved || busy || rating === null) return;
    setBusy(true);
    await submitAttempt({
      exam: item.exam,
      skill: item.skill,
      taskType: item.taskType,
      response: { text },
      selfScore: rating,
    });
    setBusy(false);
    setSaved(true);
    setRatings((prev) => [...prev, rating]);
  }

  function next() {
    if (isLast) {
      setDone(true);
      return;
    }
    setStep((s) => s + 1);
    setText("");
    setRating(null);
    setSaved(false);
    setAi(null);
    setAiError(null);
    setSelfRate(false);
  }

  if (done) {
    return (
      <Summary
        examName={examName}
        skill={skill}
        ratings={ratings}
        onReset={() => { setStep(0); setText(""); setRating(null); setSaved(false); setRatings([]); setDone(false); }}
      />
    );
  }

  const charCount = text.trim().length;
  const inBand = d.charBand ? charCount >= d.charBand.min && charCount <= d.charBand.max : true;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-almi-text-muted">
        <span>Task {step + 1} of {items.length}</span>
        <span>{SKILL_LABELS[skill].en}</span>
      </div>

      <div className="space-y-4 rounded-2xl border border-almi-bg-peach bg-almi-bg-peach/30 p-5">
        <h3 className="text-base font-semibold text-almi-ink">{item.title}</h3>
        <p className="text-sm text-almi-text">{item.prompt}</p>

        {d.stimulus && (
          <p className="whitespace-pre-wrap rounded-xl border border-almi-bg-peach bg-almi-paper p-4 text-sm text-almi-text">
            {d.stimulus}
          </p>
        )}

        {d.prompts.length > 0 && (
          <div className="rounded-xl border border-almi-bg-peach bg-almi-paper p-4 text-sm text-almi-text">
            <p className="font-semibold text-almi-ink">Reflect on</p>
            <ul className="mt-1 list-disc pl-5">
              {d.prompts.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
        )}

        {d.criteria.length > 0 && (
          <div className="rounded-xl border border-almi-bg-peach bg-almi-paper p-4 text-sm">
            <p className="font-semibold text-almi-ink">What your answer should show</p>
            <ul className="mt-1 list-disc pl-5 text-almi-text">
              {d.criteria.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-almi-ink">
            {writing ? "Your written answer" : "Your speaking notes"}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={writing ? 8 : 5}
            disabled={saved}
            placeholder={writing ? "Write your answer here…" : "Jot down what you would say…"}
            className="mt-2 w-full rounded-xl border border-almi-bg-peach bg-almi-paper p-3 text-sm text-almi-text"
          />
          <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs">
            {writing && d.charBand ? (
              <span className={inBand ? "text-almi-teal" : "text-almi-text-muted"}>
                {charCount} characters · target {d.charBand.min}–{d.charBand.max}
              </span>
            ) : writing ? (
              <span className="text-almi-text-muted">{charCount} characters</span>
            ) : (
              <span className="text-almi-text-muted">
                {d.minSeconds ? `Aim to speak for at least ${d.minSeconds} seconds.` : "Practise aloud from your notes."}
              </span>
            )}
          </div>
        </div>

        {selfRate && !saved && (
          <fieldset>
            <legend className="text-sm font-semibold text-almi-ink">
              Practice estimate — your own self-rating (not an official score)
            </legend>
            <p className="mt-1 text-xs text-almi-text-muted">
              AI feedback isn&apos;t available right now — rate your own answer honestly instead.
            </p>
            <div className="mt-2 space-y-2">
              {RATINGS.map((r) => (
                <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-sm ${rating === r ? "border-almi-coral bg-almi-coral/5" : "border-almi-bg-peach bg-almi-paper"}`}>
                  <input type="radio" name="self-rate" disabled={saved} checked={rating === r} onChange={() => setRating(r)} />
                  <span className="text-almi-text">{RATING_LABEL[r]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {/* AI feedback result */}
      {ai && <AiFeedbackCard feedback={ai} />}

      {aiError && (
        <div className="rounded-xl bg-almi-accent/15 px-4 py-3 text-sm text-almi-ink">{aiError}</div>
      )}

      {saved && selfRate && (
        <div className="rounded-xl bg-almi-teal/15 px-4 py-3 text-sm font-semibold text-almi-teal">
          Saved. This is your own practice estimate — an honest self-rating, not an official result.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!saved && !selfRate && (
          <button type="button" onClick={getFeedback} disabled={aiBusy || !canGrade} className="inline-flex min-h-[44px] items-center rounded-full bg-almi-coral px-6 py-2 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep disabled:opacity-40">
            {aiBusy ? "Getting feedback…" : "Get AI feedback"}
          </button>
        )}
        {!saved && selfRate && (
          <button type="button" onClick={save} disabled={busy || rating === null} className="inline-flex min-h-[44px] items-center rounded-full bg-almi-coral px-6 py-2 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep disabled:opacity-40">
            {busy ? "Saving…" : "Save & self-rate"}
          </button>
        )}
        {saved && (
          <button type="button" onClick={next} className="inline-flex min-h-[44px] items-center rounded-full bg-almi-ink px-6 py-2 text-sm font-semibold text-almi-paper hover:opacity-90">
            {isLast ? "See estimate →" : "Next task →"}
          </button>
        )}
      </div>
    </div>
  );
}

function AiFeedbackCard({ feedback }: { feedback: AiFeedback }) {
  const label =
    feedback.band === "CLEAR" ? "On track" : feedback.band === "BORDERLINE" ? "Borderline" : "Below target";
  return (
    <div className="space-y-3 rounded-2xl border border-almi-bg-peach bg-almi-paper p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-almi-coral/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-almi-coral-deep">
          AI estimate · {label}
        </span>
      </div>
      <p className="text-sm text-almi-text">{feedback.summary}</p>
      {feedback.strengths.length > 0 && (
        <div className="text-sm">
          <p className="font-semibold text-almi-ink">Strengths</p>
          <ul className="mt-1 list-disc pl-5 text-almi-text">
            {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {feedback.improvements.length > 0 && (
        <div className="text-sm">
          <p className="font-semibold text-almi-ink">To improve</p>
          <ul className="mt-1 list-disc pl-5 text-almi-text">
            {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      <p className="text-xs text-almi-text-muted">
        An honest practice estimate against the exam&apos;s criteria — not an official Directorate or Ministry result.
      </p>
    </div>
  );
}

function Summary({
  examName,
  skill,
  ratings,
  onReset,
}: {
  examName: string;
  skill: SwedishSkill;
  ratings: string[];
  onReset: () => void;
}) {
  // Conservative overall = weakest self-rating.
  const order = ["CLEAR", "BORDERLINE", "BELOW"];
  const worst = ratings.reduce((w, r) => (order.indexOf(r) > order.indexOf(w) ? r : w), "CLEAR");
  const label = worst === "CLEAR" ? "On track" : worst === "BORDERLINE" ? "Borderline" : "Below target";

  return (
    <div className="space-y-5 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-almi-accent-deep">
          {examName} · {SKILL_LABELS[skill].en} · practice estimate
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-almi-ink">{label}</h2>
        <p className="text-sm text-almi-text-muted">Your own self-rating across {ratings.length || "the"} task(s)</p>
      </div>
      <p className="text-xs text-almi-text-muted">
        This is a self-assessment for practice only — an estimate, not an official Directorate or Ministry result.
      </p>
      <button type="button" onClick={onReset} className="inline-flex min-h-[44px] items-center rounded-full bg-almi-coral px-6 py-2 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep">
        Practise again
      </button>
    </div>
  );
}
