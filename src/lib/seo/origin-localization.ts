// Origin-localization resolver — the enforcement seam for the AlmiWorld pSEO
// Localization Standard (rules #1, #2, #4).
//
// Every study/jobs/migration page MUST weave a per-origin block. This resolver
// returns EITHER the verified facts from the shared @smnasiruz016-blip/almi-data
// layer, OR an honest-generic fallback (never a name-swap, never an invented
// body). Because the generator's builders REQUIRE an OriginBlock and render a
// dedicated origin section from it, a bare name-swap template is structurally
// impossible — and the build-time uniqueness gate fails the build if any page
// still comes out near-identical to another.

import { originContext } from "@smnasiruz016-blip/almi-data";
import type { SeoCountry } from "@/lib/seo/axes";

export type OriginBlock = {
  slug: string;
  countryName: string;
  /** true = verified per-origin data woven; false = honest-generic fallback. */
  localized: boolean;
  /** Degree-recognition body (verified name, or a hedged generic phrase). */
  recognitionBody: string;
  recognitionUrl?: string;
  /** What using a foreign/Norwegian degree back home requires. */
  equivalenceNote: string;
  /** The lead concern a searcher from this origin actually brings. */
  commonConcern: string;
  /** The vocabulary this nationality searches with (empty when unresearched). */
  searchTerms: string[];
  /** Generic, hedged citizenship note — always "confirm". */
  citizenshipNote: string;
  /** Optional caveat (e.g. a body mid-transition, dual-track authority). */
  sourceNote?: string;
};

/**
 * Resolve the per-origin block for a country. NEVER returns null — an
 * unresearched origin gets an honest-generic block (hedged, "confirm with the
 * relevant authority"), so the page is still origin-aware without fabricating a
 * body or a fact.
 */
export function resolveOriginBlock(country: SeoCountry): OriginBlock {
  const loc = originContext(country.slug);
  if (loc) {
    return {
      slug: country.slug,
      countryName: country.name,
      localized: true,
      recognitionBody: loc.recognitionBody,
      recognitionUrl: loc.recognitionUrl,
      equivalenceNote: loc.equivalenceNote,
      commonConcern: loc.commonConcern,
      searchTerms: loc.searchTerms,
      citizenshipNote: loc.citizenshipNote,
      sourceNote: loc.sourceNote,
    };
  }
  // Honest-generic fallback — origin-aware, but no invented body or number.
  return {
    slug: country.slug,
    countryName: country.name,
    localized: false,
    recognitionBody: `the official degree-recognition authority in ${country.name}`,
    equivalenceNote: `If you plan to use your studies back in ${country.name}, confirm how a Norwegian qualification is recognised with the relevant authority there before relying on it.`,
    commonConcern: `how a Norwegian qualification is recognised back in ${country.name}`,
    searchTerms: [],
    citizenshipNote: `Citizenship and dual-nationality rules differ by country and change — confirm the current requirement with the authorities in ${country.name} and in Norway.`,
  };
}
