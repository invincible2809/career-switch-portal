import { describe, expect, it } from "vitest";
import fs from "node:fs";
import YAML from "yaml";
import { bestExcerpt, matchGlossary, plainText, rankSections, type SectionDoc } from "@/lib/coach/retrieve";
import { checkRequest } from "@/lib/coach/guard";
import { tokens } from "@/lib/coach/text";
import { interviewFeedback } from "@/lib/coach/interview";
import { interviewFileSchema, roleplayFileSchema } from "@/lib/coach/schemas";
import { certificateEligibility, certificateLines, verificationId, CERTIFICATE_STATEMENT, type CertificateSnapshot } from "@/lib/certificate/eligibility";
import { guidanceFor } from "@/lib/assignments/guidance";
import { submissionSections, PORTFOLIO_LABEL } from "@/lib/portfolio/format";
import { draftStatement } from "@/lib/career/statement";
import { createRng } from "@/lib/random";

const doc = (lessonSlug: string, sectionKey: string, text: string): SectionDoc => ({ lessonSlug, lessonTitle: lessonSlug, sectionKey, sectionTitle: sectionKey, text });

describe("coach retrieval", () => {
  const docs = [
    doc("events", "explanation", "The Definition of Done is the quality standard every Increment must meet. Work that doesn't meet it isn't part of the Increment."),
    doc("team", "explanation", "The Product Owner orders the Product Backlog. The Scrum Master serves the team."),
    doc("testing", "explanation", "Boundary value analysis tests the edges of a range, such as 0, 1, 10 and 11."),
  ];
  it("ranks the most relevant section first and quotes it", () => {
    const hits = rankSections("What is the Definition of Done?", docs);
    expect(hits[0].doc.lessonSlug).toBe("events");
    expect(hits[0].excerpt).toMatch(/Definition of Done is the quality standard/);
  });
  it("returns nothing for unrelated questions", () => {
    expect(rankSections("recipe for lasagne", docs)).toEqual([]);
  });
  it("finds glossary terms named in the question", () => {
    const terms = [{ slug: "sprint", term: "Sprint", definition: "x" }, { slug: "sprint-goal", term: "Sprint Goal", definition: "y" }];
    expect(matchGlossary("what's a sprint goal?", terms).map((t) => t.slug)).toEqual(["sprint-goal", "sprint"]);
  });
  it("strips markdown for indexing", () => {
    expect(plainText("A [[developer|developers]] **writes** [code](/x)\n:::hint\nThink\n:::")).toBe("A developers writes code Think");
  });
  it("stems simple word forms", () => {
    expect(tokens("testers testing tested")).toEqual(["tester", "test", "test"]);
  });
  it("excerpts never run on forever", () => {
    expect(bestExcerpt("Word ".repeat(200) + ".", ["word"]).split(" ").length).toBeLessThanOrEqual(61);
  });
});

describe("hint-first guard", () => {
  const stems = ["Who can cancel a Sprint, and when?", "What is regression testing for?"];
  it("spots assessed questions", () => {
    expect(checkRequest("who can cancel a sprint and when", stems).kind).toBe("assessed-question");
    expect(checkRequest("What is the Definition of Done?", stems).kind).toBe("ok");
  });
  it("refuses to write assignments or hand over answers", () => {
    expect(checkRequest("Can you write my impediment log for me", []).kind).toBe("assignment-request");
    expect(checkRequest("what's the answer to question 3", []).kind).toBe("assignment-request");
    expect(checkRequest("Explain what an impediment is", []).kind).toBe("ok");
  });
});

