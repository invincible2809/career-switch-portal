import { describe, expect, it } from "vitest";
import { buildStudyPlan } from "@/lib/study-plan";
import { neighbours, resolveResumeKey } from "@/lib/lesson/resume";

describe("buildStudyPlan", () => {
  const items = [15, 15, 20, 15].map((m, i) => ({ kind: "lesson" as const, title: `L${i}`, href: `/l${i}`, minutes: m }));
  it("fills the weekly time without going over (but always plans at least one item)", () => {
    expect(buildStudyPlan(30, items).items.map((i) => i.title)).toEqual(["L0", "L1"]);
    expect(buildStudyPlan(10, items).items).toHaveLength(1);
  });
  it("estimates weeks to finish", () => {
    expect(buildStudyPlan(30, items).weeksToFinish).toBe(3);
    expect(buildStudyPlan(60, []).weeksToFinish).toBe(0);
  });
  it("has no guilt messages", () => {
    expect(buildStudyPlan(60, items).message).not.toMatch(/behind|streak|missed/i);
  });
});

describe("resolveResumeKey", () => {
  const keys = ["objective", "explanation", "glossary", "next-step"];
  it("resumes at the saved section", () => expect(resolveResumeKey(keys, "glossary")).toBe("glossary"));
  it("starts at the beginning with nothing saved", () => expect(resolveResumeKey(keys, null)).toBe("objective"));
  it("falls back to the nearest earlier section that still exists", () => {
    expect(resolveResumeKey(keys, "worked-example", ["objective", "explanation", "worked-example", "next-step"])).toBe("explanation");
  });
  it("finds neighbours", () => {
    expect(neighbours(keys, "objective")).toEqual({ prev: null, next: "explanation" });
    expect(neighbours(keys, "next-step")).toEqual({ prev: "glossary", next: null });
  });
});
