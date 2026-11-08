// RR-399 · every new proof must turn RED when its fix is undone, and GREEN when restored (each file restored byte-for-byte).
//   A1 attempts save        → node scripts/verify-attempts-save.mjs
//   A4 email before free AI → npx tsx scripts/verify-free-ai-email.ts
//   A5 honest AI badge      → npx tsx scripts/verify-ai-badge.ts   (only where src/lib/billing/ai-badge.ts exists)
// Run: node scripts/sabotage-rr399.mjs   (needs the repo's deps for the tsx tests)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const npx = (s) => spawnSync(process.platform === "win32" ? `npx.cmd tsx ${s}` : `npx tsx ${s}`, { encoding: "utf8", shell: true });
const attempts = () => spawnSync(process.execPath, ["scripts/verify-attempts-save.mjs"], { encoding: "utf8" });
const email = () => npx("scripts/verify-free-ai-email.ts");
const badge = () => npx("scripts/verify-ai-badge.ts");
const HAS_BADGE = existsSync("src/lib/billing/ai-badge.ts");

const schema = readFileSync("prisma/schema.prisma", "utf8");
const ATTEMPT = /^model (\w+Attempt) \{[\s\S]*?^\s*itemId\s+String/m.exec(schema)[1];
const X = ATTEMPT.replace(/Attempt$/, "");
const delegate = X.charAt(0).toLowerCase() + X.slice(1) + "Attempt";
const userRel = new RegExp(`(\\n(\\s*)user\\s+User\\s+@relation\\(fields: \\[userId\\][^\\n]*)`).exec(schema.slice(schema.indexOf(`model ${ATTEMPT} {`)));
const ATTEMPT_FILE = ["src/lib/nl/grade-attempt.ts", "src/lib/sv/grade-attempt.ts", "src/lib/ch/grade-attempt.ts"].find((p) => existsSync(p));
const attemptSrc = readFileSync(ATTEMPT_FILE, "utf8");
const loud = /\} catch \(e\) \{[\s\S]*?console\.error\([^\n]*\n\s*\}/.exec(attemptSrc.slice(attemptSrc.indexOf(`prisma.${delegate}.create(`)))[0];

const CASES = [
  { name: `A1: ${ATTEMPT}.itemId is a foreign key to ${X}Item again`, file: "prisma/schema.prisma", from: userRel[1], to: `${userRel[1]}\n${userRel[2]}item    ${X}Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)`, run: [attempts], fail: [`[FAIL] ${ATTEMPT} has no @relation to ${X}Item`] },
  { name: "A1: the attempt insert is swallowed by a silent catch again", file: ATTEMPT_FILE, from: loud, to: "} catch {\n    // nothing\n  }", run: [attempts], fail: ["[FAIL] no attempt insert is wrapped in a silent catch"] },
  { name: "A4: the free door stops checking the email", file: "src/lib/billing/free-access.ts", from: "if (verify) return { ok: false, ...verify };", to: "void verify;", run: [email], fail: ["FAIL an unverified free account is refused with 403"] },
  ...(HAS_BADGE ? [
    { name: "A5: a used free check still says it is free", file: "src/lib/billing/ai-badge.ts", from: "if (s.used >= TASTE_AI_LIMITS[s.kind]) return", to: "if (false) return", run: [badge], fail: ["FAIL WRITING: inside the 48 hours, once used"] },
    { name: "A5: paid users see a badge again", file: "src/lib/billing/ai-badge.ts", from: "if (s.paid) return null;", to: "", run: [badge], fail: ["FAIL WRITING: a paying user sees no badge"] },
  ] : []),
];
const out = [];
for (const c of CASES) {
  const raw = readFileSync(c.file, "utf8");
  if (!raw.includes(c.from)) throw new Error(`anchor missing: ${c.name}`);
  try {
    writeFileSync(c.file, raw.split(c.from).join(c.to));
    const res = c.run.map((r) => r());
    out.push({ name: c.name, red: res.every((r, i) => r.status !== 0 && (r.stdout + r.stderr).includes(c.fail[i])) });
  } finally { writeFileSync(c.file, raw); }
  if (readFileSync(c.file, "utf8") !== raw) throw new Error(`${c.file} NOT restored`);
}
const back = [attempts(), email(), ...(HAS_BADGE ? [badge()] : [])];
for (const o of out) console.log(`  [${o.red ? "RED as required" : "STAYED GREEN — BLIND"}] ${o.name}`);
console.log(`  restored: ${back.map((r) => (r.status === 0 ? "GREEN" : "NOT GREEN")).join(", ")} (attempts, email${HAS_BADGE ? ", badge" : ""})`);
const pass = out.every((o) => o.red) && back.every((r) => r.status === 0);
console.log(pass ? `\nRR-399 SABOTAGE PASS — ${out.length}/${out.length} RED` : "\nRR-399 SABOTAGE FAIL");
process.exitCode = pass ? 0 : 1;
