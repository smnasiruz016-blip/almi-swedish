import { NextResponse, type NextRequest } from "next/server";

// COST FIX 2026-10-26 — the old programmatic combination pages are DELETED (owner ruling 17 Oct:
// deleted, no redirects; new pages are built only by AlmiVisibility). Every URL under these
// families answers 410 Gone here, before any rendering, ISR write or database call. The family
// index pages (/study-in-sweden, /work-in-sweden) are NOT matched and stay as they are.
export function proxy(_request: NextRequest) {
  return new NextResponse("410 Gone — this page has been removed.", {
    status: 410,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
      "x-robots-tag": "noindex",
    },
  });
}

export const config = {
  matcher: ["/study-in-sweden/:path+", "/work-in-sweden/:path+"],
};
