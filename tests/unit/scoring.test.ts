import { describe, expect, it } from "vitest";
import { isCorrect, scoreAttempt } from "@/lib/assessment/scoring";
import type { QuestionSnapshot } from "@/lib/assessment/types";

const base = { questionId: "q", key: "k", version: 1, objective: "o", lessonRef: { lessonSlug: "l", sectionKey: "explanation" }, correctOrder: [] as string[] };
const opt = (id: string, correct = false) => ({ id, text: id, correct, explanation: `why ${id}` });

const single: QuestionSnapshot = { ...base, type: "SINGLE", stem: "s", options: [opt("a", true), opt("b"), opt("c")] };
const multi: QuestionSnapshot = { ...base, type: "MULTI", stem: "m", options: [opt("a", true), opt("b", true), opt("c")] };
const order: QuestionSnapshot = { ...base, type: "ORDER", stem: "o", options: [opt("a"), opt("b"), opt("c")], correctOrder: ["b", "c", "a"] };

describe("isCorrect", () => {
  it("marks single choice", () => {
    expect(isCorrect(single, ["a"])).toBe(true);
    expect(isCorrect(single, ["b"])).toBe(false);
    expect(isCorrect(single, ["a", "b"])).toBe(false);
    expect(isCorrect(single, [])).toBe(false);
    expect(isCorrect(single, null)).toBe(false);
  });
  it("marks multiple select all-or-nothing", () => {
    expect(isCorrect(multi, ["b", "a"])).toBe(true);
    expect(isCorrect(multi, ["a"])).toBe(false);
    expect(isCorrect(multi, ["a", "b", "c"])).toBe(false);
    expect(isCorrect(multi, ["a", "a"])).toBe(false);
  });
  it("marks ordering", () => {
    expect(isCorrect(order, ["b", "c", "a"])).toBe(true);
    expect(isCorrect(order, ["a", "b", "c"])).toBe(false);
    expect(isCorrect(order, ["b", "c"])).toBe(false);
  });
});

describe("scoreAttempt", () => {
  it("rounds the percentage and applies the pass mark", () => {
    const items = [
      { snapshot: single, response: ["a"] },
      { snapshot: multi, response: ["a", "b"] },
      { snapshot: order, response: ["a"] },
    ];
    const s = scoreAttempt(items, 80);
    expect(s).toMatchObject({ correctCount: 2, total: 3, scorePercent: 67, passed: false, results: [true, true, false] });
    expect(scoreAttempt(items, 60).passed).toBe(true);
  });
  it("passes exactly at the pass mark", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ snapshot: single, response: i < 8 ? ["a"] : ["b"] }));
    expect(scoreAttempt(items, 80)).toMatchObject({ scorePercent: 80, passed: true });
  });
});
