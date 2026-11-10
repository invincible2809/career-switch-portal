// Submission payloads for the two practical assignments (SPEC §4, §5). Empty rows are dropped
// before validation, so learners can leave spare rows blank.
import { z } from "zod";

const text = (max = 2000) => z.string().trim().max(max);

export const IMPEDIMENT_STATUSES = ["Open", "In progress", "Resolved"] as const;
// The five-stage retrospective outline (Derby & Larsen) – a common workplace practice, not part of the Scrum Guide.
export const RETRO_STAGES = [
  { key: "set-the-stage", label: "Set the stage" },
  { key: "gather-data", label: "Gather data" },
  { key: "generate-insights", label: "Generate insights" },
  { key: "decide-what-to-do", label: "Decide what to do" },
  { key: "close", label: "Close the retrospective" },
] as const;

export const impedimentSchema = z.object({
  impediment: text(500),
  impact: text(500),
  owner: text(100),
  nextStep: text(500),
  status: z.enum(IMPEDIMENT_STATUSES).or(z.literal("")),
});

export const retroRowSchema = z.object({
  stage: z.enum(RETRO_STAGES.map((s) => s.key) as [string, ...string[]]).or(z.literal("")),
  activity: text(300),
  minutes: z.coerce.number().int().min(0).max(120).catch(0),
  purpose: text(500),
});

export const scrumRetroPlanSchema = z.object({
  diagnosis: text(5000).pipe(z.string().min(50, "Write a diagnosis of at least a few sentences (50+ characters)")),
  impediments: z.array(impedimentSchema).min(1, "Add at least one impediment"),
  retroGoal: text(500),
  retroRows: z.array(retroRowSchema).min(1, "Add at least one part to the retrospective plan"),
});
export type ScrumRetroPlan = z.infer<typeof scrumRetroPlanSchema>;

export const TEST_FIELDS = ["quantity", "discount", "delivery", "postcode", "other"] as const;
export const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;

export const testCaseSchema = z.object({
  title: text(200),
  field: z.enum(TEST_FIELDS).or(z.literal("")),
  technique: z.enum(["EP", "BVA", "OTHER"]).or(z.literal("")),
  testData: text(300),
  steps: text(1000),
  expected: text(500),
});

export const defectReportSchema = z.object({
  logEntry: z.coerce.number().int().min(0).max(20).catch(0),
  title: text(200),
  environment: text(200),
  steps: text(1500),
  expected: text(800),
  actual: text(800),
  severity: z.enum(SEVERITIES).or(z.literal("")),
  priority: z.enum(PRIORITIES).or(z.literal("")),
  evidence: text(500),
});

export const qaCheckoutSchema = z.object({
  testCases: z.array(testCaseSchema).min(1, "Add at least one test case"),
  defects: z.array(defectReportSchema).min(1, "Add at least one defect report"),
});
export type QaCheckout = z.infer<typeof qaCheckoutSchema>;

/** Reads repeated rows named `${prefix}_${i}_${field}` from form data, dropping rows that are entirely empty. */
export function readRows(form: Record<string, string>, prefix: string, fields: readonly string[], max: number) {
  const rows: Record<string, string>[] = [];
  for (let i = 0; i < max; i++) {
    const row = Object.fromEntries(fields.map((f) => [f, (form[`${prefix}_${i}_${f}`] ?? "").toString()]));
    const meaningful = fields.filter((f) => !["status", "stage", "field", "technique", "severity", "priority", "minutes", "logEntry"].includes(f));
    if (meaningful.some((f) => row[f].trim() !== "")) rows.push(row);
  }
  return rows;
}
