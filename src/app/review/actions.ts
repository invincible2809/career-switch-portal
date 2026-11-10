"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { recordForReview } from "@/server/review";
import { toSnapshot } from "@/lib/assessment/snapshot";
import { isCorrect } from "@/lib/assessment/scoring";
import type { PracticeFeedback } from "@/app/learn/[lesson]/actions";

/** Marks a quick-review answer. Only works for questions that are in this learner's review list. */
export async function checkReviewAnswerAction(questionId: string, seed: number, response: string[]): Promise<PracticeFeedback | null> {
  const user = await requireLearner();
  const parsed = z
    .object({ questionId: z.string().min(1), seed: z.number().int().min(0), response: z.array(z.string().max(5)).max(10) })
    .safeParse({ questionId, seed, response });
  if (!parsed.success) return null;
  const item = await db.reviewItem.findUnique({
    where: { userId_questionId: { userId: user.id, questionId: parsed.data.questionId } },
    include: { question: true },
  });
  if (!item || item.retiredAt) return null;
  const snapshot = toSnapshot(item.question, parsed.data.seed);
  const correct = isCorrect(snapshot, parsed.data.response);
  await recordForReview(user.id, item.questionId, correct, item.question.isKey);
  return { correct, options: snapshot.options, correctOrder: snapshot.correctOrder };
}
