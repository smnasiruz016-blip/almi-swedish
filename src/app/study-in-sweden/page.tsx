import type { Metadata } from "next";
import { SUBJECTS } from "@/lib/seo/axes";

export const metadata: Metadata = {
  title: { absolute: "Study in Sweden — the Swedish-language pathway by subject | AlmiSwedish" },
  description:
    "Studying in Sweden in Swedish means meeting a Swedish-language requirement — usually Tisus (≈C1). Explore the pathway by subject, with honest readiness practice — never a fabricated official result.",
  alternates: { canonical: "/study-in-sweden" },
};

export default function StudyHub() {
  return (
    <main className="bg-almi-bg text-almi-text">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-almi-ink sm:text-4xl">Study in Sweden</h1>
        <p className="mt-3 max-w-2xl text-base text-almi-text">
          Whatever you plan to study in Sweden, the step students most often underestimate is the
          Swedish-language requirement. Many master&apos;s programmes are taught in English, but a
          Swedish-taught degree asks you to document your Swedish — and Tisus (≈C1), run by
          Stockholms universitet, is the established route. Choose a field to see the language
          pathway, and practise honestly for the Swedish exams — the SFI courses, general Swedish
          B1–B2 and Tisus.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {SUBJECTS.map((s) => (
            <li key={s.slug}>
              <span className="block rounded-2xl border border-almi-bg-peach bg-almi-paper p-4 text-almi-ink">
                {s.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
