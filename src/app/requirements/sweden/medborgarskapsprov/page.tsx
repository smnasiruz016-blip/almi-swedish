import type { Metadata } from "next";
import Link from "next/link";

// Honest requirements explainer for Sweden's NEW citizenship test. This page's
// whole job is to be the one place that does not overclaim: the society test is
// real but provisional, the language test does not exist yet, and no pass mark has
// been published. Framed as honest preparation, never as beating or getting around
// Migrationsverket.
//
// Cost rule: cache indefinitely; the facts only change on redeploy.
export const revalidate = false;

const PATH = "/requirements/sweden/medborgarskapsprov";

export const metadata: Metadata = {
  title: { absolute: "Sweden's Citizenship Test (Medborgarskapsprovet): What Is Actually Known" },
  description:
    "Sweden's new citizenship test: the society component starts with a pilot on 15 August 2026, the language test is not expected before autumn 2028, and UHR has published no pass mark. An honest guide — plus original practice.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Medborgarskapsprovet — an honest guide to Sweden's new citizenship test",
    description:
      "What UHR has actually published about Medborgarskapsprovet, what is still unknown, and how to prepare fairly. Confirm current requirements with UHR and Migrationsverket.",
  },
};

const FAQ = [
  {
    q: "What is Medborgarskapsprovet?",
    a: "It is Sweden's new citizenship test. Under rules in force since 6 June 2026, applicants for Swedish citizenship aged 16–66 must demonstrate knowledge of Swedish society and of Swedish. UHR (Universitets- och högskolerådet) develops, administers and marks the test; Migrationsverket assesses citizenship applications and instructs applicants to register. So far only the society component exists.",
  },
  {
    q: "What score do I need to pass?",
    a: "UHR has not published a pass mark. Nobody can honestly tell you what it is, and anyone who quotes you a number is guessing. The test is new: the first sitting, on 15 August 2026, is an utprövningsprov — a pilot — and it is free of charge. Check UHR for the current details rather than trusting a third party's figure.",
  },
  {
    q: "Is there a Swedish language test for citizenship?",
    a: "Not yet. A language component is planned, but UHR indicates it cannot be ready before autumn 2028 at the earliest, and no CEFR level has been set for it. We do not sell practice for it, because there is nothing published to practise against. Building your Swedish on the SFI/CEFR ladder helps you either way — but it is not the citizenship language test, and we will not pretend otherwise.",
  },
  {
    q: "What does the society test cover, and what format is it?",
    a: "UHR describes the test provisionally as around 60 multiple-choice questions with four options each, in about 90 minutes, in Swedish and on paper. The content comes from UHR's own free study material, Sverige i fokus, which covers 13 areas of Swedish society — from how Sweden is governed and how elections work to law and rights, the labour market, welfare, modern history, media, religion and traditions. The format is provisional and may change before the test is established.",
  },
  {
    q: "Is passing the test enough for citizenship?",
    a: "No — it is one requirement, not the whole application. Since 6 June 2026 the main rule for habitual residence is eight years, and there is a self-sufficiency requirement as well. There are no transitional arrangements: Migrationsverket assesses cases not decided before 6 June 2026 under the new rules. Only Migrationsverket can tell you which conditions apply to your situation.",
  },
  {
    q: "How does AlmiSwedish help — and is it official?",
    a: "It is not official. AlmiSwedish is not affiliated with UHR, and UHR has said plainly that it does not stand behind unofficial practice tests found online and that their quality is not checked by UHR. That includes ours. Our questions are original practice written against the same 13 society areas Sverige i fokus covers; they are not UHR's question bank, and no score here is an official result. Use UHR's free material as your source of truth and use us to find your gaps.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

// The honest core of this page: separating published fact from open question.
const KNOWN = [
  { k: "Who runs it", v: "UHR develops, administers and marks the test. Migrationsverket assesses citizenship applications and instructs applicants to register." },
  { k: "Who must take it", v: "Applicants for Swedish citizenship aged 16–66." },
  { k: "First sitting", v: "15 August 2026, at Stockholmsmässan — an utprövningsprov (pilot), free of charge." },
  { k: "Provisional format", v: "Around 60 multiple-choice questions, four options each, about 90 minutes, in Swedish, on paper." },
  { k: "Source material", v: "UHR's own study material Sverige i fokus — free as a PDF and as audio — covering 13 areas of Swedish society." },
  { k: "Residence rule", v: "Eight years' habitual residence as the main rule, since 6 June 2026, with no transitional arrangements." },
];

const UNKNOWN = [
  { k: "The pass mark", v: "Not published by UHR. We do not show one, and we do not guess." },
  { k: "The language test", v: "Planned, but UHR indicates autumn 2028 at the earliest. No CEFR level has been set." },
  { k: "The settled format", v: "The 60-question / 90-minute shape is provisional and may change before the test is established." },
];

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl border border-almi-bg-peach bg-almi-paper p-5 sm:grid-cols-[11rem_1fr]">
      <div className="text-sm font-semibold text-almi-ink">{k}</div>
      <div className="text-sm text-almi-text sm:col-span-1 col-span-2">{v}</div>
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
            <li className="flex items-center gap-1"><span aria-hidden>/</span><Link href="/exams" className="hover:text-almi-coral">Swedish exams</Link></li>
            <li className="flex items-center gap-1"><span aria-hidden>/</span><span>Medborgarskapsprovet</span></li>
          </ol>
        </nav>

        <header>
          <p className="text-sm font-bold uppercase tracking-widest text-almi-accent-deep">Requirements · Sweden</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-almi-ink sm:text-4xl">
            Sweden&apos;s new citizenship test: what is actually known.
          </h1>
          <p className="mt-3 text-base text-almi-text">
            Since <strong>6 June 2026</strong>, Swedish citizenship has required <strong>eight years&apos; habitual
            residence</strong> as the main rule, <strong>self-sufficiency</strong>, and — for applicants aged{" "}
            <strong>16–66</strong> — <strong>Medborgarskapsprovet</strong>. The test is developed, administered and marked
            by <strong>UHR</strong> (Universitets- och högskolerådet); applications are assessed by{" "}
            <strong>Migrationsverket</strong>.
          </p>
          <p className="mt-3 text-base text-almi-text">
            The test is genuinely new, and a lot of what is written about it online is invented. This page separates what
            UHR has actually published from what nobody knows yet.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">What UHR has published</h2>
          <div className="mt-4 space-y-3">
            {KNOWN.map((f) => <Fact key={f.k} {...f} />)}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">What is not known — and what we refuse to invent</h2>
          <div className="mt-4 space-y-3">
            {UNKNOWN.map((f) => <Fact key={f.k} {...f} />)}
          </div>
          <p className="mt-4 text-xs text-almi-text-muted">
            This is general information about the requirement, not advice about your citizenship application.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
          <h2 className="text-xl font-semibold text-almi-ink">There is no language test yet</h2>
          <p className="mt-3 text-base text-almi-text">
            The citizenship requirement covers knowledge of Swedish society <em>and</em> Swedish. Only the{" "}
            <strong>society component</strong> exists. UHR indicates a Swedish language test{" "}
            <strong>cannot be ready before autumn 2028</strong> at the earliest, and <strong>no level has been set</strong>{" "}
            for it. We do not sell practice for a test with no published specification. Building your Swedish on the{" "}
            <Link href="/exams" className="font-semibold text-almi-coral-deep hover:underline">SFI / CEFR ladder</Link>{" "}
            helps you in daily life, at work and in study whatever happens — but it is not the citizenship language test.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">The test is only one part</h2>
          <p className="mt-3 text-base text-almi-text">
            Passing the society test addresses <strong>one</strong> requirement. Citizenship also depends on{" "}
            <strong>eight years&apos; habitual residence</strong> (the main rule) and <strong>self-sufficiency</strong>, and
            those are assessed by <strong>Migrationsverket</strong>. The rules changed on 6 June 2026{" "}
            <strong>without transitional arrangements</strong>, which means applications not decided before that date are
            assessed under the new rules. Check your own situation directly with Migrationsverket rather than assuming.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">How to prepare — honestly</h2>
          <p className="mt-3 text-base text-almi-text">
            Start with UHR&apos;s own material: <strong>Sverige i fokus</strong> is free, comes from UHR, and is the source
            the test is drawn from. Then use practice to find your gaps. AlmiSwedish gives you original questions written
            against the same 13 areas, auto-marked so you can see where you actually stand. Because UHR has published no
            pass mark, <strong>we do not show one</strong> — we show what you got right and what you missed.
          </p>
          <p className="mt-3 text-base text-almi-text">
            We help you prepare fairly. We don&apos;t claim to shortcut the process, and we couldn&apos;t if we wanted to.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-almi-ink">Practise the society questions — honestly.</p>
          <Link
            href="/practice/medborgarskapsprov"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-full bg-almi-coral px-7 py-3 text-base font-semibold text-almi-ink hover:bg-almi-coral-deep"
          >
            Start your 7-day free trial
          </Link>
          <p className="mt-3 text-xs text-almi-text-muted">7-day free trial · $12/month · cancel anytime</p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-accent/40 bg-almi-accent/10 p-5">
          <p className="text-sm text-almi-ink">
            <strong>AlmiSwedish is not affiliated with UHR, and UHR does not endorse this site.</strong> UHR has stated
            that it does not stand behind unofficial practice tests found online and that their quality is not checked by
            UHR — that includes ours. Use UHR&apos;s free material as your source of truth, and confirm your own
            requirement with UHR and Migrationsverket. Only the official authorities can tell you which conditions apply
            to your situation.
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
            <li><Link href="/exams/medborgarskapsprov" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">Medborgarskapsprovet guide</Link></li>
            <li><Link href="/exams/tisus" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">Tisus (≈C1) — university admission</Link></li>
            <li><Link href="/exams/sfi-cd" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">SFI Courses C–D guide</Link></li>
            <li><Link href="/exams" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">All Swedish exams</Link></li>
          </ul>
        </section>
      </div>
    </main>
  );
}
