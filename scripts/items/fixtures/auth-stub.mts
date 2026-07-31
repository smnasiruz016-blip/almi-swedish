// Stub for @/lib/auth, used ONLY by scripts/items/grade-integrity-proof.mts.
//
// The real getCurrentUser() reads cookies() from next/headers, which throws outside a
// request scope. The proof is not testing session handling — it is testing what the
// route does with an authenticated caller's BODY — so the session is supplied here and
// the rest of the route runs for real.
//
// A FREE-tier learner on purpose: READING is a free skill, so the objective path is
// reachable without the paid gate. That is exactly the population that could forge a
// POST, so it is the population the proof attacks with.

export async function getCurrentUser() {
  return {
    id: "proof-user",
    email: "proof@example.test",
    role: "USER",
    emailVerified: null,
    compProUntil: null,
    stripeSubscriptionStatus: null,
    stripePriceId: null,
    stripeCurrentPeriodEnd: null,
  };
}

export async function requireUser() {
  return getCurrentUser();
}
