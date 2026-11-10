import { describe, expect, it } from "vitest";
import { isUnlocked, type LearnerAchievements } from "@/lib/progress/unlock";

const state = (o: Partial<LearnerAchievements> = {}): LearnerAchievements => ({
  moduleLessons: new Map([["m1", { total: 3, completed: 3 }], ["m2", { total: 2, completed: 1 }], ["empty", { total: 0, completed: 0 }]]),
  passedAssessments: new Set(["a1"]),
  competentAssignments: new Set(),
  ...o,
});

describe("isUnlocked", () => {
  it("is unlocked with no rules", () => {
    expect(isUnlocked([], state()).unlocked).toBe(true);
  });
  it("checks lessons completed per module", () => {
    expect(isUnlocked([{ requirement: "LESSONS_COMPLETED", requiredId: "m1", label: "" }], state()).unlocked).toBe(true);
    const r = isUnlocked([{ requirement: "LESSONS_COMPLETED", requiredId: "m2", label: "Finish m2" }], state());
    expect(r.unlocked).toBe(false);
    expect(r.missing.map((m) => m.label)).toEqual(["Finish m2"]);
  });
  it("treats a module with no lessons as not completed", () => {
    expect(isUnlocked([{ requirement: "LESSONS_COMPLETED", requiredId: "empty", label: "" }], state()).unlocked).toBe(false);
  });
  it("checks assessments passed and competency", () => {
    expect(isUnlocked([{ requirement: "ASSESSMENT_PASSED", requiredId: "a1", label: "" }], state()).unlocked).toBe(true);
    expect(isUnlocked([{ requirement: "ASSESSMENT_PASSED", requiredId: "a2", label: "" }], state()).unlocked).toBe(false);
    expect(isUnlocked([{ requirement: "COMPETENCY_DEMONSTRATED", requiredId: "x", label: "" }], state()).unlocked).toBe(false);
    expect(
      isUnlocked([{ requirement: "COMPETENCY_DEMONSTRATED", requiredId: "x", label: "" }], state({ competentAssignments: new Set(["x"]) })).unlocked,
    ).toBe(true);
  });
});
