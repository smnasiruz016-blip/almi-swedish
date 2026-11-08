// RR-399 A4 · a NOT-paid account verifies its email before its free AI scoring (the light check DET, Goethe and French use).
// An unverified free account is refused with 403 BEFORE any count, claim or AI call; a verified one passes the check; paid users and
// practice without AI are unchanged. Pure: the cases stop before any database read; no DB, no AI.
// Run: npx tsx scripts/verify-free-ai-email.ts
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const DIR = existsSync(join(ROOT, "src/lib/billing/free-access.ts")) ? "src/lib/billing" : "src/lib";
let failed = 0;
const t = async (name: string, fn: () => unknown | Promise<unknown>) => {
  try { await fn(); console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}\n       ${(e as Error).message.split("\n")[0]}`); }
};
const HOUR = 3_600_000, DAY = 24 * HOUR;

(async () => {
  const fa = await import(pathToFileURL(join(ROOT, `${DIR}/free-access.ts`)).href);
  const now = Date.now();
  const free = { id: "u-free", email: "learner@example.com", createdAt: new Date(now - HOUR), subscriptionStatus: null, stripeSubscriptionId: null, compProUntil: null, subscriptionCurrentPeriodEnd: null };
  const unverified = { ...free, emailVerified: null };
  const verified = { ...free, emailVerified: new Date(now - HOUR) };
  const neverCount = () => { throw new Error("the used count was read: the email check did not come first"); };

  await t("an unverified free account is refused with 403 before any count, claim or AI call", async () => {
    const r = await fa.aiGate(unverified, "WRITING", neverCount, now);
    assert.equal(r.ok, false);
    assert.equal(r.status, 403);
    assert.equal(r.body.error, "Please verify your email before your free AI scoring.");
    assert.equal((await fa.aiGate(unverified, "SPEAKING", neverCount, now)).status, 403);
  });
  await t("a verified free account passes the email check (it reaches the 1-per-kind count)", async () => {
    assert.equal(fa.freeAiEmailRefusal(verified), null);
    let counted = false;
    const r = await fa.aiGate(verified, "WRITING", async () => { counted = true; return 1; }, now);
    assert.equal(counted, true, "the count was never asked");
    assert.equal(r.ok, false);
    assert.equal(r.status, 402);
    assert.equal(r.body.reason, "USED");
  });
  await t("a paid account is unchanged: no email check here, no count (a comped account with no verified email gets AI)", async () => {
    const comped = { ...unverified, id: "u-comp", compProUntil: new Date(now + 30 * DAY) };
    const r = await fa.aiGate(comped, "WRITING", neverCount, now);
    assert.equal(r.ok, true);
    assert.equal(r.free, false);
  });
  await t("practice without AI never needs the email check (an unverified account in its free 48 hours practises)", () => {
    assert.equal(fa.hasPracticeAccess(unverified), true);
  });
  await t("every AI route asks the free door (with its email check) before it calls the AI", () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const f = join(d, n); return statSync(f).isDirectory() ? walk(f) : /route\.ts$/.test(n) ? [f] : []; });
    const routes = walk(join(ROOT, "src/app/api")).map((f) => [f, readFileSync(f, "utf8")] as const).filter(([, s]) => /\baiGate\(/.test(s));
    assert.ok(routes.length > 0, "no AI route uses aiGate");
    for (const [f, s] of routes) {
      const gate = s.search(/\baiGate\(/), ai = s.search(/messages\.create\(|completions\.create\(|transcriptions\.create\(/);
      assert.ok(ai === -1 || gate < ai, `${f}: the AI is called before aiGate()`);
    }
  });
  console.log(failed ? `\nEMAIL TEST FAIL (${failed})` : "\nEMAIL TEST PASS");
  process.exitCode = failed ? 1 : 0;
})();