describe("coach content files", () => {
  const interview = interviewFileSchema.parse(YAML.parse(fs.readFileSync("content/coach/interview.yaml", "utf8"))).questions;
  const roleplays = roleplayFileSchema.parse(YAML.parse(fs.readFileSync("content/coach/roleplays.yaml", "utf8"))).roleplays;
  it("are valid and every role-play ends", () => {
    expect(interview.length).toBeGreaterThanOrEqual(10);
    for (const rp of roleplays) expect(Object.values(rp.nodes).some((n) => n.choices.length === 0)).toBe(true);
  });
  it("interview feedback reports covered and missing points and STAR parts", () => {
    const q = interview.find((x) => x.id === "qa-severity-priority")!;
    const good = interviewFeedback(q, "Severity is how bad the impact is, priority is how soon it should be fixed. For example, a typo in the company name on the home page is low severity but high priority, so we would fix it first.");
    expect(good.missing).toEqual([]);
    const weak = interviewFeedback(q, "Severity is about impact.");
    expect(weak.covered).toEqual(["Severity is impact"]);
    expect(weak.tips.join(" ")).toMatch(/quite short/);
  });
});

describe("certificate", () => {
  const done = { title: "IT Foundations", lessons: { total: 5, completed: 5 }, assessments: [{ title: "A", passedAt: new Date() }], assignments: [] };
  it("needs every lesson, assessment and competency", () => {
    expect(certificateEligibility([done]).eligible).toBe(true);
    const r = certificateEligibility([done, { title: "Scrum fundamentals", lessons: { total: 3, completed: 2 }, assessments: [{ title: "B", passedAt: null }], assignments: [{ title: "C", demonstratedAt: null }] }]);
    expect(r.eligible).toBe(false);
    expect(r.missing).toEqual(["Finish all lessons in Scrum fundamentals (2 of 3 done)", "Pass B", 'Show competency in "C"']);
  });
  it("has the required statement and never says certified or accredited as an award", () => {
    const s: CertificateSnapshot = { name: "Sam", pathway: "QA Tester", modules: ["IT Foundations"], assessments: [{ title: "A", passedAt: new Date().toISOString() }], competencies: [], issuedAt: new Date().toISOString() };
    const text = certificateLines(s).join(" ");
    expect(text).toContain(CERTIFICATE_STATEMENT);
    expect(text).not.toMatch(/certified/i);
    expect(text.replace(CERTIFICATE_STATEMENT, "")).not.toMatch(/accredited|CSM|PSM|CTFL/);
  });
  it("makes readable verification IDs", () => {
    const rng = createRng(1);
    expect(verificationId(rng)).toMatch(/^CSP-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});

describe("guidance, portfolio and career", () => {
  it("guidance flags a Scrum Master assigning work, but never returns a score", () => {
    const p = { diagnosis: "The team is lazy.", impediments: [{ impediment: "x", impact: "y", owner: "SM", nextStep: "Tell the developers to work faster", status: "Open" }], retroGoal: "", retroRows: [] };
    expect(guidanceFor("scrum-stance", "SCRUM_RETRO_PLAN", p)!.join(" ")).toMatch(/doesn't assign work/);
    expect(guidanceFor("diagnosis", "SCRUM_RETRO_PLAN", p)!.join(" ")).toMatch(/blames individuals/);
    expect(guidanceFor("impediment-log", "SCRUM_RETRO_PLAN", p)).toBeNull();
  });
  it("portfolio sections come from the submission", () => {
    const s = submissionSections("QA_TEST_LAB", { testCases: [{ title: "Qty 0", technique: "BVA", testData: "0", expected: "Rejected", status: "FAIL" }], defects: [] });
    expect(s[0].lines[0]).toMatch(/Qty 0 \(BVA\).*result: fail/);
    expect(PORTFOLIO_LABEL).toBe("Simulated learning project – not paid work experience");
  });
  it("the skills statement draft asks for real examples rather than inventing them", () => {
    const d = draftStatement({ pathway: "QA_TESTER", industry: "finance-admin", previousRoles: ["accounts assistant"] });
    expect(d).toMatch(/my work in roles such as accounts assistant/);
    expect(d).toMatch(/working towards a role/);
    expect(d).toMatch(/\[add a real example/);
  });
});
