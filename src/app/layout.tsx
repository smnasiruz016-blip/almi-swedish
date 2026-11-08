import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

// RR-400: the Allura script font was loaded (and preloaded, ~49 KB) on every page but no element uses `font-script`, so it only
// competed with the page for bandwidth before the first big paint. Removed; Inter stays.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

const SITE_URL = "https://almiswedish.almiworld.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AlmiSwedish | Practise Swedish Exams with Honest Readiness",
    template: "%s · AlmiSwedish",
  },
  description:
    "Sweden's new 2026 citizenship rules add a civic test, with a language test to follow. Practise SFI, Tisus and the new Medborgarskapsprov with honest AI readiness bands. Try free for 48 hours, no card. Then $12/month. Original material, never copied from official exam papers. Not affiliated with UHR — confirm current requirements with UHR and Migrationsverket. Part of the AlmiWorld family.",
  applicationName: "AlmiSwedish",
  authors: [{ name: "AlmiWorld" }],
  keywords: ["SFI practice test online", "Swedish citizenship language test", "Tisus mock test", "Medborgarskapsprov Sweden preparation", "Svenska B1 B2 evaluation", "Medborgarskapsprovet", "SFI", "Tisus", "learn Swedish", "Swedish exam practice", "AlmiSwedish", "AlmiWorld"],
  openGraph: {
    title: "AlmiSwedish — honest SFI, Tisus & Medborgarskapsprov practice",
    description: "Original Swedish practice for the SFI ladder, Tisus and Sweden's new Medborgarskapsprov civic test — honest per-skill readiness estimates and AI feedback.",
    url: SITE_URL,
    siteName: "AlmiSwedish",
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: "AlmiSwedish — SFI, Tisus & Medborgarskapsprov practice", description: "Honest Swedish practice — per-skill readiness estimates, ranges not inflated numbers." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <GlobalHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <GlobalFooter />
      </body>
    </html>
  );
}
