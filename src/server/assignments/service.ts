import "server-only";
import { z } from "zod";
import { db } from "../db";
import { audit } from "../audit";
import { unlockState } from "../learning";
import { AUTO_CHECKS } from "./checks";
import { evaluateRubric, type MinimumRule } from "@/lib/assignments/evaluate";
import { guidanceFor } from "@/lib/assignments/guidance";
import {
  defectReportSchema,
  impedimentSchema,
  qaCheckoutSchema,
  qaTestLabSchema,
  TEST_FIELDS,
  readRows,
  retroRowSchema,
  scrumRetroPlanSchema,
  testCaseSchema,
} from "@/lib/assignments/forms";

export class SubmissionError extends Error {}

export async function getPublishedAssignment(slug: string) {
  const a = await db.assignment.findUnique({
    where: { slug },
    include: { module: { include: { pathway: true } }, rubric: { include: { criteria: { orderBy: { order: "asc" } } } } },
  });
  if (!a || a.status !== "PUBLISHED" || a.module.status !== "PUBLISHED" || a.module.availability !== "AVAILABLE") return null;
  return a;
}

const keys = <T extends z.ZodObject>(s: T) => Object.keys(s.shape);

/**
 * Test Lab version: the payload is built from the learner's own Lab records (chosen by id),
 * so test results really come from running the tests in the Lab.
 */
export async function labPayload(userId: string, form: Record<string, string>) {
  const tcIds = Object.keys(form).filter((k) => k.startsWith("include_tc_") && form[k] === "on").map((k) => k.slice(11));
  const defIds = Object.keys(form).filter((k) => k.startsWith("include_def_") && form[k] === "on").map((k) => k.slice(12));
  const [cases, defects] = await Promise.all([
    db.labTestCase.findMany({ where: { userId, id: { in: tcIds.slice(0, 20) } }, orderBy: { createdAt: "asc" } }),
    db.defectReport.findMany({ where: { userId, id: { in: defIds.slice(0, 12) } }, orderBy: { createdAt: "asc" } }),
  ]);
  const field = (id: string) => ((TEST_FIELDS as readonly string[]).includes(form[`field_${id}`]) ? form[`field_${id}`] : "");
  return qaTestLabSchema.safeParse({
    testCases: cases.map((c) => ({
      title: c.title,
      field: field(c.id),
      technique: c.technique,
      testData: c.testData,
      steps: c.steps,
      expected: c.expected,
      status: c.status,
      actual: c.actual ?? "",
    })),
    defects: defects.map((d) => ({
      area: d.area,
      title: d.title,
      environment: d.environment,
      steps: d.steps,
      expected: d.expected,
      actual: d.actual,
      severity: d.severity,
      priority: d.priority,
      evidence: d.evidence,
    })),
  });
}

/** The rubric a submission was made against (an assignment can move to a newer rubric version). */
export async function rubricFor(submission: { assignmentId: string; rubricVersion: number }) {
  const a = await db.assignment.findUniqueOrThrow({ where: { id: submission.assignmentId }, include: { rubric: true } });
  return db.rubric.findUniqueOrThrow({
    where: { slug_version: { slug: a.rubric.slug, version: submission.rubricVersion } },
    include: { criteria: { orderBy: { order: "asc" } } },
  });
}

/** Turns the raw form into a validated payload for the assignment's form kind. */
export function parsePayload(formKind: "SCRUM_RETRO_PLAN" | "QA_CHECKOUT_TESTING", form: Record<string, string>) {
  if (formKind === "SCRUM_RETRO_PLAN") {
    return scrumRetroPlanSchema.safeParse({
      diagnosis: form.diagnosis ?? "",
      impediments: readRows(form, "imp", keys(impedimentSchema), 8),
      retroGoal: form.retroGoal ?? "",
      retroRows: readRows(form, "retro", keys(retroRowSchema), 10),
    });
  }
  return qaCheckoutSchema.safeParse({
    testCases: readRows(form, "tc", keys(testCaseSchema), 12),
    defects: readRows(form, "def", keys(defectReportSchema), 8),
  });
}

/** Recalculates the official result and the "competency demonstrated" record for a submission. */
export async function reevaluate(submissionId: string) {
  const s = await db.submission.findUniqueOrThrow({
    where: { id: submissionId },
    include: { scores: true, competency: true },
  });
  const rubric = await rubricFor(s);
  const e = evaluateRubric(
    rubric.criteria.map((c) => c.id),
    s.scores.map((x) => ({ criterionId: x.criterionId, score: x.score, source: x.source, createdAt: x.createdAt })),
    rubric.minimumRule as unknown as MinimumRule,
  );
  await db.submission.update({
    where: { id: s.id },
    data: { assessmentState: e.complete ? "ASSESSED" : "AWAITING_REVIEW", assessedBy: e.complete ? e.assessedBy : null },
  });
  // Submitting never counts as mastery: competency exists only when the minimum criteria are met.
  if (e.met && !s.competency) {
    await db.competency.create({ data: { userId: s.userId, assignmentId: s.assignmentId, submissionId: s.id, assessedBy: e.assessedBy } });
  } else if (!e.met && s.competency && !s.competency.overriddenById) {
    await db.competency.delete({ where: { id: s.competency.id } });
  }
  return e;
}

