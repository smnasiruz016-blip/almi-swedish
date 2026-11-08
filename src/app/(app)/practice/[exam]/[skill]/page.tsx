// Runner page for one exam + skill. Server component: authenticates, applies the
// skill-split guard (productive skills require paid access), loads a deterministic
// practice set, and renders the objective runner or the productive composer.

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasPracticeAccess } from "@/lib/billing/free-access";
import { FreeTimeBanner } from "@/components/FreeTimeBanner";
import { examBySlug, SKILL_LABELS } from "@/lib/sv/registry";
import { isFreeSkill } from "@/lib/sv/types";
import type { SwedishSkill } from "@/lib/sv/types";
import { pickPractice, stableItemId } from "@/lib/sv/items";
import { PracticeRunner } from "@/components/sv/PracticeRunner";
import { ProductiveComposer } from "@/components/sv/ProductiveComposer";

export default async function SkillRunnerPage({
  params,
}: {
  params: Promise<{ exam: string; skill: string }>;
}) {
  const user = await requireUser();
  const { exam: examSlug, skill: skillParam } = await params;

  const exam = examBySlug(examSlug);
  if (!exam) notFound();

  const skill = exam.skills.find(
    (s) => s.toLowerCase() === skillParam.toLowerCase(),
  ) as SwedishSkill | undefined;
  if (!skill) notFound();

  // SKILL-SPLIT GUARD: objective skills (Reading/Listening/Knowledge) stay free for everyone, as before;
  // productive skills (Writing/Speaking) need paid access OR the free 48 hours (RR-397, no card; AI is limited in /api/sv/grade).
  // When shut, the page says so honestly ("Your free 48 hours are over" + "Unlock for $12/month") instead of redirecting.
  if (!isFreeSkill(skill) && !hasPracticeAccess(user)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-semibold text-almi-ink">{SKILL_LABELS[skill].en}</h1>
        <FreeTimeBanner user={user} />
      </div>
    );
  }

  const label = SKILL_LABELS[skill];
  const objective = isFreeSkill(skill);
  const items = pickPractice(exam.exam, skill, objective ? 8 : 4);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-almi-accent-deep">
          <Link href="/practice" className="hover:underline">
            Choose a test
          </Link>{" "}
          ·{" "}
          <Link href={`/practice/${exam.slug}`} className="hover:underline">
            {exam.name}
          </Link>
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-almi-ink">{label.en}</h1>
        <p className="mt-1 text-sm text-almi-text-muted">{label.sv}</p>
      </header>

      {!objective && <FreeTimeBanner user={user} ai={skill === "SPEAKING" ? "SPEAKING" : "WRITING"} />}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-almi-accent/40 bg-almi-accent/10 px-4 py-6 text-sm text-almi-ink">
          No practice items are available for this skill yet. Content is being added — check back
          soon.
        </div>
      ) : objective ? (
        <PracticeRunner
          examName={exam.name}
          skill={skill}
          resultBasis={exam.resultBasis}
          items={items.map((it) => ({
            // The answer key is NOT mapped here — see RunnerItem in components/sv/shared.ts.
            // Everything this object holds is rendered to the learner; anything added to it
            // ships in the page payload.
            id: stableItemId(it),
            title: it.title,
            prompt: it.prompt,
            exam: it.exam,
            skill: it.skill,
            taskType: it.taskType,
            cefr: it.cefr,
            payload: it.payload,
            maxPoints: it.maxPoints,
          }))}
        />
      ) : (
        <ProductiveComposer
          examName={exam.name}
          skill={skill}
          items={items.map((it) => ({
            id: stableItemId(it),
            title: it.title,
            prompt: it.prompt,
            exam: it.exam,
            skill: it.skill,
            taskType: it.taskType,
            cefr: it.cefr,
            payload: it.payload,
          }))}
        />
      )}

      <p className="text-xs text-almi-text-muted">
        Original to AlmiSwedish. Every readout is a per-skill readiness band for practice, not an
        official UHR result.
      </p>
    </div>
  );
}
