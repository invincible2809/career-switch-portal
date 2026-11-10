import { z } from "zod";
import { INDUSTRIES } from "@/lib/onboarding/skills-map";

const rating = (message: string) => z.coerce.number({ error: message }).int(message).min(1, message).max(5, message);
export const SKILL_KEYS = [
  { key: "communication", label: "Explaining things clearly to other people" },
  { key: "organisation", label: "Organising work and keeping track of tasks" },
  { key: "detail", label: "Spotting small mistakes" },
  { key: "problemSolving", label: "Working out why something has gone wrong" },
] as const;

export const WEEKLY_OPTIONS = [
  { minutes: 60, label: "About 1 hour a week" },
  { minutes: 120, label: "About 2 hours a week" },
  { minutes: 180, label: "About 3 hours a week" },
  { minutes: 300, label: "About 5 hours a week" },
  { minutes: 420, label: "7 hours or more a week" },
] as const;

export const onboardingSchema = z.object({
  consent: z.literal("on").optional(),
  previousRoles: z.string().trim().max(300).optional().default(""),
  industry: z.enum(INDUSTRIES.map((i) => i.id) as [string, ...string[]]).optional().or(z.literal("")),
  techConfidence: rating("Choose how confident you feel with technology"),
  communication: rating("Rate yourself for explaining things"),
  organisation: rating("Rate yourself for organising work"),
  detail: rating("Rate yourself for spotting small mistakes"),
  problemSolving: rating("Rate yourself for working out why something went wrong"),
  preferredPathway: z.enum(["SCRUM_MASTER", "QA_TESTER", "HELP_ME_CHOOSE"], { message: "Choose a pathway, or choose 'Help me choose'" }),
  weeklyMinutes: z.coerce.number({ error: "Choose how much time you have" }).int().refine((m) => WEEKLY_OPTIONS.some((o) => o.minutes === m), "Choose how much time you have"),
  goal: z.string().trim().max(300).optional().default(""),
  textScale: z.enum(["DEFAULT", "LARGE", "LARGER"]).default("DEFAULT"),
  dyslexiaFont: z.literal("on").optional(),
  reducedMotion: z.literal("on").optional(),
  readAloud: z.literal("on").optional(),
});

export const accessibilitySchema = onboardingSchema.pick({
  textScale: true,
  dyslexiaFont: true,
  reducedMotion: true,
  readAloud: true,
});
