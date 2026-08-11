import type { Metadata } from "next";
import Link from "next/link";
import { TRACKS, examsByTrack } from "@/lib/sv/registry";
import { TestimonialsSection } from "@/components/reviews/TestimonialsSection";

// Re-render hourly so newly approved testimonials appear without a redeploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: "AlmiSwedish | Practise Swedish Exams with Honest Readiness",
  },
  description:
    "Sweden's new 2026 citizenship rules add a civic test, with a language test to follow. Practise SFI, Tisus and the new Medborgarskapsprov with honest AI readiness bands. Not affiliated with UHR.",
  openGraph: {
    title: "AlmiSwedish — honest SFI, Tisus & Medborgarskapsprov practice",
    description:
      "Original practice for the SFI ladder, academic Tisus and Sweden's new Medborgarskapsprov civic test — a readiness estimate shown honestly, not an inflated score.",
  },
};

const PROMISES = [
  {
    title: "Every Swedish goal mapped",
    detail:
      "Citizenship (Medborgarskapsprovet — the civic test), university admission (Tisus), getting started (SFI Courses A–B) and building proficiency (SFI C–D → Swedish B1–B2) — the language exams across Reading, Listening, Writing and Speaking, plus the civic questions.",
  },
  {
    title: "Honest readiness, not a fake score",
    detail:
      "Objective Reading, Listening and civic questions are auto-marked to a clear readiness band. Writing and Speaking get AI feedback labelled an estimate. We never invent an official UHR, Skolverket or university result — and for the civic test, where UHR has published no pass mark, we don’t show one.",
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
  "Free, unlimited auto-marked Reading, Listening and Medborgarskapsprov civic-practice sets",
  "AI analysis modelled on the real task formats and criteria — always an estimate, never an official UHR result",
  "Full timed mock for your chosen exam, with per-skill readiness and progress tracking",
  "Flat $12/month with one-click cancellation inside your account",
] as const;

const FAQ = [
  {
    q: "Which Swedish exams does AlmiSwedish cover?",
    a: "The SFI ladder — SFI Courses A–B (≈A1–A2) and C–D (≈A2–B1+) — plus general Swedish B1–B2 and Tisus (≈C1, university admission, run by Stockholms universitet), all across Reading, Listening, Writing and Speaking. And Medborgarskapsprovet, Sweden's new citizenship test of knowledge about Swedish society. You pick your exam in your account, and your practice and full mock run for it.",
  },
  {
    q: "What do I need for Swedish citizenship?",
    a: "Since 6 June 2026 the main rule is eight years' habitual residence, plus a self-sufficiency requirement, plus Medborgarskapsprovet for applicants aged 16–66. There are no transitional arrangements. Only the society component of the test exists so far; UHR's first sitting on 15 August 2026 is a pilot. Always confirm the current requirement with Migrationsverket and UHR before you rely on it. We help you prepare fairly; we never claim to help anyone shortcut the process.",
  },
  {
    q: "Is there a Swedish language test for citizenship?",
    a: "Not yet. A language component is planned, but UHR indicates it will not be ready before autumn 2028 at the earliest, and no CEFR level has been set. We don't sell practice for it, because there is nothing published to practise against. The SFI/CEFR ladder here builds the Swedish you'll need either way — but it is not the citizenship language test.",
  },
  {
    q: "What score do I need to pass Medborgarskapsprovet?",
    a: "UHR has not published a pass mark, so nobody can honestly tell you — anyone quoting a number is guessing. We don't show one either. We show what you got right and where your gaps are.",
  },
  {
    q: "Is my AlmiSwedish estimate my real exam result?",
    a: "No. It's a practice readiness estimate to guide your prep — a per-skill band (Clear or Borderline) against the real criteria. Only the official assessments issue real results. AlmiSwedish is not affiliated with UHR, and UHR does not endorse unofficial practice tests, including ours.",
  },
  {
    q: "Is the practice copied from a real exam?",
    a: "No. Every text, audio transcript, writing task, speaking prompt and civic question is original, written from scratch to mirror the real task types. Our civic questions are written against the same 13 areas of Swedish society that UHR's own free study material, Sverige i fokus, covers — they are not UHR's question bank.",
  },
  {
    q: "How much does AlmiSwedish cost?",
    a: "$12 per month with a 7-day free trial, monthly only, cancel anytime. Reading, Listening and civic practice, AI feedback on Writing and Speaking and the full timed mock are part of the subscription.",
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
          <p className="text-xs font-bold uppercase tracking-wider text-almi-text-muted">Sample readiness · Swedish B1–B2</p>
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
  PROFICIENCY: "text-almi-teal",
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
            <p className="text-sm font-bold uppercase tracking-widest text-almi-accent-deep">AlmiSwedish · Swedish exam &amp; civic practice</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] text-almi-ink sm:text-5xl">
              Practise Swedish with <span className="text-almi-coral">honest readiness.</span>
            </h1>
            <p className="mt-5 text-lg text-almi-text">
              Original practice for three pathways — the <strong>SFI</strong> (Svenska för invandrare) steps,
              academic <strong>Tisus</strong> preparation, and Sweden&apos;s newly legislated{" "}
              <strong>Medborgarskapsprov</strong> citizenship test — with an honest readiness estimate against
              each exam&apos;s real criteria, so you know exactly where you stand.
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
            The official tests are set and marked by their own bodies — the new citizenship test
            (<strong>Medborgarskapsprovet</strong>) by the <strong>Swedish Council for Higher Education (UHR)</strong>;{" "}
            <strong>SFI</strong> within the municipal adult-education system (<strong>Skolverket</strong>); and{" "}
            <strong>Tisus</strong> by Stockholms universitet — so anyone promising a guaranteed official grade
            from an online simulation is guessing. AlmiSwedish does the honest thing instead: we estimate your
            readiness from your practice and map it into clear bands (Clear or Borderline) against each
            exam&apos;s real criteria.
          </p>
          <p className="mt-4 text-base text-almi-text">
            One principle runs through it: <strong className="text-almi-ink">tell you the truth.</strong> Honest,
            level-aware feedback, 100% original material, and an un-inflated read on what to work on next — then
            confirm the requirement you actually need with the relevant authority (Migrationsverket and UHR for
            citizenship). We are not affiliated with UHR, and UHR does not endorse unofficial practice tests —
            including ours.
          </p>
        </div>
      </section>

      {/* Citizenship lead */}
      <section className="border-t border-almi-bg-peach bg-almi-bg-peach/40 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-almi-coral/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-almi-coral-deep">
            New 2026 Swedish citizenship rules
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-almi-ink">Getting ready for SFI or the new Medborgarskapsprov? Start here.</h2>
          <p className="mt-4 text-base text-almi-text">
            Sweden&apos;s citizenship rules changed on <strong>6 June 2026</strong> — eight years&apos; habitual
            residence as the main rule, a self-sufficiency requirement, and a new{" "}
            <strong>Medborgarskapsprov</strong> for applicants aged <strong>16–66</strong>. It arrives in stages:
            the knowledge-of-society test starts with a <strong>pilot sitting on 15 August 2026</strong>, and a
            Swedish language test follows later — UHR indicates <strong>not before autumn 2028</strong>, with no
            level set yet.
          </p>
          <p className="mt-4 text-base text-almi-text">
            Because the details are still rolling out, UHR has published <strong>no pass mark</strong> — so we
            don&apos;t show one, and we don&apos;t invent a format or a level.{" "}
            <Link href="/requirements/sweden/medborgarskapsprov" className="font-semibold text-almi-coral-deep hover:underline">
              See exactly what is and isn&apos;t known
            </Link>
            , practise realistic civic questions, and get an honest read on your readiness. We help you prepare
            fairly — never to shortcut the process.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-almi-coral px-7 py-3 text-base font-semibold text-almi-ink hover:bg-almi-coral-deep"
            >
              Practise the Swedish tracks — free trial
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
            25% of AlmiSwedish proceeds fund the Shamool Foundation&apos;s social mission — free primary-school education and daily hot meals for underprivileged children in Lahore, Pakistan.
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
            Every Swedish exam at your level, honest readiness estimates, 100% original material — for
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
