import type { Metadata } from "next";
import Link from "next/link";
import { TRACKS, examsByTrack } from "@/lib/dk/registry";
import { TestimonialsSection } from "@/components/reviews/TestimonialsSection";

// Re-render hourly so newly approved testimonials appear without a redeploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: "AlmiDanish | Practise Danish Exams with Honest Readiness",
  },
  description:
    "Stop guessing your Danish level for SIRI or ministry requirements. Practise real Prøve i Dansk 1, 2, 3, Studieprøven and the citizenship tests with honest AI readiness bands.",
  openGraph: {
    title: "AlmiDanish — honest Danish exam practice",
    description:
      "Original practice for the Prøve i Dansk ladder, Studieprøven and the Danish society knowledge tests — a readiness estimate shown honestly, not an inflated score.",
  },
};

const PROMISES = [
  {
    title: "Every Danish goal",
    detail:
      "Citizenship (Prøve i Dansk 3 + Indfødsretsprøven), permanent residence (Prøve i Dansk 2 + Medborgerskabsprøven), getting started (Prøve i Dansk 1) and university (Studieprøven) — the language exams across Reading, Listening, Writing and Speaking, plus the society knowledge tests.",
  },
  {
    title: "Honest readiness, not a fake score",
    detail:
      "Objective Reading and Listening are auto-marked to a clear readiness band. Writing and Speaking get AI feedback labelled an estimate. We never invent an official SIRI or Ministry result.",
  },
  {
    title: "100% original material",
    detail:
      "Every reading text, audio transcript, writing task and speaking prompt is written from scratch to mirror the real task types — never copied from a real exam.",
  },
  {
    title: "Feedback you can act on",
    detail:
      "AI feedback on productive tasks points to what to fix next — against each exam's real criteria, level-aware, constructive and never inflated.",
  },
] as const;

const PRICING_LINES = [
  "Full access to Writing & Speaking AI-evaluation modules across every track",
  "Free, unlimited auto-marked Reading, Listening and knowledge-test practice",
  "AI analysis modelled on the real task formats and criteria — always an estimate, never an official SIRI result",
  "Full timed mock for your chosen exam, with per-skill readiness and progress tracking",
  "Flat $12/month with one-click cancellation inside your account",
] as const;

