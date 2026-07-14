import type { Metadata } from "next";
import Link from "next/link";

// Honest requirements explainer: what Danish you need for citizenship —
// Prøve i Dansk 3 at B1–B2 — and how to PREPARE for it. Framed as honest
// preparation, never as beating or getting around SIRI. ISR.
export const revalidate = 2592000;

const SITE = "https://almidanish.almiworld.com";
const PATH = "/requirements/denmark/prove-i-dansk-3-citizenship";

export const metadata: Metadata = {
  title: { absolute: "Prøve i Dansk 3 for Citizenship: Honest Readiness Check" },
  description:
    "Stop risking residency or citizenship on inflated mock marks. Prøve i Dansk 3 passes on a combined average (speaking counts double) — test your real readiness with AlmiDanish.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Prøve i Dansk 3 for citizenship — an honest readiness check",
    description:
      "Honest guide to the Danish citizenship language requirement (Prøve i Dansk 3, B1–B2) and how it is passed. Confirm residency and other conditions with SIRI.",
  },
};

const FAQ = [
  {
    q: "What Danish level do I need for citizenship?",
    a: "The language requirement for Danish citizenship is Prøve i Dansk 3, a Danish-language test set at CEFR B1–B2 across Reading, Listening, Writing and Speaking. The exam is administered under the Ministry of Immigration and Integration. It passes on a combined average (with the oral exam weighted double), not a floor in every section. Passing it demonstrates the language proof — the rest of the application, handled by SIRI, is decided separately.",
  },
  {
    q: "Is passing Prøve i Dansk 3 enough for citizenship?",
    a: "No — it is the language requirement, not the whole application. Citizenship also depends on residency and other conditions, and those are decided by SIRI. We don't state a fixed number of years or a fixed step, because the conditions change. Always confirm the current requirement for your own situation with SIRI.",
  },
  {
    q: "Which skills does Prøve i Dansk 3 test?",
    a: "All four language skills at B1–B2: Reading (Læsning), Listening (Lytning), Writing (Skrivning) and Speaking (Tal). Preparing means getting comfortable with everyday Danish across each of them, rather than focusing on only one.",
  },
  {
    q: "How does AlmiDanish help?",
    a: "AlmiDanish is honest practice, not the official exam. You practise the four language skills (Reading, Listening, Writing, Speaking) at B1–B2 and get a per-skill readiness band (Clear or Borderline) against the real task criteria — an estimate to guide your prep, never an official SIRI or Ministry result.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

function Row({ skill, ice, note }: { skill: string; ice: string; note: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl border border-almi-bg-peach bg-almi-paper p-5 sm:grid-cols-[8rem_6rem_1fr]">
      <div className="text-sm font-semibold text-almi-ink">{skill}</div>
      <div className="text-sm font-bold text-almi-coral-deep">{ice}</div>
      <div className="text-sm text-almi-text sm:col-span-1 col-span-2">{note}</div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="bg-almi-bg text-almi-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-almi-text-muted">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-almi-coral">Home</Link></li>
            <li className="flex items-center gap-1"><span aria-hidden>/</span><Link href="/exams" className="hover:text-almi-coral">Danish exams</Link></li>
            <li className="flex items-center gap-1"><span aria-hidden>/</span><span>Prøve i Dansk 3: citizenship Danish</span></li>
          </ol>
        </nav>

        <header>
          <p className="text-sm font-bold uppercase tracking-widest text-almi-accent-deep">Requirements · Denmark</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-almi-ink sm:text-4xl">
            What Danish do you need for citizenship? Prøve i Dansk 3 at B1–B2.
          </h1>
          <p className="mt-3 text-base text-almi-text">
            The Danish-language requirement for citizenship is <strong>Prøve i Dansk 3</strong>, a test set at CEFR{" "}
            <strong>B1–B2</strong> across Reading, Listening, Writing and Speaking. It sits under the{" "}
            <strong>Ministry of Immigration and Integration</strong>; residency and citizenship itself are handled by{" "}
            <strong>SIRI</strong> (Styrelsen for International Rekruttering og Integration).
            Here&apos;s an honest read on what it covers, how it is passed, and how to prepare for it fairly.
          </p>
        </header>

        <section className="mt-8 space-y-3">
          <Row skill="Reading" ice="Læsning" note="Understand short, everyday Danish texts — signs, notices, simple messages and forms." />
          <Row skill="Listening" ice="Lytning" note="Follow clear, everyday spoken Danish on familiar topics at a natural but unhurried pace." />
          <Row skill="Writing" ice="Skrivning" note="Write short, practical texts — a note, a form, a simple message — with B1 accuracy." />
          <Row skill="Speaking" ice="Tale" note="Take part in everyday conversations about everyday matters and answer familiar questions." />
          <p className="text-xs text-almi-text-muted">
            All four skills are assessed at B1–B2. This is general information about the language requirement, not advice
            about your citizenship application.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
          <h2 className="text-xl font-semibold text-almi-ink">How Prøve i Dansk 3 is passed</h2>
          <p className="mt-3 text-base text-almi-text">
            Prøve i Dansk 3 passes on a <strong>combined average (≥2.0, with the oral exam weighted double)</strong> — not
            per-section floors. A strong overall result, with speaking carrying extra weight, matters more than clearing a
            fixed minimum in every single paper. Marking and pass rules can change, so always{" "}
            <strong>confirm current rules with SIRI.</strong>
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">The language requirement is only one part</h2>
          <p className="mt-3 text-base text-almi-text">
            Passing Prøve i Dansk 3 proves the <strong>language</strong> requirement for citizenship. It does not decide
            your application on its own — citizenship also depends on <strong>residency and other conditions</strong>, and
            those are set by <strong>SIRI</strong>. Those rules change over
            time, so we don&apos;t state a fixed number of years or a fixed step. The reliable move is to check your own
            situation directly with SIRI rather than assuming.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">How to prepare — honestly</h2>
          <p className="mt-3 text-base text-almi-text">
            Preparation has the same shape whichever your circumstances: get comfortable with the four language skills —
            Reading (Læsning), Listening (Lytning), Writing (Skrivning) and Speaking (Tal) — at B1–B2. AlmiDanish lets you
            practise all of them and shows an honest per-skill readiness band (Clear or Borderline) against the real task
            criteria — an estimate to guide your prep, never an official SIRI or Ministry of Immigration and Integration
            result. We help you prepare fairly; we don&apos;t claim to shortcut the process.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-almi-ink">Practise the four skills at B1–B2 — honestly.</p>
          <Link
            href="/signup"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-full bg-almi-coral px-7 py-3 text-base font-semibold text-almi-ink hover:bg-almi-coral-deep"
          >
            Start your 7-day free trial
          </Link>
          <p className="mt-3 text-xs text-almi-text-muted">$12/month after the trial · cancel anytime</p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-accent/40 bg-almi-accent/10 p-5">
          <p className="text-sm text-almi-ink">
            <strong>Always confirm your own requirement with SIRI.</strong> Residency and citizenship rules
            change, and only the official authorities can tell you which conditions apply to your situation. AlmiDanish
            helps you prepare for the language test — it doesn&apos;t decide or replace the official process.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">Questions</h2>
          <dl className="mt-4 space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-2xl border border-almi-bg-peach bg-almi-paper p-5">
                <dt className="font-semibold text-almi-ink">{f.q}</dt>
                <dd className="mt-1 text-sm text-almi-text">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-almi-ink">Related</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            <li><Link href="/exams/prove-i-dansk-3" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">Prøve i Dansk 3 (B1–B2) guide</Link></li>
            <li><Link href="/exams/prove-i-dansk-1" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">Prøve i Dansk 1 (A1–A2) guide</Link></li>
            <li><Link href="/exams" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">All Danish exams</Link></li>
          </ul>
        </section>
      </div>
    </main>
  );
}
