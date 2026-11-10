"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import type { FormState } from "@/lib/schemas/auth";

export async function saveSkillsStatementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireLearner();
  const body = z.string().trim().min(20, "Write at least a couple of sentences").max(3000, "Keep it under 3,000 characters").safeParse(formData.get("body"));
  if (!body.success) return { error: body.error.issues[0].message };
  await db.skillsStatement.upsert({ where: { userId: user.id }, create: { userId: user.id, body: body.data }, update: { body: body.data } });
  revalidatePath("/career");
  return { ok: "Saved." };
}