export async function submitAssignment(userId: string, slug: string, form: Record<string, string>) {
  const a = await getPublishedAssignment(slug);
  if (!a) throw new SubmissionError("This assignment isn't available.");
  const unlock = await unlockState("ASSIGNMENT", a.id, userId);
  if (!unlock.unlocked) throw new SubmissionError("This assignment isn't unlocked yet.");
  const parsed = a.formKind === "QA_TEST_LAB" ? await labPayload(userId, form) : parsePayload(a.formKind, form);
  if (!parsed.success) return { ok: false as const, errors: parsed.error.issues.map((i) => i.message) };

  const criteria = a.rubric.criteria;
  const selfScores = criteria
    .map((c) => ({ c, v: Number(form[`self_${c.key}`]) }))
    .filter(({ v }) => Number.isInteger(v) && v >= 0 && v <= 3);
  const automated = criteria
    .filter((c) => c.autoCheck && AUTO_CHECKS[c.autoCheck])
    .map((c) => ({ c, r: AUTO_CHECKS[c.autoCheck!](parsed.data) }));

  const submission = await db.submission.create({
    data: {
      userId,
      assignmentId: a.id,
      rubricVersion: a.rubric.version,
      payload: parsed.data as object,
      scores: {
        create: [
          ...selfScores.map(({ c, v }) => ({ criterionId: c.id, score: v, source: "SELF" as const })),
          ...automated.map(({ c, r }) => ({ criterionId: c.id, score: r.score, source: "AUTOMATED" as const, comment: r.feedback.join("\n") })),
          // Guidance comments on judgement criteria – shown to the learner and assessor, never counted.
          ...criteria
            .filter((c) => !c.autoCheck)
            .map((c) => ({ c, g: guidanceFor(c.key, a.formKind, parsed.data) }))
            .filter(({ g }) => g)
            .map(({ c, g }) => ({ criterionId: c.id, score: 0, source: "GUIDANCE" as const, comment: g!.join("\n") })),
        ],
      },
    },
  });
  await reevaluate(submission.id);
  return { ok: true as const, id: submission.id };
}

/** A learner's own submission only (SPEC §16 criterion 13). */
export async function getOwnSubmission(userId: string, id: string) {
  return db.submission.findFirst({
    where: { id, userId },
    include: {
      scores: { orderBy: { createdAt: "asc" }, include: { scoredBy: { select: { displayName: true } } } },
      competency: true,
      assignment: { include: { module: { include: { pathway: true } } } },
    },
  });
}

const assessorScoreSchema = z.object({ score: z.coerce.number().int().min(0).max(3), comment: z.string().trim().max(2000) });

export async function saveAssessorScores(adminId: string, submissionId: string, form: Record<string, string>) {
  const s = await db.submission.findUniqueOrThrow({ where: { id: submissionId }, include: { scores: true } });
  const rubric = await rubricFor(s);
  const created: { criterion: string; score: number }[] = [];
  for (const c of rubric.criteria) {
    if (form[`score_${c.id}`] === undefined || form[`score_${c.id}`] === "") continue;
    const parsed = assessorScoreSchema.safeParse({ score: form[`score_${c.id}`], comment: form[`comment_${c.id}`] ?? "" });
    if (!parsed.success) throw new SubmissionError(`Scores must be 0–3 (${c.title}).`);
    const current = s.scores.filter((x) => x.criterionId === c.id && x.source === "ASSESSOR").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    if (current && current.score === parsed.data.score && (current.comment ?? "") === parsed.data.comment) continue;
    await db.rubricScore.create({
      data: { submissionId, criterionId: c.id, score: parsed.data.score, source: "ASSESSOR", comment: parsed.data.comment || null, scoredById: adminId },
    });
    created.push({ criterion: c.key, score: parsed.data.score });
  }
  const e = await reevaluate(submissionId);
  await audit(adminId, "submission.assess", "Submission", submissionId, undefined, { scores: created, met: e.met, complete: e.complete });
  return e;
}

export async function overrideCompetency(adminId: string, submissionId: string, grant: boolean, reason: string) {
  const s = await db.submission.findUniqueOrThrow({ where: { id: submissionId }, include: { competency: true } });
  if (grant && !s.competency) {
    await db.competency.create({
      data: { userId: s.userId, assignmentId: s.assignmentId, submissionId, assessedBy: "ASSESSOR", overriddenById: adminId },
    });
  } else if (grant && s.competency) {
    await db.competency.update({ where: { id: s.competency.id }, data: { overriddenById: adminId, assessedBy: "ASSESSOR" } });
  } else if (!grant && s.competency) {
    await db.competency.delete({ where: { id: s.competency.id } });
  }
  await audit(adminId, grant ? "competency.grant" : "competency.remove", "Submission", submissionId, { competency: !!s.competency }, { competency: grant, reason });
}
