import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Optional access allowlist. When ALLOWED_CLERK_USER_IDS is set (comma-separated
 * Clerk user IDs), any other signed-in Clerk user is rejected before a user row is
 * created or any account, calendar or OAuth grant is touched. Unset = previous
 * behaviour (any Clerk user may use the instance).
 */
function allowedClerkUserIds(): Set<string> | null {
  const raw = process.env.ALLOWED_CLERK_USER_IDS?.trim();
  if (!raw) return null;
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

export function signupDisabled(): boolean {
  return process.env.DISABLE_SIGNUP === "true" || allowedClerkUserIds() !== null;
}

export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const allowed = allowedClerkUserIds();
  if (allowed && !allowed.has(userId)) return null;
  return userId;
}

export async function requireClerkUserId(): Promise<string> {
  const userId = await getClerkUserId();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function ensureUserRow(clerkUserId: string): Promise<string> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const [created] = await db
    .insert(users)
    .values({ clerkUserId })
    .returning({ id: users.id });
  return created.id;
}

export async function getCurrentUserRowId(): Promise<string> {
  const clerkUserId = await requireClerkUserId();
  return ensureUserRow(clerkUserId);
}
