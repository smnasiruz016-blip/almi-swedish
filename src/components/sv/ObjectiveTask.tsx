"use client";

// Renders the input for a single objective task (MCQ/TRUE_FALSE/MATCHING/CLOZE/
// ORDERING) and reports the response in the exact shape gradeObjective() expects.
// After submission it can show per-option correctness. Payloads are narrowed by
// taskType here — the only place that knows each concrete shape.

import { useMemo, useState } from "react";
import type {
  McqPayload,
  MatchingPayload,
  ClozePayload,
  OrderingPayload,
  ObjectiveAnswer,
} from "@/lib/sv/types";
import type { RunnerItem } from "./shared";
import { TtsAudio } from "./TtsAudio";

export function ObjectiveTask({
  item,
  disabled,
  onChange,
}: {
  item: RunnerItem;
  disabled: boolean;
  onChange: (response: unknown) => void;
}) {
  switch (item.taskType) {
    case "MCQ_SINGLE":
    case "TRUE_FALSE":
      return <McqTask item={item} disabled={disabled} onChange={onChange} />;
    case "MATCHING":
      return <MatchingTask item={item} disabled={disabled} onChange={onChange} />;
    case "CLOZE":
      return <ClozeTask item={item} disabled={disabled} onChange={onChange} />;
    case "ORDERING":
      return <OrderingTask item={item} disabled={disabled} onChange={onChange} />;
    default:
      return null;
  }
}

/**
 * Post-submit reveal of the correct answer.
 *
 * `answer` is NOT a property of the item — the served item no longer carries its key.
 * It arrives in the response to /api/sv/submit, after that submission has been scored,
 * and is passed in here. The mock route never returns one, so a mock never renders this.
 * Keep the prop separate from `item` for exactly that reason: an answer that lived on
 * the item again would be in the page again.
 */
