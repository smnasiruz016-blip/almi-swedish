// Stub for @/lib/prisma, used ONLY by scripts/items/grade-integrity-proof.mts.
//
// The proof runs with no database and no DATABASE_URL. The single prisma call on the
// grading path is the best-effort attempt write, which ALREADY fails in production —
// SwedishAttempt.itemId is a required FK to SwedishItem, a table nothing populates
// because items are served from JSON bundles. So this stub rejects rather than resolving:
// it reproduces the real behaviour, and it makes the proof assert something worth
// asserting — that a failed persist never changes the score the learner is given.

export const prisma = {
  swedishAttempt: {
    create: async (): Promise<never> => {
      throw new Error("stubbed: no database in the proof harness");
    },
  },
};
