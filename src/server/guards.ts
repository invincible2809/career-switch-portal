import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";
import { can, type Action } from "@/lib/permissions";

/** The signed-in user, freshly loaded from the database, or null. Never trusts the token's claims alone. */
export const getCurrentUser = cache(async () => {
  const session = (await auth()) as { uid?: string; sv?: number } | null;
  if (!session?.uid) return null;
  const user = await db.user.findUnique({
    where: { id: session.uid },
    include: { accessibility: true, profile: true },
  });
  if (!user || user.sessionVersion !== session.sv) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Learner pages: signed in and onboarding finished. */
export async function requireLearner(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role === "LEARNER" && !user.profile?.onboardingCompletedAt) redirect("/onboarding");
  return user;
}

/** Admin pages and server actions. Learners get a 404 so admin pages aren't revealed. */
export async function requireAdmin(action: Action = "admin:access"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, action)) notFound();
  return user;
}

/** Admin API route handlers: a JSON 401/403 instead of a redirect. */
export async function adminApiGuard(action: Action = "admin:access"): Promise<CurrentUser | Response> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!can(user.role, action)) return Response.json({ error: "Forbidden" }, { status: 403 });
  return user;
}