const FAQ = [
  {
    q: "Which Danish exams does AlmiDanish cover?",
    a: "The Prøve i Dansk ladder — Prøve i Dansk 1 (A1–A2), 2 (A2–B1, permanent residence) and 3 (B1–B2, citizenship) — plus Studieprøven (≈C1, university admission), all across Reading, Listening, Writing and Speaking. And the two Danish society knowledge tests: the Indfødsretsprøven (citizenship) and the Medborgerskabsprøven (permanent residence). The exams sit under the Ministry of Immigration and Integration. You pick your exam in your account, and your practice and full mock run for it.",
  },
  {
    q: "What do I need for Danish citizenship?",
    a: "Danish citizenship commonly requires Prøve i Dansk 3 (B1–B2) and the Indfødsretsprøven, alongside residency and other conditions. The rules change over time — so we don't state a fixed number of years or a fixed step. Always confirm the current requirement with SIRI (Styrelsen for International Rekruttering og Integration) before you rely on it. We help you prepare fairly; we never claim to help anyone shortcut the process.",
  },
  {
    q: "Is my AlmiDanish estimate my real exam result?",
    a: "No. It's a practice readiness estimate to guide your prep — a per-skill band (Clear or Borderline) against the real criteria. Only the official assessments issue real results.",
  },
  {
    q: "How does the citizenship track work?",
    a: "You practise the four skills — Reading, Listening, Writing and Speaking — at the Prøve i Dansk 3 level (B1–B2), and you can practise the Indfødsretsprøven society questions too. Reading, Listening and the knowledge MCQs are auto-marked; Writing and Speaking get honest AI feedback. It's preparation, not the official test, and it points you to what to work on next.",
  },
  {
    q: "Is the practice copied from a real exam?",
    a: "No. Every text, audio transcript, writing task, speaking prompt and knowledge question is original, written from scratch to mirror the real task types. We never copy or reproduce the official question banks or Ministry material.",
  },
  {
    q: "How much does AlmiDanish cost?",
    a: "$12 per month with a 7-day free trial, monthly only, cancel anytime. Reading, Listening and knowledge-test practice are free; AI feedback on Writing and Speaking and the full timed mock are part of the subscription.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

// Illustrative sample — clearly labelled, never a real user, never a real result.
const SAMPLE = [
  { skill: "Reading", band: "Clear", pct: 82 },
  { skill: "Listening", band: "Borderline", pct: 64 },
  { skill: "Writing", band: "Estimate", pct: 71 },
  { skill: "Speaking", band: "Estimate", pct: 58 },
];

function ReadinessMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="rounded-3xl border border-almi-bg-peach bg-almi-paper p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-almi-text-muted">Sample readiness · Prøve i Dansk 3 (B1–B2)</p>
          <span className="rounded-full bg-almi-bg-peach px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-almi-ink">Sample</span>
        </div>
        <ul className="mt-4 space-y-3">
          {SAMPLE.map((s) => (
            <li key={s.skill}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-almi-ink">{s.skill}</span>
                <span className="font-semibold text-almi-coral-deep">{s.band}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-almi-bg-peach">
                <div className="h-2 rounded-full bg-almi-coral" style={{ width: `${s.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl border border-almi-bg-peach bg-almi-bg px-4 py-3">
          <p className="text-xs text-almi-text-muted">
            A readiness band per skill against the real criteria — never an invented official result.
          </p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-almi-text-muted">Illustrative example — not a real result.</p>
    </div>
  );
}

const TRACK_ACCENT: Record<string, string> = {
  CITIZENSHIP: "text-almi-coral",
  PERMANENT_RESIDENCE: "text-almi-teal",
  GETTING_STARTED: "text-almi-accent-deep",
  UNIVERSITY: "text-almi-accent-deep",
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-almi-bg text-almi-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-almi-bg via-almi-bg to-almi-bg-peach px-6 pt-16 pb-20 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 z-0 h-96 w-96 rounded-full bg-almi-accent/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 z-0 h-80 w-80 rounded-full bg-almi-coral/10 blur-3xl" />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-almi-accent-deep">AlmiDanish · Danish exam practice</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] text-almi-ink sm:text-5xl">
              Practise Danish with <span className="text-almi-coral">honest readiness.</span>
            </h1>
            <p className="mt-5 text-lg text-almi-text">
              Original practice for the Prøve i Dansk ladder (PD1–PD3), Studieprøven and the Danish
              society knowledge tests — with an honest readiness estimate against each exam's real
              criteria, so you know exactly what to work on next.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-almi-coral px-7 py-3 text-base font-semibold text-almi-ink hover:bg-almi-coral-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-almi-coral/30"
              >
                Start your 7-day free trial
              </Link>
              <Link href="/login" className="text-sm font-medium text-almi-coral hover:underline">
                Already have an account? Log in →
              </Link>
            </div>
            <p className="mt-4 text-sm text-almi-text-muted">
              $12/month, 7-day free trial, cancel anytime · Reading &amp; Listening free · Original material, never copied
            </p>
          </div>
          <ReadinessMockup />
        </div>
      </section>

      {/* Honest hook */}
      <section className="border-t border-almi-bg-peach bg-almi-paper px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-semibold text-almi-ink">An honest estimate, not a fake score</h2>
          <p className="mt-5 text-base text-almi-text">
            The real exams are set and marked by their official bodies — the Prøve i Dansk exams and
            the knowledge tests sit under the Ministry of Immigration and Integration — so anyone
            promising you a precise official result from practice is guessing. AlmiDanish does the
            honest thing instead: we estimate your readiness from your practice and show it plainly —
            a per-skill band (Clear or Borderline) against each exam's real criteria.
          </p>
          <p className="mt-4 text-base text-almi-text">
            One principle runs through it: <strong className="text-almi-ink">tell you the truth.</strong> Honest,
            level-aware feedback, 100% original material, and a clear read on what to work on next — then
            confirm the requirement you need with the relevant authority (SIRI for residency and citizenship).
          </p>
        </div>
      </section>

      {/* Citizenship lead */}
      <section className="border-t border-almi-bg-peach bg-almi-bg-peach/40 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-almi-coral/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-almi-coral-deep">
            Citizenship route
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-almi-ink">Prøve i Dansk 3 + Indfødsretsprøven — the citizenship path. Start here.</h2>
          <p className="mt-4 text-base text-almi-text">
            Danish citizenship commonly requires Prøve i Dansk 3 — the B1–B2 Danish-language exam — and
            the Indfødsretsprøven, a Danish society knowledge test. Practise the four language skills and
            the society questions, and get an honest read on whether you're ready. There are also
            residency and other conditions, and rules change, so always confirm the current requirement
            with SIRI. We help you prepare fairly — never to shortcut the process.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-almi-coral px-7 py-3 text-base font-semibold text-almi-ink hover:bg-almi-coral-deep"
            >
              Practise Prøve i Dansk 3 — free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Four goals */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold text-almi-ink">Start from your goal</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-almi-text-muted">
            Reading, Listening and the society knowledge questions are auto-marked and free to practise.
            Writing and Speaking are graded with honest AI feedback against each exam's real criteria.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRACKS.map((t) => (
              <div
                key={t.track}
                className={`rounded-2xl border bg-almi-paper p-6 ${t.lead ? "border-almi-coral/40 ring-1 ring-almi-coral/20" : "border-almi-bg-peach"}`}
              >
                <p className={`text-xs font-bold uppercase tracking-widest ${TRACK_ACCENT[t.track] ?? "text-almi-accent-deep"}`}>
                  {t.label}{t.lead ? " · Lead" : ""}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-almi-ink">{t.requires}</h3>
                <ul className="mt-4 space-y-2 text-sm text-almi-text">
                  {examsByTrack(t.track).map((e) => (
                    <li key={e.slug} className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-md bg-almi-bg-peach px-1.5 text-[11px] font-bold text-almi-ink">{e.cefr}</span>
                      <span className="font-semibold text-almi-ink">{e.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why honest */}
      <section className="border-t border-almi-bg-peach px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-semibold text-almi-ink">Honest readiness, exam by exam</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {PROMISES.map((p) => (
              <li key={p.title} className="flex items-start gap-3 rounded-2xl border border-almi-bg-peach bg-almi-paper p-5">
                <span aria-hidden className="mt-0.5 flex-shrink-0 select-none font-bold text-almi-teal">✓</span>
                <p className="text-sm text-almi-text">
                  <span className="font-semibold text-almi-ink">{p.title}</span>
                  {" — "}
                  {p.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-almi-bg-peach bg-almi-paper px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold text-almi-ink">Simple, honest pricing</h2>
          <p className="mt-3 text-xl font-semibold text-almi-ink">$12/month — 7-day free trial, cancel anytime.</p>
          <ul className="mx-auto mt-6 max-w-xl space-y-2 text-left text-sm text-almi-text">
            {PRICING_LINES.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 flex-shrink-0 select-none font-bold text-almi-teal">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-6 max-w-xl text-sm text-almi-text-muted">
            25% of AlmiDanish proceeds fund the Shamool Foundation&apos;s social mission — free primary-school education and daily hot meals for underprivileged children in Lahore, Pakistan.
          </p>
          <div className="mt-8">
            <Link href="/signup" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-almi-coral px-7 py-3 text-base font-semibold text-almi-ink hover:bg-almi-coral-deep">
              Start your 7-day free trial
            </Link>
          </div>
          <p className="mt-4 text-sm text-almi-text-muted">
            <Link href="/pricing" className="underline hover:text-almi-ink">See full pricing</Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-semibold text-almi-ink">Common questions</h2>
          <dl className="mt-10 space-y-6">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-2xl border border-almi-bg-peach bg-almi-bg p-6">
                <dt className="text-lg font-semibold text-almi-ink">{f.q}</dt>
                <dd className="mt-2 text-sm text-almi-text">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <TestimonialsSection />

      {/* Final CTA */}
      <section className="border-t border-almi-bg-peach bg-almi-paper px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-almi-ink">Practise honestly. Walk in ready.</h2>
          <p className="mt-3 text-base text-almi-text">
            Every Danish exam at your level, honest readiness estimates, 100% original material — for
            $12/month with a 7-day free trial.
          </p>
          <div className="mt-8">
            <Link href="/signup" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-almi-coral px-7 py-3 text-base font-semibold text-almi-ink hover:bg-almi-coral-deep">
              Start your 7-day free trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
