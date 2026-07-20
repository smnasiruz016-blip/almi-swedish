// Build-time FORK HYGIENE GATE — the AlmiWorld §7 rule, enforced instead of trusted.
//
// WHY THIS EXISTS. This repo's lineage is:
//   almi-celpip → almi-goethe → almi-icelandic → almi-danish → almi-norwegian → almi-swedish
// and every hop leaked the previous country's facts into user-facing copy. Real
// examples found live in production, not hypotheticals:
//   • almi-norwegian shipped `DK_UNIS = "the University of Copenhagen, Aarhus
//     University and other NORWEGIAN universities"` — Danish universities asserted
//     as Norwegian, on roughly a third of the study matrix.
//   • It cited "the Norwegian Patient Safety Authority, Styrelsen for
//     Patientsikkerhed" — Denmark's regulator — telling healthcare applicants to
//     seek authorisation from the wrong country's authority.
//   • It named "the University of Southern Norway", a FABRICATED institution
//     produced by find-replacing "Denmark"→"Norway" in "University of Southern
//     Denmark".
//   • Its listening module called ttsLang() → "is-IS": every Norwegian transcript
//     read aloud in an ICELANDIC voice, inherited from almi-icelandic.
//
// The lesson: a grep for the previous country's nouns is NOT enough, because the
// dangerous cases are the ones where the LABEL was localized and the FACT was not
// ("...and other Norwegian universities" passes a "Norway" grep). So this gate
// bans the ancestors' proper nouns outright — any occurrence is a leak, since a
// Swedish product has no reason to name Norwegian exams or Danish agencies.
//
// Runs before the build and FAILS it on any hit. If a future fork descends from
// this repo, update BANNED to add Swedish nouns and keep the ancestors listed.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "scripts", "prisma"];
const SCAN_EXT = /\.(ts|tsx|js|mjs|json|prisma|css|md)$/;

// Files allowed to mention an ancestor noun, with the reason. Kept deliberately
// tiny — every entry is a hole in the gate.
const ALLOWLIST = new Map([
  // The family nav legitimately links to sibling products by name.
  ["src/lib/nav/family.ts", "links to sibling AlmiWorld products by name"],
  // This gate documents the exact leaks it prevents.
  ["scripts/seo/fork-hygiene-gate.mjs", "documents the banned nouns"],
  // REMOVED 2026-07-20: scripts/seo/countries-axis-gate.mjs. It was allowlisted in
  // 2026-07-15 because its COMMENTS name almi-icelandic while explaining which forks
  // shared the self-origin bug. Comments are no longer scanned, so the entry bought
  // nothing and cost a hole — verified by removing it and re-running: still green.
  // The gate's own entry below is NOT removable for the same reason, and the
  // difference is the point: BANNED is a list of string literals, which still ship
  // and are still scanned.
  // REAL-WORLD REFERENCE DATA, not authored copy. Norway/Denmark/Iceland are
  // legitimate ORIGIN countries for a Swedish product (someone really can move
  // from Norway to Sweden), universities.json lists institutions worldwide as
  // origin references, and Malmö's hub profile correctly mentions the Öresund
  // link to Copenhagen. These axes are imported, not written — the fork risk
  // lives in the prose that consumes them, which is NOT allowlisted.
  ["src/data/seo/countries.json", "Norway/Denmark are valid origin countries"],
  ["src/data/seo/universities.json", "worldwide origin institutions"],
  ["src/data/seo/hubs.json", "Malmö genuinely borders Denmark via the Öresund Bridge"],
]);

// Per-line escape for prose that must NAME an ancestor to warn about it (e.g. the
// comments documenting the DK_UNIS leak). Deliberately verbose so it shows up in
// review: a line carrying this marker is asserting "I mean this on purpose".
const LINE_ESCAPE = "hygiene-allow";

// Ancestor proper nouns. A Swedish product naming any of these is a fork leak.
const BANNED = [
  // — Norwegian —
  "Norskprøven", "Norskprøve", "Norskprov", "norskprove",
  "Bergenstesten", "Bergenstest",
  "Statsborgerprøven", "Statsborgerprove",
  "Samfunnskunnskapsprøven", "Samfunnskunnskap",
  "Utlendingsdirektoratet", "HK-dir",
  "Leseforståelse", "Lytteforståelse", "Skriftlig framstilling",
  "Norge", "Norwegian", "Norway",
  "nb-NO", "nn-NO",
  // — Danish —
  "Prøve i Dansk", "Indfødsretsprøven", "Studieprøven",
  "Styrelsen for Patientsikkerhed", "Styrelsen for International Rekruttering",
  "Læsning", "Lytning", "Skrivning",
  "Danmark", "Danish", "Denmark",
  "da-DK",
  // — Icelandic —
  "Ríkisborgarapróf", "Útlendingastofnun", "Háskóli Íslands",
  "Iceland", "Icelandic",
  "is-IS",
  // — Earlier ancestors (German / Portuguese / Dutch / CELPIP) —
  "Goethe-Institut", "AlmiGoethe", "Schreiben", "Sprechen",
  "CAPLE", "Celpe-Bras", "AlmiPortuguese",
  "AlmiCELPIP",
];

