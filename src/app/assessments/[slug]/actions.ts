"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireLearner } from "@/server/guards";
import { AssessmentError, getOwnAttempt, startAttempt, submitAttempt } from "@/server/assessments";
import type { QuestionSnapshot } from "@/lib/assessment/types";

export async function startAttemptAction(formData: FormData) {
  const user = await requireLearner();
  const slug = z.string().min(1).max(100).parse(formData.get("slug"));
  let attemptId: string;
  try {
    attemptId = (await startAttempt(user.id, slug)).id;
  } catch (e) {
    if (e instanceof AssessmentError) redirect(`/assessments/${slug}?error=${encodeURIComponent(e.message)}`);
    throw e;
  }
  redirect(`/assessments/${slug}/attempt/${attemptId}`);
}

export async function submitAttemptAction(formData: FormData) {
  const user = await requireLearner();
  const attemptId = z.string().min(1).max(50).parse(formData.get("attemptId"));
  const attempt = await getOwnAttempt(user.id, attemptId);
  if (!attempt) redirect("/dashboard");
  const responses: Record<string, string[]> = {};
  for (const a of attempt.answers) {
    const s = a.snapshot as unknown as QuestionSnapshot;
    const prefix = `a_${a.id}`;
    if (s.type === "ORDER") {
      const pos = s.options
        .map((o) => ({ id: o.id, pos: Number(formData.get(`${prefix}_pos_${o.id}`)) }))
        .filter((p) => Number.isInteger(p.pos) && p.pos > 0);
      const unique = new Set(pos.map((p) => p.pos)).size === pos.length;
      responses[a.id] = pos.length === s.options.length && unique ? pos.sort((x, y) => x.pos - y.pos).map((p) => p.id) : [];
    } else {
      const valid = new Set(s.options.map((o) => o.id));
      responses[a.id] = formData.getAll(prefix).map(String).filter((id) => valid.has(id));
    }
  }
  await submitAttempt(user.id, attempt.id, responses);
  revalidatePath("/dashboard");
  redirect(`/assessments/${attempt.assessment.slug}/attempt/${attempt.id}/result`);
}
