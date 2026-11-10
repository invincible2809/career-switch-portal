"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { consumeRateLimit } from "@/server/rate-limit";
import type { FormState } from "@/lib/schemas/auth";

const schema = z.object({
  kind: z.enum(["LESSON", "QUESTION"]),
  targetId: z.string().min(1).max(50),
  reason: z.string().trim().min(5, "Tell us briefly what's wrong").max(1000),
});

/** Learners report a problem with a lesson or question; it goes to the admin review queue. */
export async function flagContentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireLearner();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await consumeRateLimit(`flag:${user.id}`, 20, 60 * 60 * 1000))) return { error: "Please wait before sending more reports." };
  const exists =
    parsed.data.kind === "LESSON"
      ? await db.lesson.findUnique({ where: { id: parsed.data.targetId } })
      : await db.question.findUnique({ where: { id: parsed.data.targetId } });
  if (!exists) return { error: "That item couldn't be found." };
  await db.flaggedItem.create({ data: { reporterId: user.id, ...parsed.data } });
  return { ok: "Thanks – an admin will look at this." };
}
