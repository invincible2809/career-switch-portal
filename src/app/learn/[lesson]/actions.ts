"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { LESSON_PART_KEYS } from "@/lib/content/lesson-parts";
import { toSnapshot } from "@/lib/assessment/snapshot";
import { isCorrect } from "@/lib/assessment/scoring";
import { recordForReview } from "@/server/review";

const sectionKey = z.enum(LESSON_PART_KEYS as [string, ...string[]]);

export async function savePositionAction(lessonId: string, key: string, versionId: string) {
  const user = await requireLearner();
  const parsed = z.object({ lessonId: z.string().min(1), key: sectionKey, versionId: z.string().min(1) }).safeParse({ lessonId, key, versionId });
  if (!parsed.success) return;
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { publishedVersionId: true } });
  if (!lesson || lesson.publishedVersionId !== versionId) return;
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, lastSectionKey: key, lastVersionId: versionId },
    update: { lastSectionKey: key, lastVersionId: versionId },
  });
}

export async function completeLessonAction(formData: FormData) {
  const user = await requireLearner();
  const lessonId = z.string().min(1).parse(formData.get("lessonId"));
  const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId }, include: { module: { include: { pathway: true } } } });
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, lastSectionKey: "next-step", lastVersionId: lesson.publishedVersionId, contentCompletedAt: new Date() },
    update: { lastSectionKey: "next-step", contentCompletedAt: new Date() },
  });
  revalidatePath("/dashboard");
  redirect(`/pathways/${lesson.module.pathway.slug}/${lesson.module.slug}?completed=${lesson.slug}`);
}

const noteSchema = z.object({
  lessonId: z.string().min(1),
  sectionKey: sectionKey.optional(),
  body: z.string().trim().min(1, "Write something first").max(5000, "Notes can be up to 5,000 characters"),
});

export async function addNoteAction(formData: FormData) {
  const user = await requireLearner();
  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const lesson = await db.lesson.findUnique({ where: { id: parsed.data.lessonId }, select: { slug: true } });
  if (!lesson) return;
  await db.note.create({ data: { userId: user.id, ...parsed.data } });
  revalidatePath(`/learn/${lesson.slug}`);
}

export async function deleteNoteAction(formData: FormData) {
  const user = await requireLearner();
  const id = z.string().min(1).parse(formData.get("noteId"));
  // Ownership is part of the where clause: a learner can only delete their own notes.
  await db.note.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/notes");
  const back = formData.get("back");
  if (typeof back === "string" && back.startsWith("/learn/")) revalidatePath(back);
}

export async function toggleBookmarkAction(formData: FormData) {
  const user = await requireLearner();
  const parsed = z.object({ lessonId: z.string().min(1), sectionKey }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const where = { userId_lessonId_sectionKey: { userId: user.id, lessonId: parsed.data.lessonId, sectionKey: parsed.data.sectionKey } };
  const existing = await db.bookmark.findUnique({ where });
  if (existing) await db.bookmark.delete({ where: { id: existing.id } });
  else await db.bookmark.create({ data: { userId: user.id, ...parsed.data } });
  const lesson = await db.lesson.findUnique({ where: { id: parsed.data.lessonId }, select: { slug: true } });
  if (lesson) revalidatePath(`/learn/${lesson.slug}`);
  revalidatePath("/bookmarks");
}

export interface PracticeFeedback {
  correct: boolean;
  options: { id: string; text: string; correct: boolean; explanation: string }[];
  correctOrder: string[];
}

/** Knowledge-check practice: marked on the server so answers aren't in the page, and wrong answers go into review. */
export async function checkPracticeAnswerAction(questionId: string, seed: number, response: string[]): Promise<PracticeFeedback | null> {
  const user = await requireLearner();
  const parsed = z
    .object({ questionId: z.string().min(1), seed: z.number().int().min(0), response: z.array(z.string().max(5)).max(10) })
    .safeParse({ questionId, seed, response });
  if (!parsed.success) return null;
  const q = await db.question.findUnique({ where: { id: parsed.data.questionId }, include: { bank: true } });
  if (!q || q.bank.purpose === "DIAGNOSTIC") return null;
  // Module-assessment questions are never marked here, so this can't be used to find assessment answers.
  if (q.bank.purpose !== "KNOWLEDGE_CHECK") return null;
  const snapshot = toSnapshot(q, parsed.data.seed);
  const correct = isCorrect(snapshot, parsed.data.response);
  await recordForReview(user.id, q.id, correct, q.isKey);
  return { correct, options: snapshot.options, correctOrder: snapshot.correctOrder };
}
