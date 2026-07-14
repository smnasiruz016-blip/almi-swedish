// Full timed mock for one exam. Server component: authenticated + always gated
// behind paid access. Loads a set per skill and hands the sections to MockRunner,
// which sequences them and shows an honest aggregate estimate at the end.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/billing/plans";
import { examBySlug } from "@/lib/no/registry";
import { isFreeSkill } from "@/lib/no/types";
import { pickPractice } from "@/lib/no/items";
import { MockRunner, type MockSection } from "@/components/no/MockRunner";

export default async function MockPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const user = await requireUser();
  const { exam: examSlug } = await params;

  const exam = examBySlug(examSlug);
  if (!exam) notFound();

  // The full timed mock is always Pro — no free taste.
  if (!hasPaidAccess(user)) {
    redirect("/account");
  }

  const sections: MockSection[] = exam.skills.map((skill) => {
    const objective = isFreeSkill(skill);
    const items = pickPractice(exam.exam, skill, objective ? 6 : 2);
    return {
      skill,
      objective,
      items: items.map((it) => ({
        title: it.title,
        prompt: it.prompt,
        exam: it.exam,
        skill: it.skill,
        taskType: it.taskType,
        payload: it.payload,
        answer: it.answer,
        maxPoints: it.maxPoints,
      })),
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-almi-accent-deep">
          <Link href={`/practice/${exam.slug}`} className="hover:underline">
            {exam.name}
          </Link>{" "}
          · full mock
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-almi-ink">
          {exam.name} — full timed mock
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-almi-text">
          All parts in exam order (~{exam.mockMinutes} min). Nothing is marked until the end, then
          you get an overall estimate — not an official UDI or Ministry result.
        </p>
      </header>

      <MockRunner
        examName={exam.name}
        exam={exam.exam}
        mockMinutes={exam.mockMinutes}
        sections={sections}
      />
    </div>
  );
}
