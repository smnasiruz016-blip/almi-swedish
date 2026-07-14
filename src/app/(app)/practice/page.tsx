// Practice hub — "Choose a Test". Four goal-based tracks: Citizenship (Prøve i
// Dansk 3 + Statsborgerprøven), Permanent residence (Norskprøven A2–B1 +
// Samfunnskunnskapsprøven), Getting started (Norskprøven A1–A2) and University
// (Bergenstesten). Each card routes to /practice/<slug>. Reading + Listening +
// the knowledge MCQs are free to taste; Writing, Speaking and the timed mock are
// Pro. Every readout is a practice estimate — never an official UDI or Ministry
// result.

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  TRACKS,
  examsByTrack,
  type ExamMeta,
} from "@/lib/no/registry";

function ExamCard({ exam }: { exam: ExamMeta }) {
  return (
    <Link
      href={`/practice/${exam.slug}`}
      className="flex flex-col rounded-2xl border border-almi-bg-peach bg-almi-paper p-5 shadow-sm transition hover:border-almi-coral"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-almi-ink">{exam.name}</h3>
        <span className="rounded-full bg-almi-teal/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-almi-teal">
          {exam.cefr}
        </span>
      </div>
      {exam.lead && (
        <span className="mt-2 inline-flex w-fit rounded-full bg-almi-coral/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-almi-coral-deep">
          Citizenship
        </span>
      )}
      <p className="mt-2 text-sm text-almi-text">{exam.blurb}</p>
      <p className="mt-3 text-sm font-semibold text-almi-coral">Practise →</p>
    </Link>
  );
}

export default async function PracticePage() {
  await requireUser();

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-almi-accent-deep">
          AlmiNorwegian · practice
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-almi-ink">Choose a test</h1>
        <p className="mt-2 max-w-2xl text-sm text-almi-text">
          Start from your goal. Reading, Listening and the society knowledge questions are auto-marked
          and free to practise. Writing and Speaking are graded with honest AI-style feedback against
          the level&apos;s criteria. Every readout is a practice estimate — never an official UDI or
          Ministry result.
        </p>
      </header>

      {TRACKS.map((t) => (
        <section key={t.track}>
          <h2 className="text-lg font-semibold text-almi-ink">{t.label}</h2>
          <p className="mt-1 text-sm text-almi-text-muted">
            {t.goal} — commonly requires {t.requires}. Confirm the current rules with UDI.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {examsByTrack(t.track).map((exam) => (
              <ExamCard key={exam.slug} exam={exam} />
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-almi-text-muted">
        Every task here is written from scratch by AlmiNorwegian. We never copy or reproduce official
        test material. Estimates are for practice only — confirm the exam you need with the official
        body (UDI for residency and citizenship).
      </p>
    </div>
  );
}