export function AnswerReveal({
  item,
  answer,
}: {
  item: RunnerItem;
  answer: ObjectiveAnswer;
}) {
  const lines = describeAnswer(item, answer);
  if (lines.length === 0) return null;
  return (
    <div className="rounded-xl border border-almi-bg-peach bg-almi-paper px-4 py-3 text-sm">
      <p className="font-semibold text-almi-ink">Correct answer</p>
      <ul className="mt-1 space-y-1 text-almi-text">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

/** Turn a key into readable text against the item's own payload. Returns [] rather than
 *  a half-rendered line when a payload does not carry what the key points at. */
function describeAnswer(item: RunnerItem, answer: ObjectiveAnswer): string[] {
  switch (answer.type) {
    case "MCQ_SINGLE":
    case "TRUE_FALSE": {
      const p = item.payload as McqPayload;
      const opt = p?.options?.[answer.correctIndex];
      return opt === undefined ? [] : [opt];
    }
    case "MATCHING": {
      const p = item.payload as MatchingPayload;
      return answer.pairs
        .map(([l, r]) =>
          p?.left?.[l] === undefined || p?.right?.[r] === undefined
            ? null
            : `${p.left[l]} → ${p.right[r]}`,
        )
        .filter((x): x is string => x !== null);
    }
    case "CLOZE": {
      const p = item.payload as ClozePayload;
      return answer.correct
        .map((c) => {
          const opt = p?.gaps?.find((g) => g.id === c.id)?.options?.[c.index];
          return opt === undefined ? null : `Gap ${c.id}: ${opt}`;
        })
        .filter((x): x is string => x !== null);
    }
    case "ORDERING": {
      const p = item.payload as OrderingPayload;
      const seq = answer.order.map((i) => p?.items?.[i]);
      return seq.some((s) => s === undefined)
        ? []
        : seq.map((s, i) => `${i + 1}. ${s}`);
    }
  }
}

function Stimulus({
  passage,
  transcript,
}: {
  passage?: string;
  transcript?: string;
}) {
  return (
    <>
      {transcript ? <TtsAudio transcript={transcript} /> : null}
      {passage ? (
        <p className="whitespace-pre-wrap rounded-xl border border-almi-bg-peach bg-almi-paper p-4 text-sm text-almi-text">
          {passage}
        </p>
      ) : null}
    </>
  );
}

function McqTask({
  item,
  disabled,
  onChange,
}: {
  item: RunnerItem;
  disabled: boolean;
  onChange: (r: unknown) => void;
}) {
  const p = item.payload as McqPayload;
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      <Stimulus passage={p.passage} transcript={p.transcript} />
      <p className="font-medium text-almi-ink">{p.question}</p>
      <div className="space-y-2">
        {p.options.map((opt, i) => (
          <label
            key={i}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              picked === i ? "border-almi-coral bg-almi-coral/5" : "border-almi-bg-peach bg-almi-paper"
            }`}
          >
            <input
              type="radio"
              name={`mcq-${item.title}`}
              checked={picked === i}
              disabled={disabled}
              onChange={() => {
                setPicked(i);
                onChange({ index: i });
              }}
            />
            <span className="text-almi-text">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function MatchingTask({
  item,
  disabled,
  onChange,
}: {
  item: RunnerItem;
  disabled: boolean;
  onChange: (r: unknown) => void;
}) {
  const p = item.payload as MatchingPayload;
  const [picks, setPicks] = useState<Record<number, number>>({});
  function set(left: number, right: number) {
    const next = { ...picks, [left]: right };
    setPicks(next);
    const pairs = Object.entries(next).map(([l, r]) => [Number(l), r]) as [number, number][];
    onChange({ pairs });
  }
  return (
    <div className="space-y-3">
      <Stimulus passage={p.passage} transcript={p.transcript} />
      <p className="text-sm text-almi-text-muted">{p.instructions}</p>
      <div className="space-y-2">
        {p.left.map((prompt, li) => (
          <div key={li} className="flex flex-wrap items-center gap-3">
            <span className="min-w-[10rem] flex-1 text-sm text-almi-ink">{prompt}</span>
            <select
              disabled={disabled}
              value={picks[li] ?? ""}
              onChange={(e) => set(li, Number(e.target.value))}
              className="min-h-[40px] rounded-xl border border-almi-bg-peach bg-almi-paper px-3 py-2 text-sm text-almi-text"
            >
              <option value="" disabled>
                Choose…
              </option>
              {p.right.map((r, ri) => (
                <option key={ri} value={ri}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClozeTask({
  item,
  disabled,
  onChange,
}: {
  item: RunnerItem;
  disabled: boolean;
  onChange: (r: unknown) => void;
}) {
  const p = item.payload as ClozePayload;
  const [picks, setPicks] = useState<Record<number, number>>({});
  const segments = useMemo(() => p.passage.split(/(\{\{\d+\}\})/g), [p.passage]);
  const optionsById = useMemo(
    () => new Map(p.gaps.map((g) => [g.id, g.options])),
    [p.gaps],
  );

  function set(id: number, index: number) {
    const next = { ...picks, [id]: index };
    setPicks(next);
    const gaps = Object.entries(next).map(([gid, gi]) => ({ id: Number(gid), index: gi }));
    onChange({ gaps });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-8 text-almi-text">
        {segments.map((seg, i) => {
          const m = seg.match(/^\{\{(\d+)\}\}$/);
          if (!m) return <span key={i}>{seg}</span>;
          const id = Number(m[1]);
          const opts = optionsById.get(id) ?? [];
          return (
            <select
              key={i}
              disabled={disabled}
              value={picks[id] ?? ""}
              onChange={(e) => set(id, Number(e.target.value))}
              className="mx-1 min-h-[36px] rounded-lg border border-almi-bg-peach bg-almi-paper px-2 py-1 text-sm text-almi-text"
            >
              <option value="" disabled>
                …
              </option>
              {opts.map((o, oi) => (
                <option key={oi} value={oi}>
                  {o}
                </option>
              ))}
            </select>
          );
        })}
      </p>
    </div>
  );
}

function OrderingTask({
  item,
  disabled,
  onChange,
}: {
  item: RunnerItem;
  disabled: boolean;
  onChange: (r: unknown) => void;
}) {
  const p = item.payload as OrderingPayload;
  const [order, setOrder] = useState<number[]>(() => p.items.map((_, i) => i));

  function move(pos: number, dir: -1 | 1) {
    const target = pos + dir;
    if (target < 0 || target >= order.length) return;
    const next = order.slice();
    [next[pos], next[target]] = [next[target], next[pos]];
    setOrder(next);
    onChange({ order: next });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-almi-text-muted">{p.instructions}</p>
      <ul className="space-y-2">
        {order.map((origIndex, pos) => (
          <li
            key={origIndex}
            className="flex items-center gap-3 rounded-xl border border-almi-bg-peach bg-almi-paper px-4 py-3 text-sm text-almi-text"
          >
            <span className="font-semibold text-almi-coral">{pos + 1}.</span>
            <span className="flex-1">{p.items[origIndex]}</span>
            <span className="flex gap-1">
              <button
                type="button"
                disabled={disabled || pos === 0}
                onClick={() => move(pos, -1)}
                className="min-h-[32px] rounded-lg border border-almi-bg-peach px-2 disabled:opacity-30"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={disabled || pos === order.length - 1}
                onClick={() => move(pos, 1)}
                className="min-h-[32px] rounded-lg border border-almi-bg-peach px-2 disabled:opacity-30"
                aria-label="Move down"
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
