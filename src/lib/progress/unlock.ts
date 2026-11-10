// Prerequisite rules for assessed milestones (PLAN A3). Lessons are always open.
export type Requirement = "LESSONS_COMPLETED" | "ASSESSMENT_PASSED" | "COMPETENCY_DEMONSTRATED";

export interface PrereqRule {
  requirement: Requirement;
  requiredId: string; // module id, assessment id or assignment id
  label: string; // learner-facing, e.g. "Finish all lessons in IT Foundations"
}

export interface LearnerAchievements {
  /** moduleId -> lesson counts (only published lessons count) */
  moduleLessons: ReadonlyMap<string, { total: number; completed: number }>;
  passedAssessments: ReadonlySet<string>;
  competentAssignments: ReadonlySet<string>;
}

export function isUnlocked(
  rules: readonly PrereqRule[],
  state: LearnerAchievements,
): { unlocked: boolean; missing: PrereqRule[] } {
  const missing = rules.filter((r) => {
    switch (r.requirement) {
      case "LESSONS_COMPLETED": {
        const m = state.moduleLessons.get(r.requiredId);
        return !m || m.total === 0 || m.completed < m.total;
      }
      case "ASSESSMENT_PASSED":
        return !state.passedAssessments.has(r.requiredId);
      case "COMPETENCY_DEMONSTRATED":
        return !state.competentAssignments.has(r.requiredId);
    }
  });
  return { unlocked: missing.length === 0, missing };
}
