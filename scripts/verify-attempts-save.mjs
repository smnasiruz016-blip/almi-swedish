// RR-399 A1 · a learner's attempts SAVE. The *Attempt row used to carry a required foreign key to an *Item table that this product
// never fills (items are served from the JSON bundles), so every attempt insert failed into a silent catch: no history, no progress.
// RED when: the schema still relates <X>Attempt.itemId to <X>Item; an attempt insert sits in a catch that swallows the failure
// without a loud log; a comment still says attempts cannot be saved; or any code reads the dropped relation (attempt.item).
// Pure node: reads files only, no database. Run: node scripts/verify-attempts-save.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const fails = [];
const ok = (cond, name) => { if (!cond) fails.push(name); console.log(`  [${cond ? "PASS" : "FAIL"}] ${name}`); };

const schema = readFileSync(join(ROOT, "prisma/schema.prisma"), "utf8");
const models = Object.fromEntries([...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map((m) => [m[1], m[2]]));
const attemptName = Object.keys(models).find((n) => /Attempt$/.test(n) && /^\s*itemId\s+String\b/m.test(models[n]));
ok(Boolean(attemptName), `the schema has an *Attempt model with itemId (${attemptName ?? "none"})`);
if (!attemptName) { console.log("\nATTEMPTS TEST FAIL"); process.exit(1); }
const X = attemptName.replace(/Attempt$/, "");
const itemName = `${X}Item`;
const attempt = models[attemptName];
const noComments = (t) => t.replace(/\/\/.*$/gm, "");

ok(!/@relation\(fields:\s*\[itemId\]/.test(noComments(attempt)) && !new RegExp(`\\b${itemName}\\b`).test(noComments(attempt)),
  `${attemptName} has no @relation to ${itemName} (itemId is a plain string, so an attempt saves while ${itemName} is empty)`);
ok(/^\s*itemId\s+String\s*$/m.test(noComments(attempt)), `${attemptName}.itemId is still a required plain string`);
ok(/@@index\(\[itemId\]\)/.test(attempt), `${attemptName}.itemId keeps its index`);
ok(!models[itemName] || !new RegExp(`\\b${attemptName}\\[\\]`).test(noComments(models[itemName])), `${itemName} has no back-relation to ${attemptName}`);

/* the migration lives in prisma/migrations, OR (when the build runs `prisma migrate deploy`, so a preview would apply it) in the
   owner's folder C:\Projects\_handoffs\rr399-tools\owner-migrations\<repo>\, which the owner runs and then adds */
const migDirs = [join(ROOT, "prisma/migrations"), join(ROOT, "..", "_handoffs", "rr399-tools", "owner-migrations", ROOT.split(/[\\/]/).pop())];
const migFiles = migDirs.filter((d) => existsSync(d)).flatMap((d) => readdirSync(d).map((n) => join(d, n, "migration.sql")).filter((f) => existsSync(f)));
const dropping = migFiles.filter((f) => new RegExp(`DROP CONSTRAINT (IF EXISTS )?"${attemptName}_itemId_fkey"`).test(readFileSync(f, "utf8")));
ok(dropping.length > 0, `a migration drops "${attemptName}_itemId_fkey" (${dropping.map((f) => relative(join(ROOT, ".."), f).split(sep).join("/")).join(", ") || "none"})`);

const SKIP = /node_modules|\.next|[\\/]generated[\\/]/;
const walk = (d) => !existsSync(d) ? [] : readdirSync(d).flatMap((n) => { const f = join(d, n); if (SKIP.test(f)) return []; return statSync(f).isDirectory() ? walk(f) : /\.(tsx?|mts)$/.test(n) ? [f] : []; });
const files = walk(join(ROOT, "src")).map((f) => [relative(ROOT, f).split(sep).join("/"), readFileSync(f, "utf8")]);
const delegate = X.charAt(0).toLowerCase() + X.slice(1) + "Attempt";

/* every attempt insert: if it sits in a try, its catch must log loudly (console.error) or rethrow, never swallow */
const creates = [];
const silent = [];
for (const [p, t] of files) {
  for (const m of t.matchAll(new RegExp(`prisma\\.${delegate}\\.(create|createMany|upsert)\\(`, "g"))) {
    creates.push(p);
    const after = t.slice(m.index);
    const c = /\}\s*catch\s*(\([^)]*\))?\s*\{/.exec(after);
    const nextCall = after.slice(1).search(/prisma\.\w+\.\w+\(/);
    if (!c || (nextCall >= 0 && nextCall + 1 < c.index)) continue; // not wrapped (a failure reaches the caller)
    let depth = 1, i = c.index + c[0].length;
    for (; i < after.length && depth > 0; i++) { if (after[i] === "{") depth++; else if (after[i] === "}") depth--; }
    const body = noComments(after.slice(c.index + c[0].length, i - 1));
    if (!/console\.error\(|\bthrow\b/.test(body)) silent.push(p);
  }
}
ok(creates.length > 0, `the attempt insert is found (${creates.length} call sites)`);
ok(silent.length === 0, `no attempt insert is wrapped in a silent catch (${silent.length} silent)`);
for (const p of silent) console.log(`      silent: ${p}`);

const SAY = /attempts are optional this pass|attempt[^\n]{0,80}(cannot|can't|never) (be )?sav|insert fails|write fails by design|fails into its own catch|its item FK never resolves|still fails into/i;
const said = files.flatMap(([p, t]) => t.split(/\r?\n/).map((l, i) => [p, i + 1, l]).filter(([, , l]) => SAY.test(l)));
ok(said.length === 0, `no comment still says attempts cannot be saved (${said.length} left)`);
for (const [p, n, l] of said) console.log(`      ${p}:${n}: ${l.trim().slice(0, 120)}`);

const readsRelation = files.filter(([, t]) => /include:\s*\{[^}]*\bitem\s*:|select:\s*\{[^}]*\bitem\s*:/.test(t) && new RegExp(`${delegate}\\.find`).test(t));
ok(readsRelation.length === 0, `nothing reads the dropped relation (attempt.item) (${readsRelation.length} files)`);

console.log(fails.length ? `\nATTEMPTS TEST FAIL (${fails.length})` : "\nATTEMPTS TEST PASS");
process.exitCode = fails.length ? 1 : 0;
