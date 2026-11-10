import "server-only";
import { db } from "./db";
import { recommend, summariseDiagnostic, type Preference, type RolePathway } from "@/lib/onboarding/recommend";
import type { IndustryId } from "@/lib/onboarding/skills-map";
import type { OptionSnapshot } from "@/lib/assessment/types";

export type DiagnosticOption = OptionSnapshot & { lean?: RolePathway };

export async function getDiagnosticQuestions() {
  const bank = await db.questionBank.findUnique({ where: { slug: "diagnostic" } });
  if (!bank) throw new Error("Diagnostic question bank is missing. Run pnpm db:seed.");
  const questions = await db.question.findMany({
    where: { bankId: bank.id, active: true, draft: false },
    orderBy: { key: "asc" },
  });
  return questions.map((q) => ({ ...q, options: q.options as unknown as DiagnosticOption[] }));
}

export async function scoreDiagnostic(userId: string, answers: Record<string, string>) {
  const questions = await getDiagnosticQuestions();
  const marked = questions.map((q) => {
    const chosen = q.options.find((o) => o.id === answers[q.id]);
    const isPreference = q.tags.includes("preference");
    return {
      questionKey: q.key,
      chosen: chosen?.id ?? null,
      tags: q.tags,
      correct: isPreference ? null : Boolean(chosen?.correct),
      lean: chosen?.lean ?? null,
    };
  });
  const profile = await db.learnerProfile.findUnique({ where: { userId } });
  const result = recommend({
    preference: (profile?.preferredPathway ?? "HELP_ME_CHOOSE") as Preference,
    techConfidence: profile?.techConfidence ?? 1,
    industry: (profile?.industry as IndustryId | null) ?? null,
    diagnostic: summariseDiagnostic(marked),
  });
  return db.diagnosticAttempt.create({
    data: { userId, answers: marked, result: result as unknown as object },
  });
}
