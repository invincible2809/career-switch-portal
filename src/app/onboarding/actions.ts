"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/guards";
import { scoreDiagnostic } from "@/server/onboarding";
import { onboardingSchema } from "@/lib/schemas/onboarding";
import { fieldErrors, type FormState } from "@/lib/schemas/auth";

export async function saveOnboardingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const consent = d.consent === "on";
  await db.$transaction([
    db.learnerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    }),
    db.learnerProfile.update({
      where: { userId: user.id },
      data: {
        // Optional personal data is only kept with consent (SPEC §13).
        optionalDataConsentAt: consent ? (user.profile?.optionalDataConsentAt ?? new Date()) : null,
        previousRoles: consent && d.previousRoles ? d.previousRoles.split(",").map((r) => r.trim()).filter(Boolean).slice(0, 10) : [],
        industry: consent && d.industry ? d.industry : null,
        techConfidence: d.techConfidence,
        skills: { communication: d.communication, organisation: d.organisation, detail: d.detail, problemSolving: d.problemSolving },
        preferredPathway: d.preferredPathway,
        weeklyMinutes: d.weeklyMinutes,
        goal: d.goal || null,
      },
    }),
    db.accessibilityPrefs.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        textScale: d.textScale,
        dyslexiaFont: d.dyslexiaFont === "on",
        reducedMotion: d.reducedMotion === "on",
        readAloud: d.readAloud === "on",
      },
      update: {
        textScale: d.textScale,
        dyslexiaFont: d.dyslexiaFont === "on",
        reducedMotion: d.reducedMotion === "on",
        readAloud: d.readAloud === "on",
      },
    }),
  ]);
  // Display settings live on <html> in the root layout, so refresh it.
  revalidatePath("/", "layout");
  redirect("/onboarding/diagnostic");
}

export async function submitDiagnosticAction(formData: FormData) {
  const user = await requireUser();
  const answers: Record<string, string> = {};
  for (const [k, v] of formData) {
    if (k.startsWith("q_") && typeof v === "string") answers[k.slice(2)] = v.slice(0, 5);
  }
  await scoreDiagnostic(user.id, answers);
  redirect("/onboarding/result");
}

const chooseSchema = z.object({ pathway: z.enum(["scrum-master", "qa-tester"]) });

export async function choosePathwayAction(formData: FormData) {
  const user = await requireUser();
  const parsed = chooseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/onboarding/result?error=choose");
  const pathway = await db.pathway.findUniqueOrThrow({ where: { slug: parsed.data.pathway } });
  await db.learnerProfile.update({
    where: { userId: user.id },
    data: { activePathwayId: pathway.id, onboardingCompletedAt: user.profile?.onboardingCompletedAt ?? new Date() },
  });
  redirect("/dashboard?welcome=1");
}
