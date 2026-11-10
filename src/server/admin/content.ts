import "server-only";
import { z } from "zod";
import { db } from "../db";
import { audit } from "../audit";
import { LESSON_PARTS, type LessonSection } from "@/lib/content/lesson-parts";
import { lessonSearchText } from "@/lib/content/parse-lesson";
import { authoredQuestionSchema } from "@/lib/content/schemas";

export class AdminError extends Error {}

// ---------- Lessons: draft -> review -> published (SPEC §11) ----------

export async function getOrCreateDraft(lessonId: string, actorId: string) {
  const existing = await db.lessonVersion.findFirst({
    where: { lessonId, status: { in: ["DRAFT", "IN_REVIEW"] } },
    orderBy: { version: "desc" },
  });
  if (existing) return existing;
  const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId }, include: { publishedVersion: true } });
  const latest = await db.lessonVersion.findFirst({ where: { lessonId }, orderBy: { version: "desc" } });
  const base = lesson.publishedVersion ?? latest;
  if (!base) throw new AdminError("This lesson has no versions.");
  const draft = await db.lessonVersion.create({
    data: {
      lessonId,
      version: (latest?.version ?? 0) + 1,
      status: "DRAFT",
      title: base.title,
      estimatedMinutes: base.estimatedMinutes,
      objectives: base.objectives,
      sections: base.sections as object,
      searchText: base.searchText,
      knowledgeCheck: base.knowledgeCheck,
      authorId: actorId,
    },
  });
  await audit(actorId, "lesson.draft.create", "LessonVersion", draft.id, undefined, { lessonId, version: draft.version });
  return draft;
}

export const lessonDraftSchema = z.object({
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(150),
  estimatedMinutes: z.coerce.number().int().min(5, "At least 5 minutes").max(40, "No more than 40 minutes"),
  objectives: z
    .string()
    .transform((s) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))
    .pipe(z.array(z.string().min(3)).min(1, "Add at least one objective")),
  knowledgeCheck: z.string().trim().max(100).optional().default(""),
  ...Object.fromEntries(LESSON_PARTS.map((p) => [`section_${p.key}`, z.string().max(20000)])),
  ...Object.fromEntries(LESSON_PARTS.map((p) => [`title_${p.key}`, z.string().trim().min(1, "Every part needs a heading").max(120)])),
});

export async function saveDraft(versionId: string, actorId: string, raw: Record<string, unknown>) {
  const version = await db.lessonVersion.findUniqueOrThrow({ where: { id: versionId } });
  if (version.status !== "DRAFT" && version.status !== "IN_REVIEW") throw new AdminError("Only drafts can be edited.");
  const parsed = lessonDraftSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error };
  const d = parsed.data as z.infer<typeof lessonDraftSchema> & Record<string, string>;
  if (d.knowledgeCheck && !(await db.questionBank.findUnique({ where: { slug: d.knowledgeCheck } }))) {
    throw new AdminError(`No question bank called "${d.knowledgeCheck}".`);
  }
  const sections: LessonSection[] = LESSON_PARTS.map((p) => ({
    key: p.key,
    title: d[`title_${p.key}`],
    markdown: d[`section_${p.key}`].trim(),
  }));
  const updated = await db.lessonVersion.update({
    where: { id: versionId },
    data: {
      title: d.title,
      estimatedMinutes: d.estimatedMinutes,
      objectives: d.objectives,
      knowledgeCheck: d.knowledgeCheck || null,
      sections: sections as unknown as object,
      searchText: lessonSearchText(d.title, sections),
      // Editing something that was waiting for review sends it back to draft.
      status: "DRAFT",
      authorId: actorId,
    },
  });
  await audit(actorId, "lesson.draft.save", "LessonVersion", versionId, { title: version.title, status: version.status }, { title: updated.title });
  return { ok: true as const };
}

export async function submitForReview(versionId: string, actorId: string, note: string) {
  const v = await db.lessonVersion.findUniqueOrThrow({ where: { id: versionId } });
  if (v.status !== "DRAFT") throw new AdminError("Only a draft can be sent for review.");
  await db.lessonVersion.update({ where: { id: versionId }, data: { status: "IN_REVIEW", reviewNote: note || null } });
  await audit(actorId, "lesson.review.submit", "LessonVersion", versionId, { status: "DRAFT" }, { status: "IN_REVIEW" });
}

