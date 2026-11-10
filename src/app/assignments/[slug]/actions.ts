"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireLearner } from "@/server/guards";
import { consumeRateLimit } from "@/server/rate-limit";
import { SubmissionError, submitAssignment } from "@/server/assignments/service";
import type { FormState } from "@/lib/schemas/auth";

export async function submitAssignmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireLearner();
  const slug = z.string().min(1).max(100).parse(formData.get("slug"));
  if (!(await consumeRateLimit(`submit:${user.id}`, 20, 60 * 60 * 1000))) {
    return { error: "You've submitted a lot in the last hour. Please wait a little and try again." };
  }
  const form = Object.fromEntries([...formData].map(([k, v]) => [k, String(v)]));
  let id: string;
  try {
    const r = await submitAssignment(user.id, slug, form);
    if (!r.ok) return { error: r.errors.join(" ") };
    id = r.id;
  } catch (e) {
    if (e instanceof SubmissionError) return { error: e.message };
    throw e;
  }
  revalidatePath("/dashboard");
  redirect(`/assignments/${slug}/submissions/${id}`);
}
