// Bundled item loader for AlmiNorwegian practice.
//
// Items are authored as JSON bundles under src/data/items/*.json (one per
// surface). The content pipeline may still be generating them, so the loader is
// defensive: any missing, empty, or malformed file falls back to [] rather than
// throwing. Files are read from disk at module load (Node runtime) so we don't
// need every bundle to exist at build/tsc time.

import fs from "fs";
import path from "path";
import type {
  NorwegianTrack,
  NorwegianExam,
  NorwegianSkill,
  NorwegianTaskType,
  NorwegianDifficulty,
  ObjectiveAnswer,
} from "./types";

/** A single authored item, matching the NorwegianItem content fields (no DB id). */
export interface NorwegianItemSeed {
  track: NorwegianTrack;
  exam: NorwegianExam;
  skill: NorwegianSkill;
  taskType: NorwegianTaskType;
  difficulty: NorwegianDifficulty;
  title: string;
  prompt: string;
  payload: unknown;
  answer: ObjectiveAnswer | null;
  maxPoints: number;
}

const BUNDLE_FILES = [
  // Norskprøven ladder — reading / listening / productive (writing+speaking) per exam
  "norskprove-a1a2-reading.json",
  "norskprove-a1a2-listening.json",
  "norskprove-a1a2-productive.json",
  "norskprove-a1a2-productive-2.json",
  "norskprove-a2b1-reading.json",
  "norskprove-a2b1-listening.json",
  "norskprove-a2b1-productive.json",
  "norskprove-a2b1-productive-2.json",
  "norskprove-b1b2-reading.json",
  "norskprove-b1b2-listening.json",
  "norskprove-b1b2-productive.json",
  "norskprove-b1b2-productive-2.json",
  "bergenstesten-reading.json",
  "bergenstesten-listening.json",
  "bergenstesten-productive.json",
  "bergenstesten-productive-2.json",
  // Society / citizenship knowledge tests — single KNOWLEDGE (MCQ) module each
  "statsborgerproven.json",
  "samfunnskunnskapsproven.json",
];

const ITEMS_DIR = path.join(process.cwd(), "src", "data", "items");

function loadBundle(file: string): NorwegianItemSeed[] {
  try {
    const full = path.join(ITEMS_DIR, file);
    if (!fs.existsSync(full)) return [];
    const raw = fs.readFileSync(full, "utf8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as NorwegianItemSeed[];
  } catch {
    // Malformed / partially-written bundle — tolerate and skip.
    return [];
  }
}

let cache: NorwegianItemSeed[] | null = null;

function allItems(): NorwegianItemSeed[] {
  if (cache) return cache;
  cache = BUNDLE_FILES.flatMap(loadBundle);
  return cache;
}

/** Filtered item lookup by any combination of track / exam / skill. */
export function getItems(filter: {
  track?: NorwegianTrack;
  exam?: NorwegianExam;
  skill?: NorwegianSkill;
} = {}): NorwegianItemSeed[] {
  return allItems().filter(
    (it) =>
      (filter.track === undefined || it.track === filter.track) &&
      (filter.exam === undefined || it.exam === filter.exam) &&
      (filter.skill === undefined || it.skill === filter.skill),
  );
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
  exam: NorwegianExam,
  skill: NorwegianSkill,
  n: number,
  seed?: number,
): NorwegianItemSeed[] {
  const pool = getItems({ exam, skill });
  const ordered =
    seed === undefined
      ? pool
      : stableShuffle(pool, seed ^ hashSeed(`${exam}:${skill}`));
  return ordered.slice(0, Math.max(0, n));
}
