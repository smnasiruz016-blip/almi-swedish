// Bundled item loader for AlmiSwedish practice.
//
// Items are authored as JSON bundles under src/data/items/*.json (one per
// surface). The content pipeline may still be generating them, so the loader is
// defensive: any missing, empty, or malformed file falls back to [] rather than
// throwing. Files are read from disk at module load (Node runtime) so we don't
// need every bundle to exist at build/tsc time.

import crypto from "crypto";
import fs from "fs";
import path from "path";
import type {
  SwedishTrack,
  SwedishExam,
  SwedishSkill,
  SwedishTaskType,
  SwedishDifficulty,
  CefrLevel,
  ObjectiveAnswer,
} from "./types";

/** A single authored item, matching the SwedishItem content fields (no DB id). */
export interface SwedishItemSeed {
  track: SwedishTrack;
  exam: SwedishExam;
  skill: SwedishSkill;
  taskType: SwedishTaskType;
  difficulty: SwedishDifficulty;
  /** The CEFR level this task is pitched at (optional). Feeds the achieved-level
   *  readout and the level-aware AI grader. Absent = UNDECLARED: never counted
   *  toward a level, never allowed to imply one. */
  cefr?: CefrLevel;
  title: string;
  prompt: string;
  payload: unknown;
  answer: ObjectiveAnswer | null;
  maxPoints: number;
}

const BUNDLE_FILES = [
  // Swedish language ladder — reading / listening / productive (writing+speaking) per exam
  "sfi-ab-reading.json",
  "sfi-ab-listening.json",
  "sfi-ab-productive.json",
  "sfi-ab-productive-2.json",
  "sfi-cd-reading.json",
  "sfi-cd-listening.json",
  "sfi-cd-productive.json",
  "sfi-cd-productive-2.json",
  "svenska-b1b2-reading.json",
  "svenska-b1b2-listening.json",
  "svenska-b1b2-productive.json",
  "svenska-b1b2-productive-2.json",
  "tisus-reading.json",
  "tisus-listening.json",
  "tisus-productive.json",
  "tisus-productive-2.json",
  // Society knowledge test — a single KNOWLEDGE (MCQ) module. Exactly one: Sweden
  // has one society test. There is no language bundle for the citizenship test
  // because UHR has not published a spec for it (see lib/sv/registry.ts).
  "medborgarskapsprov.json",
];

const ITEMS_DIR = path.join(process.cwd(), "src", "data", "items");

