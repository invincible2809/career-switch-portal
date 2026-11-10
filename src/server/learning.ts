import "server-only";
import { db } from "./db";
import { isUnlocked, type LearnerAchievements, type PrereqRule } from "@/lib/progress/unlock";
import type { LessonSection } from "@/lib/content/lesson-parts";

/** Published, available lessons for a module (coming-soon modules have none). */
export async function publishedLessons(moduleId: string) {
  return db.lesson.findMany({
    where: { moduleId, publishedVersionId: { not: null }, module: { availability: "AVAILABLE", status: "PUBLISHED" } },
    orderBy: { order: "asc" },
    include: { publishedVersion: { select: { id: true, title: true, estimatedMinutes: true, version: true } } },
  });
}

export async function getAchievements(userId: string): Promise<LearnerAchievements> {
  const [modules, progress, statuses, competencies] = await Promise.all([
    db.module.findMany({
      where: { availability: "AVAILABLE", status: "PUBLISHED" },
      select: { id: true, lessons: { where: { publishedVersionId: { not: null } }, select: { id: true } } },
    }),
    db.lessonProgress.findMany({ where: { userId, contentCompletedAt: { not: null } }, select: { lessonId: true } }),
    db.assessmentStatus.findMany({ where: { userId, passedAt: { not: null } }, select: { assessmentId: true } }),
    db.competency.findMany({ where: { userId }, select: { assignmentId: true } }),
  ]);
  const done = new Set(progress.map((p) => p.lessonId));
  return {
    moduleLessons: new Map(
      modules.map((m) => [m.id, { total: m.lessons.length, completed: m.lessons.filter((l) => done.has(l.id)).length }]),
    ),
    passedAssessments: new Set(statuses.map((s) => s.assessmentId)),
    competentAssignments: new Set(competencies.map((c) => c.assignmentId)),
  };
}

async function describeRules(rows: { requirement: PrereqRule["requirement"]; requiredId: string }[]): Promise<PrereqRule[]> {
  return Promise.all(
    rows.map(async (r) => {
      let label = "Complete an earlier step";
      if (r.requirement === "LESSONS_COMPLETED") {
        const m = await db.module.findUnique({ where: { id: r.requiredId }, select: { title: true } });
        label = `Finish all lessons in ${m?.title ?? "the module"}`;
      } else if (r.requirement === "ASSESSMENT_PASSED") {
        const a = await db.assessment.findUnique({ where: { id: r.requiredId }, select: { title: true } });
        label = `Pass ${a?.title ?? "the assessment"}`;
      } else {
        const a = await db.assignment.findUnique({ where: { id: r.requiredId }, select: { title: true } });
        label = `Show competency in ${a?.title ?? "the assignment"}`;
      }
      return { requirement: r.requirement, requiredId: r.requiredId, label };
    }),
  );
}

export async function unlockState(targetType: "ASSESSMENT" | "ASSIGNMENT" | "MODULE", targetId: string, userId: string) {
  const rows = await db.prerequisite.findMany({ where: { targetType, targetId } });
  const rules = await describeRules(rows);
  return isUnlocked(rules, await getAchievements(userId));
}

export function lessonSections(version: { sections: unknown }): LessonSection[] {
  return version.sections as LessonSection[];
}

export async function getPublishedLesson(slug: string) {
  const lesson = await db.lesson.findUnique({
    where: { slug },
    include: { publishedVersion: true, module: { include: { pathway: true } } },
  });
  if (!lesson?.publishedVersion || lesson.module.availability !== "AVAILABLE" || lesson.module.status !== "PUBLISHED") return null;
  return { ...lesson, publishedVersion: lesson.publishedVersion };
}

/** The lesson a learner should open next: an unfinished lesson they've started, else the first unfinished one. */
export async function nextLessonFor(userId: string, pathwayIds: string[]) {
  const lessons = await db.lesson.findMany({
    where: {
      publishedVersionId: { not: null },
      module: { availability: "AVAILABLE", status: "PUBLISHED", pathwayId: { in: pathwayIds } },
    },
    include: {
      publishedVersion: { select: { title: true, estimatedMinutes: true } },
      module: { select: { order: true, title: true, pathwayId: true } },
      progress: { where: { userId } },
    },
  });
  lessons.sort(
    (a, b) =>
      pathwayIds.indexOf(a.module.pathwayId) - pathwayIds.indexOf(b.module.pathwayId) ||
      a.module.order - b.module.order ||
      a.order - b.order,
  );
  const started = lessons.find((l) => l.progress[0] && !l.progress[0].contentCompletedAt);
  const unfinished = lessons.filter((l) => !l.progress[0]?.contentCompletedAt);
  return { next: started ?? unfinished[0] ?? null, unfinished };
}
