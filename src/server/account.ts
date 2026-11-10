import "server-only";
import { db } from "./db";

/** Everything stored about a learner, for "Download your data" (UK GDPR right of access). */
export async function exportUserData(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
      profile: true,
      accessibility: true,
      diagnosticAttempts: { select: { answers: true, result: true, createdAt: true } },
      lessonProgress: { select: { lesson: { select: { slug: true } }, lastSectionKey: true, startedAt: true, contentCompletedAt: true } },
      attempts: {
        select: {
          assessment: { select: { slug: true, title: true } },
          startedAt: true,
          submittedAt: true,
          scorePercent: true,
          passed: true,
          passMarkAtStart: true,
          answers: { select: { position: true, snapshot: true, response: true, correct: true }, orderBy: { position: "asc" } },
        },
      },
      assessmentStatuses: { select: { assessment: { select: { slug: true } }, bestScore: true, attemptsCount: true, passedAt: true } },
      reviewItems: { select: { question: { select: { key: true } }, stage: true, dueAt: true, retiredAt: true } },
      notes: { select: { lesson: { select: { slug: true } }, sectionKey: true, body: true, createdAt: true } },
      bookmarks: { select: { lesson: { select: { slug: true } }, sectionKey: true, createdAt: true } },
      submissions: { select: { assignment: { select: { slug: true } }, payload: true, submittedAt: true, scores: true } },
      competencies: { select: { assignment: { select: { slug: true } }, demonstratedAt: true, assessedBy: true } },
      portfolioItems: true,
      certificates: { select: { verificationId: true, snapshot: true, issuedAt: true } },
      portfolioShares: { select: { enabled: true, createdAt: true, revokedAt: true } },
      skillsStatement: { select: { body: true, updatedAt: true } },
      flagsRaised: { select: { kind: true, reason: true, status: true, createdAt: true } },
      coachMessages: { select: { threadId: true, role: true, content: true, createdAt: true } },
      labTestCases: true,
      defectReports: true,
    },
  });
  return { exportedAt: new Date().toISOString(), note: "All the data Career Switch Portal holds about you.", ...user };
}

/** Hard delete (PLAN A18). Learner-owned rows cascade; audit rows keep the action with no user link. */
export async function deleteAccount(userId: string) {
  await db.user.delete({ where: { id: userId } });
}
