"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { consumeRateLimit } from "@/server/rate-limit";
import { coachReply } from "@/server/coach/service";
import { coachContent } from "@/server/coach/content";
import { interviewFeedback, type InterviewFeedback } from "@/lib/coach/interview";
import type { IndustryId } from "@/lib/onboarding/skills-map";
import type { FormState } from "@/lib/schemas/auth";

const askSchema = z.object({
  question: z.string().trim().min(3, "Type a question first").max(500, "Keep questions under 500 characters"),
  mode: z.enum(["ask", "simpler", "my-job"]).default("ask"),
});

export async function askCoachAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireLearner();
  const parsed = askSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await consumeRateLimit(`coach:${user.id}`, 40, 60 * 60 * 1000))) {
    return { error: "You've asked a lot of questions in the last hour. Take a break and try again later." };
  }
  // Only use the industry if the learner consented to store it (SPEC §13).
  const industry = user.profile?.optionalDataConsentAt ? ((user.profile.industry as IndustryId | null) ?? null) : null;
  const active = user.profile?.activePathwayId ? await db.pathway.findUnique({ where: { id: user.profile.activePathwayId }, select: { slug: true } }) : null;
  const reply = await coachReply(parsed.data.question, parsed.data.mode, industry, active?.slug === "scrum-master" ? "SCRUM_MASTER" : "QA_TESTER");
  // Distinct timestamps keep the question before its reply when the thread is read back.
  const now = Date.now();
  await db.coachMessage.createMany({
    data: [
      { userId: user.id, threadId: "ask", role: "learner", content: parsed.data.question, createdAt: new Date(now) },
      { userId: user.id, threadId: "ask", role: "coach", content: JSON.stringify(reply), lessonRefs: reply.excerpts.map((e) => `${e.lessonSlug}#${e.sectionKey}`), createdAt: new Date(now + 1) },
    ],
  });
  revalidatePath("/coach");
  return { ok: "Answered." };
}

const flagSchema = z.object({ messageId: z.string().min(1).max(50), reason: z.string().trim().min(3, "Say briefly what's wrong").max(1000) });

export async function flagCoachAnswerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireLearner();
  const parsed = flagSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const message = await db.coachMessage.findFirst({ where: { id: parsed.data.messageId, userId: user.id, role: "coach" } });
  if (!message) return { error: "That answer couldn't be found." };
  await db.flaggedItem.create({ data: { reporterId: user.id, kind: "COACH_ANSWER", targetId: message.id, reason: parsed.data.reason } });
  return { ok: "Thanks – an admin will review this answer." };
}

export async function clearCoachHistoryAction() {
  const user = await requireLearner();
  await db.coachMessage.deleteMany({ where: { userId: user.id, threadId: "ask" } });
  revalidatePath("/coach");
}

export type InterviewState = FormState & { feedback?: InterviewFeedback; questionId?: string };

export async function interviewAnswerAction(_prev: InterviewState, formData: FormData): Promise<InterviewState> {
  const user = await requireLearner();
  const parsed = z
    .object({ questionId: z.string().min(1).max(100), answer: z.string().trim().min(10, "Write your answer first (a few sentences)").max(3000) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await consumeRateLimit(`interview:${user.id}`, 60, 60 * 60 * 1000))) return { error: "Please wait a little before trying again." };
  const q = coachContent().interview.find((x) => x.id === parsed.data.questionId);
  if (!q) return { error: "That question doesn't exist." };
  const feedback = interviewFeedback(q, parsed.data.answer);
  await db.coachMessage.createMany({
    data: [
      { userId: user.id, threadId: `interview:${q.id}`, role: "learner", content: parsed.data.answer, createdAt: new Date(Date.now()) },
      { userId: user.id, threadId: `interview:${q.id}`, role: "coach", content: JSON.stringify(feedback), createdAt: new Date(Date.now() + 1) },
    ],
  });
  return { ok: "Feedback ready.", feedback, questionId: q.id };
}