// ── Product-slug forms, generated rather than listed ─────────────────────────────
//
// The hand-written list carried "almi-danish", "almi-norwegian", "almi-icelandic"
// and stopped there — the hyphen form only. A slug ships in four shapes, and the
// underscore one is not hypothetical: AlmiSwiss holds "almi_norwegian_session" in
// src/lib/auth.ts as a legacy cookie name, deliberately escaped. The same string
// arriving here would have passed this gate silently.
//
// Generating the forms means a new ancestor is one word, not four entries with one
// quietly forgotten.
const ANCESTOR_PRODUCTS = [
  "celpip", "goethe", "icelandic", "danish", "norwegian", "portuguese", "dutch",
];
/** Every form a product slug ships in: almi-x · almi_x · almix · AlmiX. */
function productNameForms(prod) {
  return [
    `almi-${prod}`,
    `almi_${prod}`,
    `almi${prod}`,
    `Almi${prod[0].toUpperCase()}${prod.slice(1)}`,
  ];
}
for (const prod of ANCESTOR_PRODUCTS) BANNED.push(...productNameForms(prod));

// SELF-CHECK — this product's own name must never end up in BANNED.
//
// A generator is precisely what a careless global find-replace rewrites. AlmiSwiss
// hit this on 2026-07-16: a blanket rename of the ancestor's product name also
// rewrote its ban list, so the gate began banning "AlmiSwiss" itself and reported 90
// false positives that looked exactly like a real leak storm. The irony is the
// lesson — a careless global replace is the very thing this gate exists to catch,
// and it was noticed only because the count moved the wrong way. Assert it instead.
const SELF_NAMES = ["AlmiSwedish", "almi-swedish", "almi_swedish", "almiswedish"];
for (const n of SELF_NAMES) {
  if (BANNED.some((b) => b.toLowerCase() === n.toLowerCase())) {
    console.error(
      `\n\u2717 FORK HYGIENE GATE MISCONFIGURED — "${n}" is this product's own name` +
        " and must not be in BANNED.\n\n  This is what a blanket find-replace across the" +
        " repo looks like when it reaches\n  this file: the gate starts reporting the" +
        " product as a leak from itself.\n",
    );
    process.exit(1);
  }
}

// `SIRI` and `UDI` need word boundaries — they collide with ordinary substrings.
const BANNED_WORD = ["UDI", "SIRI"];

// ── What gets scanned ────────────────────────────────────────────────────────────
//
// COMMENTS ARE NOT SCANNED. A comment naming an ancestor is documentation, not a
// leak — usually the opposite, since it exists to stop a duplication being mistaken
// for original work. Scanning them made the gate red for two provenance notes and
// invited a third allowlist entry, and this gate's own header calls every allowlist
// entry a hole. Stripping comments closes the class instead of widening the hole.
//
// STRING LITERALS ARE SCANNED. They are the copy that ships. The leaks in the header
// above were all strings: "other Norwegian universities", "the Norwegian Patient
// Safety Authority", a fabricated "University of Southern Norway". Dropping them to
// scan only item JSON would blind the gate to exactly what it was built for.
//
// The stripper tracks string state so a `//` inside "https://…" is not mistaken for
// a comment — the common way a naive stripper eats real copy.
function stripComments(text) {
  let out = "";
  let i = 0;
  let quote = null;      // ' " ` when inside a string
  let inLine = false;    // //
  let inBlock = false;   // /* */
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (inLine) {
      if (c === "\n") { inLine = false; out += c; }
      else out += " ";           // keep length so line numbers survive
      i++; continue;
    }
    if (inBlock) {
      if (c === "*" && n === "/") { inBlock = false; out += "  "; i += 2; continue; }
      out += c === "\n" ? c : " ";
      i++; continue;
    }
    if (quote) {
      if (c === "\\") { out += text.slice(i, i + 2); i += 2; continue; }
      if (c === quote) quote = null;
      out += c; i++; continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; out += c; i++; continue; }
    if (c === "/" && n === "/") { inLine = true; out += "  "; i += 2; continue; }
    if (c === "/" && n === "*") { inBlock = true; out += "  "; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

// Prisma and CSS use their own comment syntax; # is prisma's.
function stripHashComments(text) {
  return text.split(/\r?\n/).map((l) => l.replace(/#.*$/, "")).join("\n");
}

// JSON is scanned as PARSED STRING VALUES, the real-entity-gate design: scanning raw
// JSON text matches escape sequences rather than content, and a gate that scans the
// wrong thing is a gate that has never truly been red.
function jsonStrings(node, out = []) {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const v of node) jsonStrings(v, out);
  else if (node && typeof node === "object") for (const v of Object.values(node)) jsonStrings(v, out);
  return out;
}

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e === ".git") continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.test(e)) out.push(full);
  }
  return out;
}

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    if (ALLOWLIST.has(rel)) continue;
    const raw = readFileSync(file, "utf8");
    let text;
    if (rel.endsWith(".json")) {
      // parsed values only — never the raw JSON text
      try { text = jsonStrings(JSON.parse(raw)).join("\n"); }
      catch { text = raw; }   // malformed JSON: fall back rather than skip silently
    } else if (rel.endsWith(".prisma")) {
      text = stripHashComments(raw);
    } else {
      text = stripComments(raw);
    }
    const lines = text.split(/\r?\n/);
    // The per-line escape lives in a TRAILING COMMENT, so it must be read from the
    // RAW line, not the stripped one. Stripping comments removed the marker along
    // with them, which silently disarmed every escaped CODE line.
    const rawLines = raw.split(/\r?\n/);

    lines.forEach((line, i) => {
      if ((rawLines[i] ?? "").includes(LINE_ESCAPE)) return;
      for (const term of BANNED) {
        if (line.includes(term)) {
          violations.push(`${rel}:${i + 1}  banned ancestor noun "${term}"\n      ${line.trim().slice(0, 120)}`);
        }
      }
      for (const term of BANNED_WORD) {
        if (new RegExp(`\\b${term}\\b`).test(line)) {
          violations.push(`${rel}:${i + 1}  banned ancestor noun "${term}"\n      ${line.trim().slice(0, 120)}`);
        }
      }
    });
  }
}

