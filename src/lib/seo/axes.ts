// SEO axis loader + cartesian helpers.
// The programmatic matrix (~7.99M pages) is NOT stored row-by-row. We store the
// small real axes (imported from AlmiStudy / job-roles / almi-data) and compute
// each page's identity from its slug, and each sitemap shard's URLs from an index
// range via mixed-radix decomposition. Keeps Neon free of matrix rows (cost §8).

import universitiesJson from "@/data/seo/universities.json";
import rolesJson from "@/data/seo/roles.json";
import countriesJson from "@/data/seo/countries.json";
import subjectsJson from "@/data/seo/subjects.json";
import hubsJson from "@/data/seo/hubs.json";

export interface SeoUniversity {
  slug: string; name: string; city: string | null;
  countrySlug: string | null; countryName: string | null; cc: string | null;
  controlType: string | null; subjects: string[];
}
export interface SeoRole { slug: string; name: string; industry: string; collar: string; }
export interface SeoCountry { slug: string; name: string; flag: string; }
export interface SeoSubject { slug: string; name: string; }
export interface SeoHub { slug: string; name: string; region: string; profile: string; }

export const UNIVERSITIES = universitiesJson as SeoUniversity[];
export const ROLES = rolesJson as SeoRole[];
// Origins only: 196 = the 197-country axis minus Sweden itself (it is the destination).
// Sweden's exclusion was always right, but Portugal was missing until 2026-07-15 —
// inherited from almi-portuguese's copy, where dropping PT was correct because PT was
// its own self. fork-hygiene-gate.mjs could not catch that: it checks for BAD rows,
// and this bug is an ABSENCE. See scripts/seo/countries-axis-gate.mjs.
export const COUNTRIES = countriesJson as SeoCountry[];
export const SUBJECTS = subjectsJson as SeoSubject[];
export const HUBS = hubsJson as SeoHub[];

function bySlug<T extends { slug: string }>(arr: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const x of arr) m.set(x.slug, x);
  return m;
}
export const UNI_BY_SLUG = bySlug(UNIVERSITIES);
export const ROLE_BY_SLUG = bySlug(ROLES);
export const COUNTRY_BY_SLUG = bySlug(COUNTRIES);
export const SUBJECT_BY_SLUG = bySlug(SUBJECTS);
export const HUB_BY_SLUG = bySlug(HUBS);

// Counts + totals
export const N_UNI = UNIVERSITIES.length;
export const N_ROLE = ROLES.length;
export const N_COUNTRY = COUNTRIES.length;
export const N_SUBJECT = SUBJECTS.length;
export const N_HUB = HUBS.length;

// Totals are computed from the axis lengths at runtime; the figures in these
// comments are documentation only and MUST be re-derived when an axis changes.
// (The Norwegian base carried "512 roles" here while roles.json held 518, and the  hygiene-allow
// wrong number then propagated into planning docs. Check, don't copy.)
export const STUDY_TOTAL = N_SUBJECT * N_COUNTRY * N_UNI; // 12 × 195 × 3,197 = 7,480,980
export const JOBS_TOTAL = N_ROLE * N_COUNTRY * N_HUB; //    518 × 195 × 5   =   505,050

// Deterministic string hash (FNV-1a) → non-negative int, for template-variant
// selection so phrasing is stable per URL yet distributed across the matrix.
export function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
export function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ---- Cartesian ordering for sitemap sharding (mixed-radix) ----
// Study index: ((subjectIdx * N_COUNTRY) + countryIdx) * N_UNI + uniIdx
export function studyComboAtIndex(i: number): { subject: SeoSubject; country: SeoCountry; university: SeoUniversity } | null {
  if (i < 0 || i >= STUDY_TOTAL) return null;
  const uniIdx = i % N_UNI;
  const rest = Math.floor(i / N_UNI);
  const countryIdx = rest % N_COUNTRY;
  const subjectIdx = Math.floor(rest / N_COUNTRY);
  return { subject: SUBJECTS[subjectIdx], country: COUNTRIES[countryIdx], university: UNIVERSITIES[uniIdx] };
}
// Jobs index: ((roleIdx * N_COUNTRY) + countryIdx) * N_HUB + hubIdx
export function jobsComboAtIndex(i: number): { role: SeoRole; country: SeoCountry; hub: SeoHub } | null {
  if (i < 0 || i >= JOBS_TOTAL) return null;
  const hubIdx = i % N_HUB;
  const rest = Math.floor(i / N_HUB);
  const countryIdx = rest % N_COUNTRY;
  const roleIdx = Math.floor(rest / N_COUNTRY);
  return { role: ROLES[roleIdx], country: COUNTRIES[countryIdx], hub: HUBS[hubIdx] };
}

export const studyPath = (subjectSlug: string, countrySlug: string, uniSlug: string) =>
  `/study-in-sweden/${subjectSlug}/from/${countrySlug}/${uniSlug}`;
export const jobsPath = (roleSlug: string, countrySlug: string, hubSlug: string) =>
  `/work-in-sweden/${roleSlug}/from/${countrySlug}/${hubSlug}`;
