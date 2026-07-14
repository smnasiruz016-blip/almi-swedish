// Exam page — lists the skills for one exam (each → a runner) plus a full timed
// mock link. Reading/Listening are free; productive skills carry a Pro badge.

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { examBySlug, SKILL_LABELS } from "@/lib/no/registry";
import { isFreeSkill } from "@/lib/no/types";
import type { NorwegianSkill, NorwegianTrack } from "@/lib/no/types";

const TRACK_LABEL: Record<NorwegianTrack, string> = {
  CITIZENSHIP: "Citizenship — Norskprøven B1–B2 + Statsborgerprøven",
  PERMANENT_RESIDENCE: "Permanent residence — Norskprøven A2–B1 + Samfunnskunnskapsprøven",
  GETTING_STARTED: "Getting started — Norskprøven A1–A2",
  UNIVERSITY: "University admission — Bergenstesten",
};

export default async function ExamPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  await requireUser();
  const { exam: examSlug } = await params;
  const exam = examBySlug(examSlug);
  if (!exam) notFound();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-almi-accent-deep">
          <Link href="/practice" className="hover:underline">
            Choose a test
          </Link>{" "}
          · {TRACK_LABEL[exam.track]}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-semibold text-almi-ink">{exam.name}</h1>
          <span className="rounded-full bg-almi-teal/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-almi-teal">
            {exam.cefr}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-almi-text">{exam.blurb}</p>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-almi-ink">Practise by skill</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {exam.skills.map((skill: NorwegianSkill) => {
            const free = isFreeSkill(skill);
            const label = SKILL_LABELS[skill];
            return (
              <Link
                key={skill}
                href={`/practice/${exam.slug}/${skill.toLowerCase()}`}
                className="flex flex-col rounded-2xl border border-almi-bg-peach bg-almi-paper p-5 shadow-sm transition hover:border-almi-coral"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold text-almi-ink">{label.en}</h3>
                  {free ? (
                    <span className="rounded-full bg-almi-teal/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-almi-teal">
                      Free
                    </span>
                  ) : (
                    <span className="rounded-full bg-almi-coral px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-almi-ink">
                      Pro
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-almi-text-muted">{label.da}</p>
                <p className="mt-3 text-sm font-semibold text-almi-coral">Practise →</p>
              </Link>
            );
          })}
        </div>
      </section>

      <Link
        href={`/practice/${exam.slug}/mock`}
        className="block rounded-2xl border border-almi-coral/40 bg-almi-coral/10 p-6 shadow-sm transition hover:border-almi-coral"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-xl">🏁</span>
              <h2 className="text-lg font-semibold text-almi-ink">Full timed mock</h2>
              <span className="rounded-full bg-almi-coral px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-almi-ink">
                Pro
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm text-almi-text">
              All parts in exam order (~{exam.mockMinutes} min), then an honest overall estimate —
              never an official UDI or Ministry result.
            </p>
          </div>
          <span className="text-sm font-semibold text-almi-coral">Start full mock →</span>
        </div>
      </Link>

      <p className="text-xs text-almi-text-muted">
        Original to AlmiNorwegian — never copied from official test material. Every readout is a
        practice estimate.
      </p>
    </div>
  );
}