function loadBundle(file: string): SwedishItemSeed[] {
  try {
    const full = path.join(ITEMS_DIR, file);
    if (!fs.existsSync(full)) return [];
    const raw = fs.readFileSync(full, "utf8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SwedishItemSeed[];
  } catch {
    // Malformed / partially-written bundle — tolerate and skip.
    return [];
  }
}

let cache: SwedishItemSeed[] | null = null;

function allItems(): SwedishItemSeed[] {
  if (cache) return cache;
  cache = BUNDLE_FILES.flatMap(loadBundle);
  return cache;
}

/** Filtered item lookup by any combination of track / exam / skill. */
export function getItems(filter: {
  track?: SwedishTrack;
  exam?: SwedishExam;
  skill?: SwedishSkill;
} = {}): SwedishItemSeed[] {
  return allItems().filter(
    (it) =>
      (filter.track === undefined || it.track === filter.track) &&
      (filter.exam === undefined || it.exam === filter.exam) &&
      (filter.skill === undefined || it.skill === filter.skill),
  );
}

// ── SERVER-SIDE ITEM IDENTITY ───────────────────────────────────────────────
// Items are bundle-served with NO database id, but grading must be server-authoritative:
// the submit route re-loads the item by id and grades against the SERVER-held answer
// key, so the key never ships in the served payload and a client-supplied answer is
// never trusted. Before this existed, /api/sv/submit destructured `answer` off the
// request body and passed it to gradeObjective() — a forged POST that supplied both the
// key and a matching response scored 100% without knowing anything.
//
// ── WHY THE WHOLE CONTENT, AND NOT JUST THE TITLE ──
// Measured across all 263 authored items, the narrow tuples are unique TODAY: exam|skill|
// title collides zero times here. They are still the wrong choice, and almi-norwegian is
// the evidence — the same fork, the same loader, and there exam|skill|title collided 3×
// because two genuinely different productive tasks happened to share a title:
//
//   "Summary of a research finding" · "Talk about your family" · "Ask for directions"
//
// This product ships the same -productive.json / -productive-2.json pairing in all four
// language ladders, so that coincidence is not prevented here — it simply has not
// happened yet. On a narrow tuple the day it happens is the day getItemById() starts
// grading one task against another task's key, silently, and the gate stays green
// because the gate can only see as far as the tuple does. Hashing the prompt and payload
// costs nothing and closes that door before it opens.
//
// `answer`, `cefr` and `difficulty` are deliberately NOT hashed. The id names the
// QUESTION, not its key or its tagging, so a de-game re-key pass or a CEFR tagging pass
// leaves every id untouched. The trade, stated rather than implied: editing a title,
// prompt or payload DOES change that item's id. That is safe here because the id is a
// round-trip handle (served with the item, posted straight back) and is never persisted
// as a foreign key that has to survive — SwedishAttempt.itemId points at SwedishItem, a
// table nothing populates, so that write already fails into its own catch.

/** Stable, content-derived id for a bundle item — the handle the client posts back. */
export function stableItemId(
  it: Pick<SwedishItemSeed, "exam" | "skill" | "taskType" | "title" | "prompt" | "payload">,
): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        exam: it.exam,
        skill: it.skill,
        taskType: it.taskType,
        title: it.title,
        prompt: it.prompt,
        payload: it.payload,
      }),
    )
    .digest("hex")
    .slice(0, 16);
}

/** Re-load the full item (INCLUDING its answer key) by its stable id, server-side. */
export function getItemById(id: string): SwedishItemSeed | undefined {
  return allItems().find((it) => stableItemId(it) === id);
}

/** The collision check as a PURE function over any item list, so the gate can be shown
 *  RED against a synthetic duplicate without ever editing an authored bundle. Returns
 *  one human-readable line per colliding pair; empty means clean. */
export function findIdCollisions(items: readonly SwedishItemSeed[]): string[] {
  const seen = new Map<string, string>();
  const out: string[] = [];
  for (const it of items) {
    const id = stableItemId(it);
    const key = `${it.exam}|${it.skill}|${it.taskType}|${it.title}`;
    const prior = seen.get(id);
    if (prior) {
      out.push(`"${key}" and "${prior}" both hash to ${id} — grading would key against the wrong item`);
      continue;
    }
    seen.set(id, key);
  }
  return out;
}

/**
 * Build-time guard: no two bundle items may share a stable id. A collision would make
 * getItemById() return the wrong item, so the submit route would grade a learner's
 * answer against a DIFFERENT item's key — silently, and only for the colliding pair.
 */
export function assertNoIdCollisions(): void {
  const collisions = findIdCollisions(allItems());
  if (collisions.length > 0) {
    throw new Error(`stableItemId collision:\n  ${collisions.join("\n  ")}`);
  }
}

/**
 * Deterministic stable string hash → 32-bit int. Used as a fallback seed so the
 * pick is varied but reproducible without Math.random at module/build scope.
 */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG (mulberry32) for a stable shuffle from a numeric seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stableShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  const rng = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deterministically pick up to n practice items for an exam + skill. With no
 * seed the natural (authored) order is preserved; a numeric seed produces a
 * stable reshuffle for variety. Never uses Math.random.
 */
export function pickPractice(
  exam: SwedishExam,
  skill: SwedishSkill,
  n: number,
  seed?: number,
): SwedishItemSeed[] {
  const pool = getItems({ exam, skill });
  const ordered =
    seed === undefined
      ? pool
      : stableShuffle(pool, seed ^ hashSeed(`${exam}:${skill}`));
  return ordered.slice(0, Math.max(0, n));
}