// ── Structural audit of countries.json ────────────────────────────────────────
// The noun-ban above allowlists this file, because Norway/Denmark ARE valid origins
// for a Swedish product. That allowlist was a hole: on 2026-07-15 the file itself was
// found corrupted by a blind Denmark→Norway find-replace inherited from almi-norwegian —
// the Denmark row renamed to slug "norway"/name "Norway" (its 🇩🇰 flag the only tell),
// Iceland's name overwritten with "Norway", and two rows slugged "norway". Denmark had
// silently vanished as an origin. A noun grep can never catch that: the label said
// Norway and the fact was a flag.
//
// So audit the DATA, not the prose: flag emoji encode ISO-3166 alpha-2 (regional
// indicators U+1F1E6–U+1F1FF → A–Z), which makes every row self-checking.
const SELF_ISO = "SE"; // this product's own country — never a valid origin of itself
function isoFromFlag(flag) {
  const cp = [...flag];
  if (cp.length < 2) return "??";
  const a = cp[0].codePointAt(0) - 0x1f1e6;
  const b = cp[1].codePointAt(0) - 0x1f1e6;
  if (a < 0 || a > 25 || b < 0 || b > 25) return "??";
  return String.fromCharCode(65 + a) + String.fromCharCode(65 + b);
}
try {
  const countries = JSON.parse(readFileSync(join(ROOT, "src/data/seo/countries.json"), "utf8"));
  const seenSlug = new Map();
  const seenIso = new Map();
  for (const row of countries) {
    const iso = isoFromFlag(row.flag ?? "");
    if (iso === "??") violations.push(`countries.json: ${row.slug} has an unreadable flag`);
    if (iso === SELF_ISO)
      violations.push(`countries.json: ${row.slug} (${iso}) is THIS product's own country — you cannot come from where you already are`);
    if (seenSlug.has(row.slug))
      violations.push(`countries.json: duplicate slug "${row.slug}" (${seenSlug.get(row.slug)} and ${iso}) — bySlug is last-wins, so one row silently shadows the other while still emitting URLs`);
    if (seenIso.has(iso))
      violations.push(`countries.json: duplicate flag ${iso} on "${seenIso.get(iso)}" and "${row.slug}" — one of them was renamed`);
    seenSlug.set(row.slug, iso);
    seenIso.set(iso, row.slug);
  }
} catch (e) {
  violations.push(`countries.json: could not audit — ${e.message}`);
}

if (violations.length) {
  console.error("\n✗ FORK HYGIENE GATE FAILED — ancestor-country content found.\n");
  console.error("  Sweden must read as Sweden. These are leaks from the fork lineage");
  console.error("  (celpip → goethe → icelandic → danish → norwegian → swedish).\n");
  for (const v of violations) console.error(`  ${v}`);
  console.error(`\n  ${violations.length} violation(s). Fix the FACT, not just the label —`);
  console.error("  the worst leaks are the ones where only the country word was swapped.\n");
  process.exit(1);
}

console.log(`✓ Fork hygiene gate: clean (no ancestor-country nouns across ${SCAN_DIRS.join(", ")}).`);
