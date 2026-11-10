import "server-only";
import { db } from "./db";
import { nextReview, startReview } from "@/lib/assessment/review";

/** Wrong answers (and key questions) enter spaced review; answering a due item moves it on. */
export async function recordForReview(userId: string, questionId: string, correct: boolean, isKey: boolean, now = new Date()) {
  const existing = await db.reviewItem.findUnique({ where: { userId_questionId: { userId, questionId } } });
  if (!existing) {
    if (correct && !isKey) return;
    const s = startReview(now);
    await db.reviewItem.create({ data: { userId, questionId, stage: s.stage, dueAt: s.dueAt } });
    return;
  }
  if (existing.retiredAt && correct) return;
  if (existing.dueAt > now && correct) return; // not due yet: a correct answer elsewhere doesn't skip ahead
  const s = existing.dueAt > now ? startReview(now) : nextReview({ stage: existing.stage }, correct, now);
  await db.reviewItem.update({
    where: { id: existing.id },
    data: { stage: s.stage, dueAt: s.dueAt, lastAnsweredAt: now, retiredAt: s.retired ? now : null },
  });
}
