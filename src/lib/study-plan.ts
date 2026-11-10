// Weekly study plan (SPEC §8): fills the learner's available time with the next lessons.
// Gentle by design: no streaks, no "you're behind" messages.
export interface PlanCandidate {
  kind: "lesson" | "assessment" | "review";
  title: string;
  href: string;
  minutes: number;
}

export interface StudyPlan {
  items: PlanCandidate[];
  plannedMinutes: number;
  weeklyMinutes: number;
  remainingMinutes: number;
  weeksToFinish: number;
  message: string;
}

export function buildStudyPlan(weeklyMinutes: number, upcoming: readonly PlanCandidate[]): StudyPlan {
  const budget = Math.max(15, weeklyMinutes);
  const items: PlanCandidate[] = [];
  let planned = 0;
  for (const c of upcoming) {
    if (items.length > 0 && planned + c.minutes > budget) break;
    items.push(c);
    planned += c.minutes;
  }
  const remainingMinutes = upcoming.reduce((s, c) => s + c.minutes, 0);
  const weeksToFinish = remainingMinutes === 0 ? 0 : Math.ceil(remainingMinutes / budget);
  const message =
    upcoming.length === 0
      ? "You've finished everything that's available right now. Quick review keeps it fresh."
      : `This plan fits about ${budget} minutes. If a week gets busy, pick up where you left off – nothing is lost.`;
  return { items, plannedMinutes: planned, weeklyMinutes: budget, remainingMinutes, weeksToFinish, message };
}
