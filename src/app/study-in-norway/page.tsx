import type { Metadata } from "next";
import Link from "next/link";
import { SUBJECTS } from "@/lib/seo/axes";

export const metadata: Metadata = {
  title: { absolute: "Study in Norway — the Norwegian-language pathway by subject | AlmiNorwegian" },
  description:
    "Studying in Norway often means meeting a Norwegian-language requirement. Explore the pathway by subject, with honest readiness practice — never a fabricated official result.",
  alternates: { canonical: "/study-in-norway" },
};

export default function StudyHub() {
  return (
    <main className="bg-almi-bg text-almi-text">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-almi-ink sm:text-4xl">Study in Norway</h1>
        <p className="mt-3 max-w-2xl text-base text-almi-text">
          Whatever you plan to study in Norway, the step students most often underestimate is the
          Norwegian-language requirement — Norwegian-taught programmes typically expect around B2, and the
          Bergenstesten is a common gateway for Norwegian-taught programmes. Choose a field to see the language pathway
          and practise honestly for the Norwegian exams — the Norskprøven ladder and Bergenstesten.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {SUBJECTS.map((s) => (
            <li key={s.slug}>
              <Link href={`/study-in-norway/${s.slug}`} className="block rounded-2xl border border-almi-bg-peach bg-almi-paper p-4 text-almi-ink hover:border-almi-coral">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
