import { describe, expect, it } from "vitest";
import { recommend, summariseDiagnostic } from "@/lib/onboarding/recommend";

const strong = { tech: 1, logic: 1, detail: 1, leans: { SCRUM_MASTER: 0, QA_TESTER: 3 } };
const people = { tech: 0.3, logic: 0.5, detail: 0.3, leans: { SCRUM_MASTER: 3, QA_TESTER: 0 } };

describe("summariseDiagnostic", () => {
  it("scores tags and counts leans, ignoring preference questions in scores", () => {
    const s = summariseDiagnostic([
      { tags: ["tech"], correct: true },
      { tags: ["tech"], correct: false },
      { tags: ["detail"], correct: true },
      { tags: ["preference"], correct: null, lean: "SCRUM_MASTER" },
    ]);
    expect(s).toEqual({ tech: 0.5, logic: 0, detail: 1, leans: { SCRUM_MASTER: 1, QA_TESTER: 0 } });
  });
});

describe("recommend", () => {
  it("only suggests skipping Foundations when results and confidence are both high", () => {
    expect(recommend({ preference: "QA_TESTER", techConfidence: 5, industry: null, diagnostic: strong }).startingPoint).toBe("MODULE_1");
    expect(recommend({ preference: "QA_TESTER", techConfidence: 2, industry: null, diagnostic: strong }).startingPoint).toBe("FOUNDATIONS");
    expect(recommend({ preference: "QA_TESTER", techConfidence: 5, industry: null, diagnostic: people }).startingPoint).toBe("FOUNDATIONS");
  });

  it("respects a stated preference and notes when answers suggest the other role", () => {
    const r = recommend({ preference: "SCRUM_MASTER", techConfidence: 3, industry: null, diagnostic: strong });
    expect(r.pathway).toBe("SCRUM_MASTER");
    expect(r.compared).toBe(false);
    expect(r.pathwayReasons.join(" ")).toMatch(/QA Tester/);
  });

  it("chooses for 'help me choose' and always explains why, with an honest note", () => {
    const sm = recommend({ preference: "HELP_ME_CHOOSE", techConfidence: 2, industry: "teaching", diagnostic: people });
    expect(sm).toMatchObject({ pathway: "SCRUM_MASTER", compared: true });
    expect(sm.pathwayReasons.join(" ")).toMatch(/Honest note: Scrum Master jobs often ask for previous delivery/);
    const qa = recommend({ preference: "HELP_ME_CHOOSE", techConfidence: 2, industry: "finance-admin", diagnostic: strong });
    expect(qa.pathway).toBe("QA_TESTER");
    expect(qa.pathwayReasons.join(" ")).toMatch(/no course can guarantee a job/);
  });

  it("puts the transferable skills that suit the chosen role first", () => {
    const r = recommend({ preference: "SCRUM_MASTER", techConfidence: 3, industry: "finance-admin", diagnostic: people });
    expect(r.transferableSkills[0].helpsWith).toContain("SCRUM_MASTER");
    expect(r.transferableSkills.length).toBeGreaterThan(1);
  });

  it("never uses certification wording", () => {
    const text = JSON.stringify(recommend({ preference: "HELP_ME_CHOOSE", techConfidence: 3, industry: "retail", diagnostic: people }));
    expect(text).not.toMatch(/certified|accredited|CSM|PSM|CTFL/);
  });
});
