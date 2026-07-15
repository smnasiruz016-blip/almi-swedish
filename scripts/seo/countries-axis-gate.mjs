// Build-time COUNTRIES-AXIS GATE.
//
// WHY THIS EXISTS — two real bugs, both shipped to production, that every other
// check in this repo passed:
//
//  1. SELF-ORIGIN. src/data/seo/countries.json listed Sweden itself, so the
//     matrix advertised "Study in Sweden from Sweden". almi-dutch and
//     almi-icelandic had the identical bug. axes.ts even carried the comment
//     "origins only (Sweden excluded)" — the label was localized, the fact was
//     not, which is this lineage's signature failure.
//
//  2. A MISSING COUNTRY — found 2026-07-15. Portugal was absent from EVERY fork
//     in the countries.json lineage. This file descends from almi-portuguese,
//     which created it on 2026-07-10 and correctly dropped PT as its own self;
//     dutch (07-11), icelandic (07-12), danish/norwegian/swedish (07-14) all
//     inherited that copy, where PT is a perfectly legitimate origin. Result:
//     Portuguese users had no /from/portugal page on any of five products.
//     An ancestor's CORRECT self-exclusion became every descendant's silent gap.
//
// Why a noun grep, a self check and a duplicate check ALL miss #2: the bug is an
// ABSENCE. Nothing is misspelled, duplicated or mislabelled — a row simply is not
// there. So this gate does not merely look for bad rows; it asserts the EXACT
// expected set: every country in the axis, minus this product's own.
//
// Flag emoji encode ISO-3166 alpha-2 (regional indicators U+1F1E6..U+1F1FF → A..Z),
// which makes every row self-checking regardless of what its name/slug claim.
//
// Porting to a new fork: change SELF_ISO. Nothing else is product-specific.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const SELF_ISO = "SE"; // this product's own country — never a valid origin of itself

// The full country axis shared by the family (197). Any deviation is a bug:
// a MISSING code silently denies that origin's users their pages; an EXTRA code
// means a row was invented or renamed.
const UNIVERSE = ["AD","AE","AF","AG","AL","AM","AO","AR","AT","AU","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BN","BO","BR","BS","BT","BW","BY","BZ","CA","CD","CF","CG","CH","CI","CL","CM","CN","CO","CR","CU","CV","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","ER","ES","ET","FI","FJ","FM","FR","GA","GB","GD","GE","GH","GM","GN","GQ","GR","GT","GW","GY","HN","HR","HT","HU","ID","IE","IL","IN","IQ","IR","IS","IT","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MG","MH","MK","ML","MM","MN","MR","MT","MU","MV","MW","MX","MY","MZ","NA","NE","NG","NI","NL","NO","NP","NR","NZ","OM","PA","PE","PG","PH","PK","PL","PS","PT","PW","PY","QA","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SI","SK","SL","SM","SN","SO","SR","SS","ST","SV","SY","SZ","TD","TG","TH","TJ","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","US","UY","UZ","VA","VC","VE","VN","VU","WS","XK","YE","ZA","ZM","ZW"];

function isoFromFlag(flag) {
  const cp = [...(flag ?? "")];
  if (cp.length < 2) return "??";
  const a = cp[0].codePointAt(0) - 0x1f1e6;
  const b = cp[1].codePointAt(0) - 0x1f1e6;
  if (a < 0 || a > 25 || b < 0 || b > 25) return "??";
  return String.fromCharCode(65 + a) + String.fromCharCode(65 + b);
}

const violations = [];
let rows;
try {
  rows = JSON.parse(readFileSync(join(process.cwd(), "src/data/seo/countries.json"), "utf8"));
} catch (e) {
  console.error(`\n✗ COUNTRIES-AXIS GATE: cannot read countries.json — ${e.message}\n`);
  process.exit(1);
}

const seenSlug = new Map();
const seenIso = new Map();
const seenName = new Map();
const present = new Set();

for (const row of rows) {
  const iso = isoFromFlag(row.flag);
  if (iso === "??") violations.push(`"${row.slug}" has an unreadable flag — cannot verify which country it really is`);
  if (iso === SELF_ISO) violations.push(`"${row.slug}" (${iso}) is THIS product's own country — you cannot come from where you already are`);
  if (seenSlug.has(row.slug)) violations.push(`duplicate slug "${row.slug}" (${seenSlug.get(row.slug)} + ${iso}) — bySlug is last-wins, so one row silently shadows the other while still emitting URLs`);
  if (iso !== "??" && seenIso.has(iso)) violations.push(`duplicate flag ${iso} on "${seenIso.get(iso)}" and "${row.slug}" — one of them was renamed`);
  if (seenName.has(row.name)) violations.push(`duplicate name "${row.name}" on "${seenName.get(row.name)}" and "${row.slug}" — a row was renamed onto another country`);
  seenSlug.set(row.slug, iso);
  seenIso.set(iso, row.slug);
  seenName.set(row.name, row.slug);
  present.add(iso);
}

// The check the others cannot make: is anything simply ABSENT?
const expected = UNIVERSE.filter((c) => c !== SELF_ISO);
const missing = expected.filter((c) => !present.has(c));
const extra = [...present].filter((c) => c !== "??" && !UNIVERSE.includes(c));
if (missing.length)
  violations.push(`MISSING ${missing.length} origin(s): ${missing.join(", ")} — users from there get no /from/<country> page at all. This is how Portugal vanished from five forks.`);
if (extra.length)
  violations.push(`UNKNOWN country code(s): ${extra.join(", ")} — not in the family axis; a row was invented or mis-flagged`);
if (rows.length !== expected.length)
  violations.push(`expected ${expected.length} origins (${UNIVERSE.length} in the axis minus ${SELF_ISO}), found ${rows.length}`);

if (violations.length) {
  console.error("\n✗ COUNTRIES-AXIS GATE FAILED\n");
  console.error("  src/data/seo/countries.json is the origin axis for the whole SEO matrix;");
  console.error("  sitemap totals derive from its length, so a bad row is served, not just stored.\n");
  for (const v of violations) console.error(`  • ${v}`);
  console.error(`\n  ${violations.length} violation(s). Fix the FACT, not the label.\n`);
  process.exit(1);
}

console.log(`✓ countries axis: ${rows.length} origins, ${SELF_ISO} correctly excluded, none missing.`);