export async function publishVersion(versionId: string, actorId: string) {
  const v = await db.lessonVersion.findUniqueOrThrow({ where: { id: versionId }, include: { lesson: true } });
  if (v.status !== "IN_REVIEW") throw new AdminError("A version must be reviewed before it is published.");
  const previous = v.lesson.publishedVersionId;
  await db.$transaction([
    ...(previous ? [db.lessonVersion.update({ where: { id: previous }, data: { status: "ARCHIVED" } })] : []),
    db.lessonVersion.update({ where: { id: versionId }, data: { status: "PUBLISHED", publishedAt: new Date() } }),
    db.lesson.update({
      where: { id: v.lessonId },
      // Next content review due in 12 months (SPEC §11 review dates).
      data: { publishedVersionId: versionId, reviewDueAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    }),
  ]);
  await audit(actorId, "lesson.publish", "Lesson", v.lessonId, { publishedVersionId: previous }, { publishedVersionId: versionId, version: v.version });
}

export async function discardDraft(versionId: string, actorId: string) {
  const v = await db.lessonVersion.findUniqueOrThrow({ where: { id: versionId }, include: { lesson: true } });
  if (v.status !== "DRAFT" && v.status !== "IN_REVIEW") throw new AdminError("Only drafts can be discarded.");
  if (!v.lesson.publishedVersionId) throw new AdminError("This lesson has never been published, so its only draft can't be discarded.");
  await db.lessonVersion.delete({ where: { id: versionId } });
  await audit(actorId, "lesson.draft.discard", "LessonVersion", versionId, { version: v.version }, undefined);
}

export async function createLesson(moduleId: string, actorId: string, slug: string, title: string) {
  if (await db.lesson.findUnique({ where: { slug } })) throw new AdminError("A lesson with that web address already exists.");
  const order = (await db.lesson.count({ where: { moduleId } })) + 1;
  const sections: LessonSection[] = LESSON_PARTS.map((p) => ({ key: p.key, title: p.label, markdown: "" }));
  const lesson = await db.lesson.create({ data: { moduleId, slug, order } });
  await db.lessonVersion.create({
    data: {
      lessonId: lesson.id,
      version: 1,
      status: "DRAFT",
      title,
      estimatedMinutes: 15,
      objectives: [],
      sections: sections as unknown as object,
      searchText: title,
      authorId: actorId,
    },
  });
  await audit(actorId, "lesson.create", "Lesson", lesson.id, undefined, { slug, title, moduleId });
  return lesson;
}

// ---------- Question banks: edits are drafts until the bank is published ----------

const optionRows = (raw: Record<string, unknown>) =>
  [0, 1, 2, 3, 4, 5]
    .map((i) => ({
      id: "abcdef"[i],
      text: String(raw[`opt_${i}_text`] ?? "").trim(),
      correct: raw[`opt_${i}_correct`] === "on",
      explanation: String(raw[`opt_${i}_explanation`] ?? "").trim(),
    }))
    .filter((o) => o.text.length > 0);

/** Builds a validated question from the admin form, using the same rules as content files. */
export function parseQuestionForm(raw: Record<string, unknown>) {
  const options = optionRows(raw);
  return authoredQuestionSchema.safeParse({
    key: String(raw.key ?? "").trim(),
    type: raw.type,
    objective: String(raw.objective ?? "").trim(),
    lessonRef: { lesson: String(raw.lessonSlug ?? "").trim(), section: String(raw.sectionKey ?? "") },
    scenario: String(raw.scenario ?? "").trim() || undefined,
    stem: String(raw.stem ?? "").trim(),
    options,
    correctOrder: String(raw.correctOrder ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    tags: String(raw.tags ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    isKey: raw.isKey === "on",
  });
}

export async function saveQuestionDraft(bankId: string, actorId: string, raw: Record<string, unknown>) {
  const parsed = parseQuestionForm(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error };
  const q = parsed.data;
  if (!q.lessonRef || !(await db.lesson.findUnique({ where: { slug: q.lessonRef.lesson } })))
    return { ok: false as const, message: `No lesson called "${q.lessonRef?.lesson ?? ""}".` };
  const lessonRef = q.lessonRef;
  const versions = await db.question.findMany({ where: { bankId, key: q.key }, orderBy: { version: "desc" } });
  const data = {
    type: q.type,
    scenario: q.scenario ?? null,
    stem: q.stem,
    options: q.options,
    correctOrder: q.correctOrder,
    objective: q.objective,
    lessonSlug: lessonRef.lesson,
    sectionKey: lessonRef.section,
    tags: q.tags,
    isKey: q.isKey,
    generator: null,
    generatorParams: undefined,
  };
  const existingDraft = versions.find((v) => v.draft);
  const saved = existingDraft
    ? await db.question.update({ where: { id: existingDraft.id }, data })
    : await db.question.create({
        data: { bankId, key: q.key, version: (versions[0]?.version ?? 0) + 1, active: false, draft: true, ...data },
      });
  await audit(actorId, "question.draft.save", "Question", saved.id, versions.find((v) => v.active) ?? undefined, saved);
  return { ok: true as const, id: saved.id };
}

export async function publishBank(bankId: string, actorId: string) {
  const drafts = await db.question.findMany({ where: { bankId, draft: true } });
  if (drafts.length === 0) throw new AdminError("There are no draft changes to publish.");
  await db.$transaction(async (tx) => {
    for (const d of drafts) {
      await tx.question.updateMany({ where: { bankId, key: d.key, active: true }, data: { active: false } });
      await tx.question.update({ where: { id: d.id }, data: { draft: false, active: true } });
    }
  });
  await audit(actorId, "bank.publish", "QuestionBank", bankId, undefined, { published: drafts.map((d) => `${d.key} v${d.version}`) });
  return drafts.length;
}

export async function discardBankDrafts(bankId: string, actorId: string) {
  const { count } = await db.question.deleteMany({ where: { bankId, draft: true } });
  await audit(actorId, "bank.drafts.discard", "QuestionBank", bankId, undefined, { discarded: count });
}

export async function setQuestionActive(questionId: string, actorId: string, active: boolean) {
  const q = await db.question.findUniqueOrThrow({ where: { id: questionId }, include: { bank: true } });
  if (q.draft) throw new AdminError("Publish or discard the draft first.");
  if (!active && q.bank.purpose === "MODULE") {
    const remaining = await db.question.count({ where: { bankId: q.bankId, active: true, draft: false, id: { not: q.id } } });
    if (remaining < 25) throw new AdminError("Module banks need at least 25 active questions, so this one can't be retired yet.");
  }
  if (active) await db.question.updateMany({ where: { bankId: q.bankId, key: q.key, active: true }, data: { active: false } });
  await db.question.update({ where: { id: questionId }, data: { active } });
  await audit(actorId, active ? "question.restore" : "question.retire", "Question", questionId, { active: q.active }, { active });
}

// ---------- Assessments ----------

export const assessmentSettingsSchema = z.object({
  passMark: z.coerce.number({ error: "Enter a pass mark" }).int().min(1, "Between 1 and 100").max(100, "Between 1 and 100"),
  drawCount: z.coerce.number({ error: "Enter a number of questions" }).int().min(1, "At least 1").max(50, "No more than 50"),
  cooldownMinutes: z.coerce.number({ error: "Enter minutes (0 for none)" }).int().min(0).max(10080),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export async function updateAssessment(assessmentId: string, actorId: string, raw: Record<string, unknown>) {
  const parsed = assessmentSettingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error };
  const before = await db.assessment.findUniqueOrThrow({ where: { id: assessmentId } });
  const pool = await db.question.count({ where: { bankId: before.bankId, active: true, draft: false } });
  if (parsed.data.drawCount > pool) return { ok: false as const, message: `The bank only has ${pool} active questions.` };
  const after = await db.assessment.update({ where: { id: assessmentId }, data: parsed.data });
  await audit(
    actorId,
    "assessment.update",
    "Assessment",
    assessmentId,
    { passMark: before.passMark, drawCount: before.drawCount, cooldownMinutes: before.cooldownMinutes, status: before.status },
    { passMark: after.passMark, drawCount: after.drawCount, cooldownMinutes: after.cooldownMinutes, status: after.status },
  );
  return { ok: true as const };
}
