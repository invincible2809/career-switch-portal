import "server-only";
import { db } from "../db";

/** Aggregate reporting (SPEC §11) – totals across learners, no individual learner data. */
export async function reports() {
  const learners = await db.user.count({ where: { role: "LEARNER" } });
  const modules = await db.module.findMany({
    where: { availability: "AVAILABLE", status: "PUBLISHED" },
    orderBy: [{ pathway: { order: "asc" } }, { order: "asc" }],
    include: {
      pathway: { select: { title: true } },
      lessons: { where: { publishedVersionId: { not: null } }, select: { id: true } },
      assessments: { select: { id: true } },
      assignments: { select: { id: true } },
    },
  });
  const progress = await Promise.all(
    modules.map(async (m) => {
      const lessonIds = m.lessons.map((l) => l.id);
      const started = await db.lessonProgress.groupBy({ by: ["userId"], where: { lessonId: { in: lessonIds }, user: { role: "LEARNER" } } });
      const finishedRows = await db.lessonProgress.groupBy({
        by: ["userId"],
        where: { lessonId: { in: lessonIds }, contentCompletedAt: { not: null }, user: { role: "LEARNER" } },
        _count: { lessonId: true },
      });
      const passed = await db.assessmentStatus.count({ where: { assessmentId: { in: m.assessments.map((a) => a.id) }, passedAt: { not: null }, user: { role: "LEARNER" } } });
      const competent = await db.competency.groupBy({ by: ["userId"], where: { assignmentId: { in: m.assignments.map((a) => a.id) }, user: { role: "LEARNER" } } });
      return {
        module: m.title,
        pathway: m.pathway.title,
        started: started.length,
        finishedLessons: finishedRows.filter((r) => r._count.lessonId >= lessonIds.length && lessonIds.length > 0).length,
        passedAssessment: passed,
        competency: m.assignments.length ? competent.length : null,
      };
    }),
  );

  const mostFailed = await db.$queryRaw<{ key: string; stem: string; bank: string; answered: bigint; wrong: bigint }[]>`
    SELECT a."snapshot"->>'key' AS key,
           MAX(a."snapshot"->>'stem') AS stem,
           MAX(b."title") AS bank,
           COUNT(*) AS answered,
           COUNT(*) FILTER (WHERE a."correct" = false) AS wrong
    FROM "AttemptAnswer" a
    JOIN "AssessmentAttempt" t ON t."id" = a."attemptId"
    JOIN "Question" q ON q."id" = a."questionId"
    JOIN "QuestionBank" b ON b."id" = q."bankId"
    WHERE t."submittedAt" IS NOT NULL
    GROUP BY a."snapshot"->>'key'
    HAVING COUNT(*) >= 3
    ORDER BY (COUNT(*) FILTER (WHERE a."correct" = false))::float / COUNT(*) DESC, COUNT(*) DESC
    LIMIT 10`;

  const gaps = await db.$queryRaw<{ lesson: string; section: string; wrong: bigint; answered: bigint }[]>`
    SELECT a."snapshot"->'lessonRef'->>'lessonSlug' AS lesson,
           a."snapshot"->'lessonRef'->>'sectionKey' AS section,
           COUNT(*) FILTER (WHERE a."correct" = false) AS wrong,
           COUNT(*) AS answered
    FROM "AttemptAnswer" a
    JOIN "AssessmentAttempt" t ON t."id" = a."attemptId"
    WHERE t."submittedAt" IS NOT NULL
    GROUP BY 1, 2
    HAVING COUNT(*) FILTER (WHERE a."correct" = false) > 0
    ORDER BY 3 DESC
    LIMIT 10`;

  return {
    learners,
    progress,
    mostFailed: mostFailed.map((r) => ({ ...r, answered: Number(r.answered), wrong: Number(r.wrong) })),
    gaps: gaps.map((r) => ({ ...r, answered: Number(r.answered), wrong: Number(r.wrong) })),
  };
}
