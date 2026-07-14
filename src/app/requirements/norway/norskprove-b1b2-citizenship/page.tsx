import type { Metadata } from "next";
import Link from "next/link";

// Honest requirements explainer: what Norwegian you need for citizenship —
// Norskprøven B1–B2 at B1–B2 — and how to PREPARE for it. Framed as honest
// preparation, never as beating or getting around UDI. ISR.
export const revalidate = 2592000;

const SITE = "https://alminorwegian.almiworld.com";
const PATH = "/requirements/norway/norskprove-b1b2-citizenship";

export const metadata: Metadata = {
  title: { absolute: "Norskprøven B1–B2 for Citizenship: Honest Readiness Check" },
  description:
    "Stop risking residency or citizenship on inflated mock marks. Norskprøven B1–B2 passes on a combined average (speaking counts double) — test your real readiness with AlmiNorwegian.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Norskprøven B1–B2 for citizenship — an honest readiness check",
    description:
      "Honest guide to the Norwegian citizenship language requirement (Norskprøven B1–B2, B1–B2) and how it is passed. Confirm residency and other conditions with UDI.",
  },
};

const FAQ = [
  {
    q: "What Norwegian level do I need for citizenship?",
    a: "The language requirement for Norwegian citizenship is Norskprøven B1–B2, a Norwegian-language test set at CEFR B1–B2 across Reading, Listening, Writing and Speaking. The exam is administered under the HK-dir (the Directorate for Higher Education and Skills). It passes on a combined average (with the oral exam weighted double), not a floor in every section. Passing it demonstrates the language proof — the rest of the application, handled by UDI, is decided separately.",
  },
  {
    q: "Is passing Norskprøven B1–B2 enough for citizenship?",
    a: "No — it is the language requirement, not the whole application. Citizenship also depends on residency and other conditions, and those are decided by UDI. We don't state a fixed number of years or a fixed step, because the conditions change. Always confirm the current requirement for your own situation with UDI.",
  },
  {
    q: "Which skills does Norskprøven B1–B2 test?",
    a: "All four language skills at B1–B2: Reading (Læsning), Listening (Lytning), Writing (Skrivning) and Speaking (Tal). Preparing means getting comfortable with everyday Norwegian across each of them, rather than focusing on only one.",
  },
  {
    q: "How does AlmiNorwegian help?",
    a: "AlmiNorwegian is honest practice, not the official exam. You practise the four language skills (Reading, Listening, Writing, Speaking) at B1–B2 and get a per-skill readiness band (Clear or Borderline) against the real task criteria — an estimate to guide your prep, never an official UDI or Ministry result.",
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
            <li className="flex items-center gap-1"><span aria-hidden>/</span><Link href="/exams" className="hover:text-almi-coral">Norwegian exams</Link></li>
            <li className="flex items-center gap-1"><span aria-hidden>/</span><span>Norskprøven B1–B2: citizenship Norwegian</span></li>
          </ol>
        </nav>

        <header>
          <p className="text-sm font-bold uppercase tracking-widest text-almi-accent-deep">Requirements · Norway</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-almi-ink sm:text-4xl">
            What Norwegian do you need for citizenship? Norskprøven B1–B2 at B1–B2.
          </h1>
          <p className="mt-3 text-base text-almi-text">
            The Norwegian-language requirement for citizenship is <strong>Norskprøven B1–B2</strong>, a test set at CEFR{" "}
            <strong>B1–B2</strong> across Reading, Listening, Writing and Speaking. It sits under the{" "}
            <strong>HK-dir (the Directorate for Higher Education and Skills)</strong>; residency and citizenship itself are handled by{" "}
            <strong>UDI</strong> (Styrelsen for International Rekruttering og Integration).
            Here&apos;s an honest read on what it covers, how it is passed, and how to prepare for it fairly.
          </p>
        </header>

        <section className="mt-8 space-y-3">
          <Row skill="Reading" ice="Læsning" note="Understand short, everyday Norwegian texts — signs, notices, simple messages and forms." />
          <Row skill="Listening" ice="Lytning" note="Follow clear, everyday spoken Norwegian on familiar topics at a natural but unhurried pace." />
          <Row skill="Writing" ice="Skrivning" note="Write short, practical texts — a note, a form, a simple message — with B1 accuracy." />
          <Row skill="Speaking" ice="Tale" note="Take part in everyday conversations about everyday matters and answer familiar questions." />
          <p className="text-xs text-almi-text-muted">
            All four skills are assessed at B1–B2. This is general information about the language requirement, not advice
            about your citizenship application.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
          <h2 className="text-xl font-semibold text-almi-ink">How Norskprøven B1–B2 is passed</h2>
          <p className="mt-3 text-base text-almi-text">
            Norskprøven B1–B2 passes on a <strong>combined average (≥2.0, with the oral exam weighted double)</strong> — not
            per-section floors. A strong overall result, with speaking carrying extra weight, matters more than clearing a
            fixed minimum in every single paper. Marking and pass rules can change, so always{" "}
            <strong>confirm current rules with UDI.</strong>
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">The language requirement is only one part</h2>
          <p className="mt-3 text-base text-almi-text">
            Passing Norskprøven B1–B2 proves the <strong>language</strong> requirement for citizenship. It does not decide
            your application on its own — citizenship also depends on <strong>residency and other conditions</strong>, and
            those are set by <strong>UDI</strong>. Those rules change over
            time, so we don&apos;t state a fixed number of years or a fixed step. The reliable move is to check your own
            situation directly with UDI rather than assuming.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">How to prepare — honestly</h2>
          <p className="mt-3 text-base text-almi-text">
            Preparation has the same shape whichever your circumstances: get comfortable with the four language skills —
            Reading (Læsning), Listening (Lytning), Writing (Skrivning) and Speaking (Tal) — at B1–B2. AlmiNorwegian lets you
            practise all of them and shows an honest per-skill readiness band (Clear or Borderline) against the real task
            criteria — an estimate to guide your prep, never an official UDI or HK-dir (the Directorate for Higher Education and Skills)
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
            <strong>Always confirm your own requirement with UDI.</strong> Residency and citizenship rules
            change, and only the official authorities can tell you which conditions apply to your situation. AlmiNorwegian
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
            <li><Link href="/exams/norskprove-b1b2" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">Norskprøven B1–B2 (B1–B2) guide</Link></li>
            <li><Link href="/exams/norskprove-a1a2" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">Norskprøven A1–A2 (A1–A2) guide</Link></li>
            <li><Link href="/exams" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">All Norwegian exams</Link></li>
          </ul>
        </section>
      </div>
    </main>
  );
}
