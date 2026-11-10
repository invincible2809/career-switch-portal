import type { QuestionResponse, QuestionSnapshot } from "./types";

/** All-or-nothing marking for every question type (PLAN A6). */
export function isCorrect(q: QuestionSnapshot, response: QuestionResponse | null | undefined): boolean {
  if (!response || response.length === 0) return false;
  switch (q.type) {
    case "SINGLE":
    case "SCENARIO": {
      if (response.length !== 1) return false;
      return q.options.some((o) => o.id === response[0] && o.correct);
    }
    case "MULTI": {
      const correct = new Set(q.options.filter((o) => o.correct).map((o) => o.id));
      const given = new Set(response);
      if (given.size !== response.length || given.size !== correct.size) return false;
      return [...given].every((id) => correct.has(id));
    }
    case "ORDER": {
      if (response.length !== q.correctOrder.length) return false;
      return q.correctOrder.every((id, i) => response[i] === id);
    }
  }
}

export interface AttemptScore {
  correctCount: number;
  total: number;
  scorePercent: number;
  passed: boolean;
}

export function scoreAttempt(
  items: { snapshot: QuestionSnapshot; response: QuestionResponse | null }[],
  passMark: number,
): AttemptScore & { results: boolean[] } {
  const results = items.map((i) => isCorrect(i.snapshot, i.response));
  const correctCount = results.filter(Boolean).length;
  const total = items.length;
  const scorePercent = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  return { correctCount, total, scorePercent, passed: scorePercent >= passMark, results };
}
