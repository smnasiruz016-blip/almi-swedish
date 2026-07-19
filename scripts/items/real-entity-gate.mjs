// Real-entity gate — blocks invented messages attributed to real organisations.
//
// Ported from AlmiDutch, where the bank had shipped letters signed by real municipalities
// and seven named businesses, three of which turned out to be real practices. Every one
// had survived review, because the surrounding facts were right. That is the danger: an
// invented document reads as credible exactly when nothing else about it is wrong.
//
// Swedish needs a different shape from Dutch, and getting that wrong makes the gate
// useless rather than merely imprecise:
//
//   - Word order is reversed. Dutch names a municipality as "Gemeente Almere"; Swedish
//     writes "Lunds kommun" — the name comes FIRST. A pattern written for Dutch would
//     never fire here.
//
//   - Definiteness carries the meaning. "kommun" (indefinite) is what follows a name;
//     "kommunen" (definite) means "the municipality" generically and is exactly what we
//     WANT authors to write. Keying on the definite form would flag every correct usage,
//     and a gate that cries wolf gets switched off.
//
//   - A capital at the start of a sentence is not a proper noun. An early draft of this
//     scan flagged the Danish option "At kommunen ikke skal bruge penge på trafik" —
//     "At" simply means "that".
//
// It scans the payload's STRING VALUES, not its JSON. Scanning the serialised form makes
// every pattern compete with JSON escaping, and that is not theoretical: the first
// version carried a lookbehind of ["\\n], which inside a character class is a backslash
// and the LETTER n — so any name preceded by a word ending in n ("från Lunds kommun")
// was silently excluded. The gate reported clean while the violation sat in the bank.
// Found by deliberately injecting a violation and watching the gate stay green.
//
// Deliberately NOT flagged: a real place as setting, a real station in a transport
// announcement, a public body named factually in a knowledge question. Those are
// accurate, not misattributed.

import fs from "node:fs";
import path from "node:path";

const ITEMS_DIR = path.join(process.cwd(), "src", "data", "items");
const problems = [];

// Name + indefinite "kommun"/"stad", where the name does not open a sentence.
const MUNICIPALITY_AS_ACTOR = /(?<![.!?]\s)\b([A-ZÅÄÖ][a-zåäö]+s?)\s+(kommun|stad)\b/g;

// Category noun followed by a proper name — "förskolan Videt", "vårdcentralen Björken".
const CATEGORY_NOUNS = [
  "förskolan", "skolan", "grundskolan", "gymnasiet", "vårdcentralen", "tandläkarmottagningen",
  "apoteket", "sjukhuset", "biblioteket", "simhallen", "affären", "butiken", "mataffären",
  "hyresvärden", "bostadsbolaget", "föreningen", "klubben", "restaurangen", "caféet",
];
// [ \t] rather than \s: an institution's name never sits on the line AFTER its category
// noun, and allowing a newline between them invents violations. "Öppet hus i
// biblioteket\n\nVarje tisdag…" matched as "biblioteket Varje" — Varje means "every" and
// is capitalised only because it opens a sentence. Today's bank happens not to contain
// such a heading, so the gate looked clean; the same shape in AlmiDutch produced a false
// hit the moment it started scanning real strings. A gate that cries wolf gets switched
// off, so precision matters as much as reach.
const NAMED_BUSINESS = new RegExp(`\\b(${CATEGORY_NOUNS.join("|")})[ \\t]+([A-ZÅÄÖ][a-zåäö]{2,})`, "g");

// Real Swedish companies — the Helvetia case: an invented letter signed by a real firm.
const BRAND_DENYLIST = [
  "ICA", "Coop", "Willys", "Hemköp", "Lidl", "Systembolaget",
  "Swedbank", "Handelsbanken", "Nordea", "SEB", "Länsförsäkringar", "Folksam", "Trygg-Hansa",
  "Telia", "Tele2", "Telenor", "Comviq", "Vattenfall", "Fortum", "Ellevio",
  "Skånetrafiken", "Västtrafik", "PostNord", "IKEA", "Clas Ohlson", "Elgiganten",
  "Blocket", "Klarna",
];

// Collect every string in a payload, so patterns run against real text, not JSON.
function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) for (const x of v) strings(x, out);
  else if (v && typeof v === "object") for (const x of Object.values(v)) strings(x, out);
  return out;
}

let scanned = 0;
for (const file of fs.readdirSync(ITEMS_DIR).filter((f) => f.endsWith(".json"))) {
  const raw = JSON.parse(fs.readFileSync(path.join(ITEMS_DIR, file), "utf8"));
  for (const [i, item] of (raw.items ?? raw).entries()) {
    scanned++;
    const where = `${file}[${i}] "${item.title}"`;
    for (const text of strings(item.payload)) {
      for (const m of text.matchAll(MUNICIPALITY_AS_ACTOR)) {
        problems.push(`${where}: names a municipality — "${m[0]}". Use "kommunen"; a real municipality must never author invented text.`);
      }
      for (const m of text.matchAll(NAMED_BUSINESS)) {
        problems.push(`${where}: names an institution — "${m[1]} ${m[2]}". Use the bare category ("${m[1]}").`);
      }
      for (const brand of BRAND_DENYLIST) {
        if (new RegExp(`\\b${brand}\\b`).test(text)) {
          problems.push(`${where}: names a real company — "${brand}". Use a generic category.`);
        }
      }
    }
  }
}

if (problems.length) {
  console.error(`\nREAL-ENTITY GATE FAILED — ${problems.length} problem(s) across ${scanned} items:\n`);
  for (const p of [...new Set(problems)]) console.error(`  ✗ ${p}`);
  console.error("\nAn invented letter, call or notice must not carry a real organisation's name.\nReal places as SETTING are fine and are not flagged.\n");
  process.exit(1);
}
console.log(`real-entity gate: ${scanned} items clean (no invented text attributed to a named organisation)`);
