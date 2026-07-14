// Runner page for one exam + skill. Server component: authenticates, applies the
// skill-split guard (productive skills require paid access), loads a deterministic
// practice set, and renders the objective runner or the productive composer.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/billing/plans";
import { examBySlug, SKILL_LABELS } from "@/lib/no/registry";
import { isFreeSkill } from "@/lib/no/types";
import type { NorwegianSkill } from "@/lib/no/types";
import { pickPractice } from "@/lib/no/items";
import { PracticeRunner } from "@/components/no/PracticeRunner";
import { ProductiveComposer } from "@/components/no/ProductiveComposer";

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
  ) as NorwegianSkill | undefined;
  if (!skill) notFound();

  // SKILL-SPLIT GUARD: objective skills (Reading/Listening) are free to taste;
  // productive skills (Writing/Speaking) require paid access.
  if (!isFreeSkill(skill) && !hasPaidAccess(user)) {
    redirect("/account");
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
        <p className="mt-1 text-sm text-almi-text-muted">{label.da}</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-almi-accent/40 bg-almi-accent/10 px-4 py-6 text-sm text-almi-ink">
          No practice items are available for this skill yet. Content is being added — check back
          soon.
        </div>
      ) : objective ? (
        <PracticeRunner
          examName={exam.name}
          skill={skill}
          items={items.map((it) => ({
            title: it.title,
            prompt: it.prompt,
            exam: it.exam,
            skill: it.skill,
            taskType: it.taskType,
            payload: it.payload,
            answer: it.answer,
            maxPoints: it.maxPoints,
          }))}
        />
      ) : (
        <ProductiveComposer
          examName={exam.name}
          skill={skill}
          items={items.map((it) => ({
            title: it.title,
            prompt: it.prompt,
            exam: it.exam,
            skill: it.skill,
            taskType: it.taskType,
            payload: it.payload,
          }))}
        />
      )}

      <p className="text-xs text-almi-text-muted">
        Original to AlmiNorwegian. Every readout is a practice estimate, not an official Directorate
        of Education or HK-dir (the Directorate for Higher Education and Skills) result.
      </p>
    </div>
  );
}
