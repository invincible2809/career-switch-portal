"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { fieldErrors, type FormState } from "@/lib/schemas/auth";
import { LAB_AREAS } from "@/lib/lab/spec";
import { PRIORITIES, SEVERITIES } from "@/lib/assignments/forms";

const t = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max);

const testCaseSchema = z.object({
  title: t(3, 200, "Give the test case a title"),
  technique: z.enum(["EP", "BVA", "OTHER"], { message: "Choose a technique" }),
  preconditions: z.string().trim().max(500).default(""),
  testData: t(1, 300, "Add the test data"),
  steps: t(3, 1500, "Add the steps"),
  expected: t(3, 800, "Add the expected result from the specification"),
});

export async function createTestCaseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireLearner();
  const parsed = testCaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if ((await db.labTestCase.count({ where: { userId: user.id } })) >= 50) return { error: "You can keep up to 50 test cases. Delete some first." };
  await db.labTestCase.create({ data: { userId: user.id, ...parsed.data } });
  revalidatePath("/lab/test-cases");
  return { ok: "Test case saved. Run it in the demo shop, then record the result." };
}

const runSchema = z.object({
  id: z.string().min(1).max(50),
  status: z.enum(["PASS", "FAIL", "BLOCKED", "NOT_RUN"]),
  actual: z.string().trim().max(800).default(""),
});

export async function recordRunAction(formData: FormData) {
  const user = await requireLearner();
  const parsed = runSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  // Ownership is in the where clause: learners can only update their own test cases.
  await db.labTestCase.updateMany({
    where: { id: parsed.data.id, userId: user.id },
    data: { status: parsed.data.status, actual: parsed.data.actual || null, executedAt: parsed.data.status === "NOT_RUN" ? null : new Date() },
  });
  revalidatePath("/lab/test-cases");
}

export async function deleteTestCaseAction(formData: FormData) {
  const user = await requireLearner();
  const id = z.string().min(1).max(50).parse(formData.get("id"));
  await db.labTestCase.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/lab/test-cases");
}

const defectSchema = z.object({
  area: z.enum(LAB_AREAS, { message: "Choose the area" }),
  title: t(5, 200, "Give the defect a clear title"),
  environment: t(2, 200, "Say where you found it, e.g. Test Lab, Chrome on Windows"),
  steps: t(5, 1500, "Add steps to reproduce"),
  expected: t(3, 800, "Add the expected result"),
  actual: t(3, 800, "Add the actual result"),
  severity: z.enum(SEVERITIES, { message: "Choose a severity" }),
  priority: z.enum(PRIORITIES, { message: "Choose a priority" }),
  evidence: z.string().trim().max(500).default(""),
});

export async function createDefectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireLearner();
  const parsed = defectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if ((await db.defectReport.count({ where: { userId: user.id, submissionId: null } })) >= 30) return { error: "You can keep up to 30 draft defect reports." };
  await db.defectReport.create({ data: { userId: user.id, ...parsed.data } });
  revalidatePath("/lab/defects");
  return { ok: "Defect report saved." };
}

export async function deleteDefectAction(formData: FormData) {
  const user = await requireLearner();
  const id = z.string().min(1).max(50).parse(formData.get("id"));
  await db.defectReport.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/lab/defects");
}
