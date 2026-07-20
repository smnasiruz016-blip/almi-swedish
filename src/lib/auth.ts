import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// The session cookie. Named for THIS product — it carried the ancestor's name on
// every visitor's browser until 2026-07-20, and the fork-hygiene gate could not see
// it because the ban list held only the hyphen form of a product slug.
const SESSION_COOKIE_NAME = "almi_swedish_session";

/** Cookie names we still READ but never write. Renaming a session cookie normally
 *  logs out every live session — the browser keeps sending the old name and nothing
 *  reads it. Nobody has to be logged out here: the cookie is only a container for the
 *  token, and the session is found in the DB by tokenHash, so the NAME on the
 *  envelope is irrelevant to the lookup. Read both, write one, and the rename is free.
 *
 *  🔴 REMOVAL: safe to delete this list — and its hygiene-allow — once every legacy
 *  cookie has expired. They were issued with a 30-day life (SESSION_DURATION_MS), so
 *  any still valid on 2026-08-20 was issued before this rename shipped (2026-07-20).
 *  After that date this is dead code holding an ancestor noun in the repo, which is
 *  exactly what the fork-hygiene gate exists to stop. Delete it then; do not let it
 *  become permanent furniture. */
const LEGACY_SESSION_COOKIE_NAMES = [
  "almi_norwegian_session", // hygiene-allow — legacy read-only, delete after 2026-08-20
];

/** Read the session token from the current cookie name, falling back to legacy names.
 *  Current name wins: a browser can carry both while a legacy cookie ages out. */
async function readSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  for (const name of [SESSION_COOKIE_NAME, ...LEGACY_SESSION_COOKIE_NAMES]) {
    const value = cookieStore.get(name)?.value;
    if (value) return value;
  }
  return undefined;
}
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const token = await readSessionToken();
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  // Clear BOTH names. Deleting only the current one would leave a stale legacy
  // cookie in the browser that logs the user straight back in.
  const cookieStore = await cookies();
  for (const name of [SESSION_COOKIE_NAME, ...LEGACY_SESSION_COOKIE_NAMES]) {
    cookieStore.delete(name);
  }
}

export async function getCurrentUser() {
  const token = await readSessionToken();
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
