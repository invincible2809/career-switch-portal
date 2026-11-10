import { describe, expect, it } from "vitest";
import { boundaryCoverage, defectsIdentified, impedimentLogComplete, matchDefects, retroPlanStructure, testCasesComplete } from "@/lib/assignments/checks";
import { evaluateRubric } from "@/lib/assignments/evaluate";
import type { QaCheckout, ScrumRetroPlan } from "@/lib/assignments/forms";
import { readRows } from "@/lib/assignments/forms";
import { SESSION_LOG } from "@/lib/assignments/qa-session-log";
import { QA_KNOWN_DEFECTS } from "@/server/assignments/qa-known-defects";

const imp = (n: number, over = {}) =>
  Array.from({ length: n }, (_, i) => ({ impediment: `Blocker ${i}`, impact: "Work not finished", owner: "Team", nextStep: "Talk to PO", status: "Open" as const, ...over }));
const retro = (minutes: number[], stages = ["set-the-stage", "gather-data", "generate-insights", "decide-what-to-do", "close"]) =>
  stages.map((stage, i) => ({ stage, activity: `Activity ${i}`, minutes: minutes[i] ?? 0, purpose: "why" }));
const sm = (o: Partial<ScrumRetroPlan> = {}): ScrumRetroPlan => ({
  diagnosis: "x".repeat(60),
  impediments: imp(3),
  retroGoal: "Understand why work keeps spilling over",
  retroRows: retro([5, 15, 20, 15, 5]),
  ...o,
});

describe("impedimentLogComplete", () => {
  it("scores 3 for three complete entries", () => expect(impedimentLogComplete(sm()).score).toBe(3));
  it("scores lower and explains what's missing", () => {
    const r = impedimentLogComplete(sm({ impediments: [...imp(2), ...imp(1, { owner: "" })] }));
    expect(r.score).toBe(1);
    expect(r.feedback.join(" ")).toMatch(/Entry 3 is missing an owner/);
  });
  it("needs at least three", () => expect(impedimentLogComplete(sm({ impediments: imp(2) })).score).toBe(1));
});

describe("retroPlanStructure", () => {
  it("scores 3 for 60 minutes, all five stages and a goal", () => expect(retroPlanStructure(sm()).score).toBe(3));
  it("drops when timings don't add up or stages are missing", () => {
    expect(retroPlanStructure(sm({ retroRows: retro([5, 15, 20, 15, 10]) })).score).toBe(2);
    expect(retroPlanStructure(sm({ retroRows: retro([10, 20, 30], ["set-the-stage", "gather-data", "close"]) })).score).toBe(1);
    expect(retroPlanStructure(sm({ retroGoal: "" })).score).toBe(1);
  });
});

const tc = (field: string, testData: string, technique = "BVA") => ({ title: `Check ${testData}`, field, technique, testData, steps: "Enter it and press update", expected: "As per spec" }) as QaCheckout["testCases"][number];
const goodCases = [tc("quantity", "0"), tc("quantity", "1"), tc("quantity", "10"), tc("quantity", "11"), tc("delivery", "£49.99 then £50"), tc("discount", "19.99 and 20.00")];
const report = (logEntry: number, expected: string, actual: string) =>
  ({ logEntry, title: "Bug", environment: "Chrome", steps: "Do the thing then check", expected, actual, severity: "High", priority: "High", evidence: "" }) as QaCheckout["defects"][number];

describe("QA checks", () => {
  it("test case completeness", () => {
    expect(testCasesComplete({ testCases: goodCases, defects: [] }).score).toBe(3);
    expect(testCasesComplete({ testCases: goodCases.slice(0, 4), defects: [] }).score).toBe(1);
  });
  it("boundary coverage accepts £ signs and 50 for 50.00, and names what's missing", () => {
    expect(boundaryCoverage({ testCases: goodCases, defects: [] }).score).toBe(3);
    const r = boundaryCoverage({ testCases: goodCases.filter((t) => t.field !== "quantity" || t.testData !== "11"), defects: [] });
    expect(r.score).toBe(2);
    expect(r.feedback.join(" ")).toMatch(/missing 11/);
  });
  it("matches defect reports to the session log", () => {
    const p: QaCheckout = {
      testCases: goodCases,
      defects: [
        report(1, "Quantity 0 should be rejected with a message", "Quantity 0 was accepted"),
        report(5, "Delivery should be free at £50.00", "£3.95 delivery was charged"),
        report(4, "No delivery", "Delivery charged"), // entry 4 is correct behaviour
        report(7, "", ""), // real defect but not described
      ],
    };
    const m = matchDefects(p, QA_KNOWN_DEFECTS, SESSION_LOG.length);
    expect(m.matches.map((x) => x.result)).toEqual(["found", "found", "not a defect", "partly described"]);
    expect(m.missed.map((d) => d.key)).toEqual(["discount-twice", "postcode-label"]);
    expect(defectsIdentified(p, QA_KNOWN_DEFECTS, SESSION_LOG.length).score).toBe(2);
  });
  it("every known defect points at a real log entry", () => {
    for (const d of QA_KNOWN_DEFECTS) expect(SESSION_LOG.some((e) => e.n === d.logEntry)).toBe(true);
  });
});

describe("evaluateRubric", () => {
  const t = (s: number) => new Date(2026, 0, 1, 0, 0, s);
  const ids = ["a", "b", "c"];
  it("never counts self-assessment", () => {
    const e = evaluateRubric(ids, ids.map((id) => ({ criterionId: id, score: 3, source: "SELF" as const, createdAt: t(1) })), { minEach: 2 });
    expect(e).toMatchObject({ complete: false, met: false, awaiting: ids });
  });
  it("waits for an assessor on judgement criteria", () => {
    const e = evaluateRubric(ids, [{ criterionId: "a", score: 3, source: "AUTOMATED", createdAt: t(1) }], { minEach: 2 });
    expect(e.awaiting).toEqual(["b", "c"]);
    expect(e.met).toBe(false);
  });
  it("lets an assessor override an automated score, and applies the minimum", () => {
    const scores = [
      { criterionId: "a", score: 1, source: "AUTOMATED" as const, createdAt: t(1) },
      { criterionId: "a", score: 2, source: "ASSESSOR" as const, createdAt: t(2) },
      { criterionId: "b", score: 3, source: "ASSESSOR" as const, createdAt: t(2) },
      { criterionId: "c", score: 2, source: "ASSESSOR" as const, createdAt: t(2) },
    ];
    const e = evaluateRubric(ids, scores, { minEach: 2 });
    expect(e).toMatchObject({ complete: true, met: true, assessedBy: "ASSESSOR" });
    const low = evaluateRubric(ids, [...scores, { criterionId: "c", score: 1, source: "ASSESSOR" as const, createdAt: t(3) }], { minEach: 2 });
    expect(low).toMatchObject({ met: false, below: ["c"] });
  });
});

describe("readRows", () => {
  it("drops empty rows but keeps rows with any text", () => {
    const rows = readRows({ r_0_title: "A", r_0_field: "quantity", r_1_title: "", r_1_field: "quantity", r_2_title: "", r_2_steps: "x" }, "r", ["title", "field", "steps"], 4);
    expect(rows).toHaveLength(2);
  });
});
