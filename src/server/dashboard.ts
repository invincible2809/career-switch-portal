import "server-only";
import { db } from "./db";
import { nextLessonFor } from "./learning";
import { buildStudyPlan, type PlanCandidate } from "@/lib/study-plan";

export async function getDashboard(userId: string, activePathwayId: string | null, weeklyMinutes: number) {
  const shared = await db.pathway.findMany({ where: { kind: "SHARED", status: "PUBLISHED" }, select: { id: true } });
  const pathwayIds = [...shared.map((p) => p.id), ...(activePathwayId ? [activePathwayId] : [])];

  const [activePathway, modules, attempts, reviewDue, noteCount, bookmarkCount, competencies, lessonsNext] = await Promise.all([
    activePathwayId ? db.pathway.findUnique({ where: { id: activePathwayId } }) : null,
    db.module.findMany({
      where: { pathwayId: { in: pathwayIds }, status: "PUBLISHED" },
      orderBy: [{ pathway: { order: "asc" } }, { order: "asc" }],
      include: {
        pathway: { select: { slug: true, title: true } },
        lessons: { where: { publishedVersionId: { not: null } }, select: { id: true, progress: { where: { userId } } } },
        assessments: {
          where: { status: "PUBLISHED" },
          select: { id: true, slug: true, title: true, statuses: { where: { userId } } },
        },
        assignments: { where: { status: "PUBLISHED" }, select: { id: true, competencies: { where: { userId } } } },
      },
    }),
    db.assessmentAttempt.findMany({
      where: { userId, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      take: 10,
      include: { assessment: { select: { title: true, slug: true } } },
    }),
    db.reviewItem.count({ where: { userId, retiredAt: null, dueAt: { lte: new Date() } } }),
    db.note.count({ where: { userId } }),
    db.bookmark.count({ where: { userId } }),
    db.competency.count({ where: { userId } }),
    nextLessonFor(userId, pathwayIds),
  ]);

  const moduleProgress = modules.map((m) => {
    const total = m.lessons.length;
    const completed = m.lessons.filter((l) => l.progress[0]?.contentCompletedAt).length;
    return {
      id: m.id,
      slug: m.slug,
      title: m.title,
      pathwaySlug: m.pathway.slug,
      pathwayTitle: m.pathway.title,
      comingSoon: m.availability === "COMING_SOON",
      lessons: { total, completed },
      assessments: m.assessments.map((a) => ({
        slug: a.slug,
        title: a.title,
        bestScore: a.statuses[0]?.bestScore ?? null,
        passed: !!a.statuses[0]?.passedAt,
      })),
      competency: { total: m.assignments.length, demonstrated: m.assignments.filter((a) => a.competencies.length > 0).length },
    };
  });

  const upcoming: PlanCandidate[] = [];
  if (reviewDue > 0) upcoming.push({ kind: "review", title: `Quick review (${reviewDue} question${reviewDue === 1 ? "" : "s"})`, href: "/review", minutes: 5 });
  for (const l of lessonsNext.unfinished) {
    upcoming.push({ kind: "lesson", title: l.publishedVersion?.title ?? l.slug, href: `/learn/${l.slug}`, minutes: l.publishedVersion?.estimatedMinutes ?? 15 });
  }
  for (const m of moduleProgress) {
    if (m.lessons.total > 0 && m.lessons.completed === m.lessons.total) {
      for (const a of m.assessments) if (!a.passed) upcoming.push({ kind: "assessment", title: a.title, href: `/assessments/${a.slug}`, minutes: 20 });
    }
  }

  // "Continue": an assessment that's ready beats starting a new module; otherwise the next lesson.
  const readyAssessment = upcoming.find((u) => u.kind === "assessment");
  const next = lessonsNext.next;
  const continueItem = next
    ? {
        href: `/learn/${next.slug}`,
        label: next.progress[0] ? `Continue: ${next.publishedVersion?.title}` : `Start: ${next.publishedVersion?.title}`,
        detail: `${next.module.title} · about ${next.publishedVersion?.estimatedMinutes} minutes`,
      }
    : readyAssessment
      ? { href: readyAssessment.href, label: `Take: ${readyAssessment.title}`, detail: "You've finished the lessons in this module." }
      : null;

  return {
    activePathway,
    moduleProgress,
    attempts,
    reviewDue,
    noteCount,
    bookmarkCount,
    competencies,
    continueItem,
    plan: buildStudyPlan(weeklyMinutes, upcoming),
  };
}
