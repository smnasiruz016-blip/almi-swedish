// RR-399 A5 · the Writing/Speaking badge on the exam page tells the truth in every state (it used to say "Pro" for everyone).
// Pure: the label function plus a source read of the exam page; no DB, no AI.
// Run: npx tsx scripts/verify-ai-badge.ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
let failed = 0;
const t = async (name: string, fn: () => unknown | Promise<unknown>) => {
  try { await fn(); console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}\n       ${(e as Error).message.split("\n")[0]}`); }
};

(async () => {
  const { aiBadge } = await import(pathToFileURL(join(ROOT, "src/lib/billing/ai-badge.ts")).href);
  for (const kind of ["WRITING", "SPEAKING"] as const) {
    await t(`${kind}: inside the 48 hours, not used yet: "1 free AI check in your 48 hours"`, () => {
      assert.deepEqual(aiBadge({ paid: false, tasteActive: true, kind, used: 0 }), { label: "1 free AI check in your 48 hours", tone: "free" });
    });
    await t(`${kind}: inside the 48 hours, once used: "Used · Unlock for $12/month"`, () => {
      assert.deepEqual(aiBadge({ paid: false, tasteActive: true, kind, used: 1 }), { label: "Used · Unlock for $12/month", tone: "used" });
      assert.equal(aiBadge({ paid: false, tasteActive: true, kind, used: 3 })?.label, "Used · Unlock for $12/month");
    });
    await t(`${kind}: after the 48 hours: "Unlock for $12/month"`, () => {
      assert.deepEqual(aiBadge({ paid: false, tasteActive: false, kind, used: 0 }), { label: "Unlock for $12/month", tone: "locked" });
      assert.deepEqual(aiBadge({ paid: false, tasteActive: false, kind, used: 1 }), { label: "Unlock for $12/month", tone: "locked" });
    });
    await t(`${kind}: a paying user sees no badge`, () => {
      assert.equal(aiBadge({ paid: true, tasteActive: false, kind, used: 0 }), null);
      assert.equal(aiBadge({ paid: true, tasteActive: true, kind, used: 5 }), null);
    });
  }
  await t("the exam page uses the honest badge and no longer shows \"Pro\" on Writing/Speaking", () => {
    const page = ["src/app/(app)/practice/[exam]/page.tsx"].map((p) => join(ROOT, p)).find((p) => existsSync(p));
    assert.ok(page, "exam page not found");
    const src = readFileSync(page!, "utf8");
    assert.match(src, /\baiBadge\(/);
    assert.match(src, /isTasteActive\(/);
    const skillCards = src.slice(src.indexOf("Practise by skill"), src.indexOf("</section>", src.indexOf("Practise by skill")));
    assert.doesNotMatch(skillCards, />\s*Pro\s*</, "a skill card still says Pro");
  });
  console.log(failed ? `\nBADGE TEST FAIL (${failed})` : "\nBADGE TEST PASS");
  process.exitCode = failed ? 1 : 0;
})();
