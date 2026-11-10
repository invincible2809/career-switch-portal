"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/guards";
import { signOut } from "@/server/auth";
import { verifyPassword } from "@/server/password";
import { deleteAccount } from "@/server/account";
import { accessibilitySchema, WEEKLY_OPTIONS } from "@/lib/schemas/onboarding";
import { INDUSTRIES } from "@/lib/onboarding/skills-map";
import { fieldErrors, type FormState } from "@/lib/schemas/auth";

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name").max(100),
  pathway: z.enum(["scrum-master", "qa-tester"], { message: "Choose a pathway" }),
  weeklyMinutes: z.coerce.number().int().refine((m) => WEEKLY_OPTIONS.some((o) => o.minutes === m), "Choose how much time you have"),
  goal: z.string().trim().max(300).optional().default(""),
  consent: z.literal("on").optional(),
  previousRoles: z.string().trim().max(300).optional().default(""),
  industry: z.enum(INDUSTRIES.map((i) => i.id) as [string, ...string[]]).optional().or(z.literal("")),
});

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const pathway = await db.pathway.findUniqueOrThrow({ where: { slug: d.pathway } });
  const consent = d.consent === "on";
  await db.user.update({ where: { id: user.id }, data: { displayName: d.displayName } });
  await db.learnerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  await db.learnerProfile.update({
    where: { userId: user.id },
    data: {
      activePathwayId: pathway.id,
      weeklyMinutes: d.weeklyMinutes,
      goal: d.goal || null,
      optionalDataConsentAt: consent ? (user.profile?.optionalDataConsentAt ?? new Date()) : null,
      previousRoles: consent && d.previousRoles ? d.previousRoles.split(",").map((r) => r.trim()).filter(Boolean).slice(0, 10) : [],
      industry: consent && d.industry ? d.industry : null,
    },
  });
  revalidatePath("/", "layout");
  return { ok: "Your settings have been saved. Your progress is unchanged." };
}

export async function updateAccessibilityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = accessibilitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const data = {
    textScale: parsed.data.textScale,
    dyslexiaFont: parsed.data.dyslexiaFont === "on",
    reducedMotion: parsed.data.reducedMotion === "on",
    readAloud: parsed.data.readAloud === "on",
  };
  await db.accessibilityPrefs.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  revalidatePath("/", "layout");
  return { ok: "Display settings saved." };
}

export async function deleteAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z
    .object({ password: z.string().min(1, "Enter your password to confirm").max(200), confirm: z.literal("DELETE", { message: 'Type DELETE in capital letters to confirm' }) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (!(await verifyPassword(user.passwordHash, parsed.data.password))) {
    return { fieldErrors: { password: "That password isn't right" } };
  }
  if (user.role === "ADMIN" && (await db.user.count({ where: { role: "ADMIN" } })) <= 1) {
    return { error: "You're the only admin. Make someone else an admin before deleting this account." };
  }
  await deleteAccount(user.id);
  await signOut({ redirect: false });
  redirect("/login?deleted=1");
}
