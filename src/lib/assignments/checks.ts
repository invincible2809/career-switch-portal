// Automated rubric checks (PLAN §8.1 Q1). Each returns a 0–3 score and plain-English feedback.
// They check structure and coverage only; judgement criteria are scored by an assessor.
import type { QaCheckout, ScrumRetroPlan } from "./forms";
import { RETRO_STAGES } from "./forms";

export interface CheckResult {
  score: 0 | 1 | 2 | 3;
  feedback: string[];
}

const filled = (s: string | number | undefined, min = 3) => typeof s === "number" ? s > 0 : (s ?? "").trim().length >= min;

// ---------- Scrum Master: impediment log ----------
export function impedimentLogComplete(p: ScrumRetroPlan): CheckResult {
  const rows = p.impediments;
  const complete = rows.filter((r) => filled(r.impediment) && filled(r.impact) && filled(r.owner, 2) && filled(r.nextStep) && r.status !== "");
  const feedback: string[] = [`${rows.length} impediment${rows.length === 1 ? "" : "s"} logged, ${complete.length} with every field filled in.`];
  rows.forEach((r, i) => {
    const missing = [
      !filled(r.impediment) && "the impediment",
      !filled(r.impact) && "its impact",
      !filled(r.owner, 2) && "an owner",
      !filled(r.nextStep) && "a next step",
      r.status === "" && "a status",
    ].filter(Boolean);
    if (missing.length) feedback.push(`Entry ${i + 1} is missing ${missing.join(", ")}.`);
  });
  const score = rows.length >= 3 && complete.length === rows.length ? 3 : complete.length >= 3 ? 2 : complete.length === 2 ? 1 : 0;
  if (score < 3 && rows.length < 3) feedback.push("The brief asks for at least three impediments.");
  return { score, feedback };
}

// ---------- Scrum Master: retrospective structure ----------
export function retroPlanStructure(p: ScrumRetroPlan): CheckResult {
  const total = p.retroRows.reduce((s, r) => s + (r.minutes || 0), 0);
  const stages = new Set(p.retroRows.filter((r) => r.stage && filled(r.activity)).map((r) => r.stage));
  const missingStages = RETRO_STAGES.filter((s) => !stages.has(s.key)).map((s) => s.label);
  const hasGoal = filled(p.retroGoal, 10);
  const feedback = [
    `Your plan adds up to ${total} minutes (the brief asks for 60).`,
    missingStages.length ? `Stages not covered: ${missingStages.join(", ")}.` : "All five stages are covered.",
    hasGoal ? "The retrospective has a stated goal." : "Add a goal for the retrospective, so everyone knows what it's for.",
  ];
  const score =
    total === 60 && missingStages.length === 0 && hasGoal ? 3
    : total >= 55 && total <= 65 && missingStages.length <= 1 && hasGoal ? 2
    : total >= 45 && total <= 75 && stages.size >= 3 ? 1
    : 0;
  return { score, feedback };
}

// ---------- QA: test case completeness ----------
export function testCasesComplete(p: QaCheckout): CheckResult {
  const rows = p.testCases;
  const complete = rows.filter((r) => filled(r.title) && r.field !== "" && r.technique !== "" && filled(r.testData, 1) && filled(r.steps) && filled(r.expected));
  const feedback = [`${rows.length} test case${rows.length === 1 ? "" : "s"}, ${complete.length} with every field filled in.`];
  rows.forEach((r, i) => {
    const missing = [
      !filled(r.title) && "a title",
      r.field === "" && "the field under test",
      r.technique === "" && "the technique",
      !filled(r.testData, 1) && "test data",
      !filled(r.steps) && "steps",
      !filled(r.expected) && "an expected result",
    ].filter(Boolean);
    if (missing.length) feedback.push(`Test case ${i + 1} is missing ${missing.join(", ")}.`);
  });
  const score = complete.length >= 6 && complete.length === rows.length ? 3 : complete.length >= 6 ? 2 : complete.length >= 4 ? 1 : 0;
  if (complete.length < 6) feedback.push("The brief asks for at least six complete test cases.");
  return { score, feedback };
}

