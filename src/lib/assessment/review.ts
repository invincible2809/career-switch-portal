// Spaced review (PLAN A7): roughly 1, 3, 7 and 21 days, then retired.
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 21] as const;
const DAY = 24 * 60 * 60 * 1000;

export interface ReviewState {
  stage: number; // index into REVIEW_INTERVALS_DAYS of the interval that has just been scheduled
  dueAt: Date;
  retired: boolean;
}

/** A question answered wrongly (or marked as key) enters review due in 1 day. */
export function startReview(now: Date): ReviewState {
  return { stage: 0, dueAt: new Date(now.getTime() + REVIEW_INTERVALS_DAYS[0] * DAY), retired: false };
}

/** Result of answering a due review question. Wrong answers go back to 1 day; no penalties beyond that. */
export function nextReview(current: { stage: number }, correct: boolean, now: Date): ReviewState {
  if (!correct) return startReview(now);
  const nextStage = current.stage + 1;
  if (nextStage >= REVIEW_INTERVALS_DAYS.length) {
    return { stage: nextStage, dueAt: now, retired: true };
  }
  return {
    stage: nextStage,
    dueAt: new Date(now.getTime() + REVIEW_INTERVALS_DAYS[nextStage] * DAY),
    retired: false,
  };
}
