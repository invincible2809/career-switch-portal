"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { hashToken } from "@/server/portfolio";
import { labSections, submissionSections } from "@/lib/portfolio/format";
import type { FormState } from "@/lib/schemas/auth";

const MAX_ITEMS = 30;
async function roomFor(userId: string) {
  return (await db.portfolioItem.count({ where: { userId } })) < MAX_ITEMS;
}

export async function addSubmissionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireLearner();
  const id = z.string().min(1).max(50).safeParse(formData.get("submissionId"));
  if (!id.success) return { error: "Choose a piece of work to add." };
  // Only the learner's own submissions can be added.
  const s = await db.submission.findFirst({ where: { id: id.data, userId: user.id }, include: { assignment: true } });
  if (!s) return { error: "That submission couldn't be found." };
  if (!(await roomFor(user.id))) return { error: `You can keep up to ${MAX_ITEMS} portfolio items.` };
  await db.portfolioItem.create({
    data: {
      userId: user.id,
      submissionId: s.id,
      kind: s.assignment.formKind === "SCRUM_RETRO_PLAN" ? "scrum-assignment" : "qa-assignment",
      title: s.assignment.title,
      content: { sections: submissionSections(s.assignment.formKind, s.payload) } as object,
    },
  });
  revalidatePath("/portfolio");
  return { ok: "Added to your portfolio." };
}

export async function addLabWorkAction(_prev: FormState): Promise<FormState> {
  const user = await requireLearner();
  const [cases, defects] = await Promise.all([
    db.labTestCase.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.defectReport.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!cases.length && !defects.length) return { error: "You haven't written any Test Lab test cases or defect reports yet." };
  if (!(await roomFor(user.id))) return { error: `You can keep up to ${MAX_ITEMS} portfolio items.` };
  await db.portfolioItem.create({
    data: { userId: user.id, kind: "test-lab", title: "ShopEasy Test Lab: test cases and defect reports", content: { sections: labSections(cases, defects) } as object },
  });
  revalidatePath("/portfolio");
  return { ok: "Your Test Lab work was added as a snapshot." };
}

const reflectionSchema = z.object({
  title: z.string().trim().min(3, "Give your reflection a title").max(150),
  body: z.string().trim().min(20, "Write at least a couple of sentences").max(5000),
});

export async function addReflectionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireLearner();
  const parsed = reflectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await roomFor(user.id))) return { error: `You can keep up to ${MAX_ITEMS} portfolio items.` };
  await db.portfolioItem.create({
    data: { userId: user.id, kind: "reflection", title: parsed.data.title, content: { sections: [{ heading: "Reflection", lines: parsed.data.body.split(/\n+/).filter(Boolean) }] } as object },
  });
  revalidatePath("/portfolio");
  return { ok: "Reflection added." };
}

export async function toggleShareItemAction(formData: FormData) {
  const user = await requireLearner();
  const id = z.string().min(1).max(50).parse(formData.get("id"));
  const item = await db.portfolioItem.findFirst({ where: { id, userId: user.id } });
  if (item) await db.portfolioItem.update({ where: { id }, data: { includeInShare: !item.includeInShare } });
  revalidatePath("/portfolio");
}

export async function deleteItemAction(formData: FormData) {
  const user = await requireLearner();
  const id = z.string().min(1).max(50).parse(formData.get("id"));
  await db.portfolioItem.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/portfolio");
}

export type ShareState = FormState & { link?: string };

/** Creates a new private link. Only a hash is stored, so the link is shown once; making a new one turns off the old one. */
export async function createShareAction(_prev: ShareState): Promise<ShareState> {
  const user = await requireLearner();
  const token = crypto.randomBytes(24).toString("base64url");
  await db.$transaction([
    db.portfolioShare.updateMany({ where: { userId: user.id, revokedAt: null }, data: { enabled: false, revokedAt: new Date() } }),
    db.portfolioShare.create({ data: { userId: user.id, tokenHash: hashToken(token) } }),
  ]);
  revalidatePath("/portfolio");
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return { ok: "Your private link is ready. Copy it now – for your security it won't be shown again.", link: `${base}/portfolio/shared/${token}` };
}

export async function turnOffShareAction() {
  const user = await requireLearner();
  await db.portfolioShare.updateMany({ where: { userId: user.id, revokedAt: null }, data: { enabled: false, revokedAt: new Date() } });
  revalidatePath("/portfolio");
}