// ---------- QA: boundary coverage ----------
// The written checkout spec has three numeric boundaries; two-value BVA tests each side of each edge.
export const BOUNDARY_SETS = [
  { field: "quantity", label: "item quantity (1 to 10)", values: ["0", "1", "10", "11"] },
  { field: "delivery", label: "free delivery threshold (£50.00)", values: ["49.99", "50.00"] },
  { field: "discount", label: "SAVE10 minimum spend (£20.00)", values: ["19.99", "20.00"] },
] as const;

function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:\.\d{1,2})?/g) ?? []).map((n) => (n.includes(".") ? Number(n).toFixed(2) : String(Number(n))));
}

export function boundaryCoverage(p: QaCheckout): CheckResult {
  const feedback: string[] = [];
  let covered = 0;
  for (const set of BOUNDARY_SETS) {
    const values = new Set(p.testCases.filter((t) => t.field === set.field).flatMap((t) => numbersIn(`${t.testData} ${t.steps}`)));
    // Accept "50" for "50.00" etc.
    const has = (v: string) => values.has(v) || values.has(String(Number(v))) || values.has(Number(v).toFixed(2));
    const missing = set.values.filter((v) => !has(v));
    if (missing.length === 0) {
      covered++;
      feedback.push(`Boundaries of the ${set.label}: all covered.`);
    } else {
      feedback.push(`Boundaries of the ${set.label}: missing ${missing.join(", ")}.`);
    }
  }
  return { score: covered as 0 | 1 | 2 | 3, feedback };
}

// ---------- QA: defects identified (against the known defects in the session log) ----------
export interface KnownDefect {
  key: string;
  logEntry: number;
  summary: string;
  /** Words a good report's actual/expected results should mention (any one per group). */
  keyTerms: string[][];
}

export interface DefectMatch {
  reportIndex: number;
  result: "found" | "partly described" | "not a defect" | "duplicate" | "not linked";
  defectKey?: string;
  note: string;
}

export function matchDefects(p: QaCheckout, known: readonly KnownDefect[], logEntries: number) {
  const matches: DefectMatch[] = [];
  const foundKeys = new Set<string>();
  p.defects.forEach((d, i) => {
    const k = known.find((x) => x.logEntry === d.logEntry);
    if (!d.logEntry || d.logEntry > logEntries) {
      matches.push({ reportIndex: i, result: "not linked", note: "add the log entry number so this report can be checked." });
    } else if (!k) {
      matches.push({ reportIndex: i, result: "not a defect", note: `log entry ${d.logEntry} shows the checkout working as the specification says, so it isn't a defect.` });
    } else if (foundKeys.has(k.key)) {
      matches.push({ reportIndex: i, result: "duplicate", defectKey: k.key, note: `another report already covers log entry ${d.logEntry}.` });
    } else {
      const body = `${d.title} ${d.expected} ${d.actual}`.toLowerCase();
      const described = k.keyTerms.every((group) => group.some((t) => body.includes(t.toLowerCase())));
      const complete = filled(d.steps) && filled(d.expected) && filled(d.actual) && d.severity !== "" && d.priority !== "";
      foundKeys.add(k.key);
      matches.push({
        reportIndex: i,
        result: described && complete ? "found" : "partly described",
        defectKey: k.key,
        note: described && complete ? "a real defect, clearly described." : "a real defect, but the report doesn't yet say clearly what was expected and what actually happened, or is missing severity or priority.",
      });
    }
  });
  const found = matches.filter((m) => m.result === "found").length;
  const partly = matches.filter((m) => m.result === "partly described").length;
  return { matches, found, partly, missed: known.filter((k) => !foundKeys.has(k.key)) };
}

export function defectsIdentified(p: QaCheckout, known: readonly KnownDefect[], logEntries: number): CheckResult {
  const r = matchDefects(p, known, logEntries);
  const score = r.found >= 3 ? 3 : r.found + r.partly >= 3 ? 2 : r.found + r.partly === 2 ? 1 : 0;
  const feedback = [
    `${r.found} defect${r.found === 1 ? "" : "s"} clearly reported, ${r.partly} partly described.`,
    ...r.matches.map((m) => `Report ${m.reportIndex + 1}: ${m.result} – ${m.note}`),
  ];
  return { score, feedback };
}
