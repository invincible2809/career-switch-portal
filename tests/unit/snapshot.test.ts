import { describe, expect, it } from "vitest";
import { toPublic, toSnapshot, type QuestionRow } from "@/lib/assessment/snapshot";

const row = (over: Partial<QuestionRow> = {}): QuestionRow => ({
  id: "q1",
  key: "k1",
  version: 1,
  type: "SINGLE",
  scenario: null,
  stem: "Which?",
  options: ["a", "b", "c", "d"].map((id) => ({ id, text: id.toUpperCase(), correct: id === "a", explanation: `why ${id}` })),
  correctOrder: [],
  objective: "o",
  lessonSlug: "l",
  sectionKey: "explanation",
  generator: null,
  generatorParams: null,
  ...over,
});

describe("toSnapshot", () => {
  it("shuffles authored options so the right answer isn't always first, keeping ids", () => {
    const firstIds = new Set(Array.from({ length: 40 }, (_, seed) => toSnapshot(row(), seed).options[0].id));
    expect(firstIds.size).toBeGreaterThan(1);
    const s = toSnapshot(row(), 3);
    expect(s.options.map((o) => o.id).sort()).toEqual(["a", "b", "c", "d"]);
    expect(s.options.find((o) => o.id === "a")?.correct).toBe(true);
  });
  it("is the same for the same seed", () => {
    expect(toSnapshot(row(), 11)).toEqual(toSnapshot(row(), 11));
  });
  it("keeps ordering questions in their authored order", () => {
    const q = row({ type: "ORDER", correctOrder: ["c", "a", "d", "b"] });
    expect(toSnapshot(q, 5).options.map((o) => o.id)).toEqual(["a", "b", "c", "d"]);
  });
  it("sends no answers or explanations to the browser", () => {
    expect(JSON.stringify(toPublic(toSnapshot(row(), 1)))).not.toMatch(/correct|why /);
  });
});
