import "server-only";
import { db } from "./db";
import { unlockState } from "./learning";
import { recordForReview } from "./review";
import { cooldownRemaining, drawQuestions } from "@/lib/assessment/draw";
import { scoreAttempt } from "@/lib/assessment/scoring";
import { toSnapshot } from "@/lib/assessment/snapshot";
import type { QuestionResponse, QuestionSnapshot } from "@/lib/assessment/types";
import { createRng, randomSeed } from "@/lib/random";

export async function getPublishedAssessment(slug: string) {
  const a = await db.assessment.findUnique({ where: { slug }, include: { module: { include: { pathway: true } } } });
  if (!a || a.status !== "PUBLISHED" || a.kind !== "MODULE") return null;
  return a;
}

export async function assessmentOverview(assessmentId: string, cooldownMinutes: number, userId: string) {
  const [unlock, attempts] = await Promise.all([
    unlockState("ASSESSMENT", assessmentId, userId),
    db.assessmentAttempt.findMany({ where: { userId, assessmentId }, orderBy: { startedAt: "desc" } }),
  ]);
  const lastSubmitted = attempts.find((a) => a.submittedAt)?.submittedAt ?? null;
  return {
    unlock,
    attempts,
    inProgress: attempts.find((a) => !a.submittedAt) ?? null,
    cooldownLeft: cooldownRemaining(lastSubmitted, cooldownMinutes, new Date()),
  };
}

export class AssessmentError extends Error {}

export async function startAttempt(userId: string, slug: string) {
  const assessment = await getPublishedAssessment(slug);
  if (!assessment) throw new AssessmentError("This assessment isn't available.");
  const overview = await assessmentOverview(assessment.id, assessment.cooldownMinutes, userId);
  if (!overview.unlock.unlocked) throw new AssessmentError("This assessment isn't unlocked yet.");
  if (overview.inProgress) return overview.inProgress;
  if (overview.cooldownLeft > 0) throw new AssessmentError(`You can try again in ${overview.cooldownLeft} minutes.`);

  const pool = await db.question.findMany({ where: { bankId: assessment.bankId, active: true, draft: false } });
  if (pool.length === 0) throw new AssessmentError("This assessment has no questions yet.");
  const seen = await db.attemptAnswer.findMany({
    where: { attempt: { userId, assessmentId: assessment.id } },
    select: { snapshot: true, attempt: { select: { startedAt: true } } },
  });
  const lastSeen = new Map<string, number>();
  for (const s of seen) {
    const key = (s.snapshot as unknown as QuestionSnapshot).key;
    lastSeen.set(key, Math.max(lastSeen.get(key) ?? 0, s.attempt.startedAt.getTime()));
  }
  const seed = randomSeed();
  const rng = createRng(seed);
  const picked = drawQuestions(pool, lastSeen, assessment.drawCount, rng);

  return db.assessmentAttempt.create({
    data: {
      userId,
      assessmentId: assessment.id,
      passMarkAtStart: assessment.passMark,
      drawCountAtStart: assessment.drawCount,
      seed,
      answers: {
        create: picked.map((q, i) => ({
          questionId: q.id,
          position: i,
          snapshot: toSnapshot(q, Math.floor(rng() * 2 ** 31)) as unknown as object,
        })),
      },
    },
  });
}

/** Loads an attempt only if it belongs to this learner (SPEC §16 criterion 13). */
export async function getOwnAttempt(userId: string, attemptId: string) {
  return db.assessmentAttempt.findFirst({
    where: { id: attemptId, userId },
    include: { assessment: { include: { module: { include: { pathway: true } } } }, answers: { orderBy: { position: "asc" } } },
  });
}

export async function submitAttempt(userId: string, attemptId: string, responses: Record<string, QuestionResponse>) {
  const attempt = await getOwnAttempt(userId, attemptId);
  if (!attempt) throw new AssessmentError("Attempt not found.");
  if (attempt.submittedAt) return attempt;

  const items = attempt.answers.map((a) => ({
    answer: a,
    snapshot: a.snapshot as unknown as QuestionSnapshot,
    response: responses[a.id] ?? null,
  }));
  const score = scoreAttempt(items, attempt.passMarkAtStart);
  const now = new Date();

  await db.$transaction(async (tx) => {
    for (const [i, item] of items.entries()) {
      await tx.attemptAnswer.update({
        where: { id: item.answer.id },
        data: { response: item.response ?? [], correct: score.results[i] },
      });
    }
    await tx.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { submittedAt: now, scorePercent: score.scorePercent, passed: score.passed },
    });
    const status = await tx.assessmentStatus.findUnique({
      where: { userId_assessmentId: { userId, assessmentId: attempt.assessmentId } },
    });
    await tx.assessmentStatus.upsert({
      where: { userId_assessmentId: { userId, assessmentId: attempt.assessmentId } },
      create: {
        userId,
        assessmentId: attempt.assessmentId,
        bestScore: score.scorePercent,
        attemptsCount: 1,
        passedAt: score.passed ? now : null,
      },
      update: {
        bestScore: Math.max(status?.bestScore ?? 0, score.scorePercent),
        attemptsCount: { increment: 1 },
        passedAt: status?.passedAt ?? (score.passed ? now : null),
      },
    });
  });

  const questions = await db.question.findMany({
    where: { id: { in: items.map((i) => i.answer.questionId) } },
    select: { id: true, isKey: true },
  });
  const keyIds = new Set(questions.filter((q) => q.isKey).map((q) => q.id));
  for (const [i, item] of items.entries()) {
    await recordForReview(userId, item.answer.questionId, score.results[i], keyIds.has(item.answer.questionId), now);
  }
  return attempt;
}
