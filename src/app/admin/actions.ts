"use server";

// Every admin server action checks the role on the server first (CLAUDE.md rule 1).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { requireAdmin } from "@/server/guards";
import {
  AdminError,
  createLesson,
  discardBankDrafts,
  discardDraft,
  getOrCreateDraft,
  publishBank,
  publishVersion,
  saveDraft,
  saveQuestionDraft,
  setQuestionActive,
  submitForReview,
  updateAssessment,
} from "@/server/admin/content";
import { fieldErrors, type FormState } from "@/lib/schemas/auth";
import { slugify } from "@/lib/content/schemas";

const id = z.string().min(1).max(50);
const raw = (f: FormData) => Object.fromEntries(f) as Record<string, string>;

function back(path: string, message: string, tone: "ok" | "error" = "ok"): never {
  redirect(`${path}?${tone === "ok" ? "msg" : "err"}=${encodeURIComponent(message)}`);
}

async function guarded<T>(path: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AdminError) back(path, e.message, "error");
    throw e;
  }
}

// ---------- Curriculum ----------

const moduleSchema = z.object({
  title: z.string().trim().min(1).max(150),
  summary: z.string().trim().min(1).max(500),
  availability: z.enum(["AVAILABLE", "COMING_SOON"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function updateModuleAction(formData: FormData) {
  const admin = await requireAdmin("content:edit");
  const moduleId = id.parse(formData.get("moduleId"));
  const parsed = moduleSchema.safeParse(raw(formData));
  if (!parsed.success) back(`/admin/modules/${moduleId}`, "Check the module fields – title and summary are required.", "error");
  const before = await db.module.findUniqueOrThrow({ where: { id: moduleId } });
  const after = await db.module.update({ where: { id: moduleId }, data: parsed.data });
  await audit(admin.id, "module.update", "Module", moduleId, before, after);
  revalidatePath("/", "layout");
  back(`/admin/modules/${moduleId}`, "Module saved.");
}

export async function createLessonAction(formData: FormData) {
  const admin = await requireAdmin("content:edit");
  const moduleId = id.parse(formData.get("moduleId"));
  const title = z.string().trim().min(3).max(150).safeParse(formData.get("title"));
  if (!title.success) back(`/admin/modules/${moduleId}`, "Give the lesson a title of at least 3 characters.", "error");
  const slug = slugify(String(formData.get("slug") || title.data));
  const lesson = await guarded(`/admin/modules/${moduleId}`, () => createLesson(moduleId, admin.id, slug, title.data));
  redirect(`/admin/lessons/${lesson.id}`);
}

const prereqSchema = z.object({
  targetId: id,
  requirement: z.enum(["LESSONS_COMPLETED", "ASSESSMENT_PASSED", "COMPETENCY_DEMONSTRATED"]),
  requiredId: id,
  moduleId: id,
});

export async function addPrerequisiteAction(formData: FormData) {
  const admin = await requireAdmin("content:edit");
  const p = prereqSchema.parse(raw(formData));
  const created = await db.prerequisite.upsert({
    where: { targetType_targetId_requirement_requiredId: { targetType: "ASSESSMENT", targetId: p.targetId, requirement: p.requirement, requiredId: p.requiredId } },
    create: { targetType: "ASSESSMENT", targetId: p.targetId, requirement: p.requirement, requiredId: p.requiredId },
    update: {},
  });
  await audit(admin.id, "prerequisite.add", "Prerequisite", created.id, undefined, created);
  back(`/admin/modules/${p.moduleId}`, "Prerequisite added.");
}

export async function removePrerequisiteAction(formData: FormData) {
  const admin = await requireAdmin("content:edit");
  const prereqId = id.parse(formData.get("prereqId"));
  const moduleId = id.parse(formData.get("moduleId"));
  const before = await db.prerequisite.delete({ where: { id: prereqId } });
  await audit(admin.id, "prerequisite.remove", "Prerequisite", prereqId, before, undefined);
  back(`/admin/modules/${moduleId}`, "Prerequisite removed.");
}

// ---------- Lessons ----------

export async function startDraftAction(formData: FormData) {
  const admin = await requireAdmin("content:edit");
  const lessonId = id.parse(formData.get("lessonId"));
  await guarded(`/admin/lessons/${lessonId}`, () => getOrCreateDraft(lessonId, admin.id));
  redirect(`/admin/lessons/${lessonId}`);
}

export async function saveDraftAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("content:edit");
  const versionId = id.parse(formData.get("versionId"));
  try {
    const r = await saveDraft(versionId, admin.id, raw(formData));
    if (!r.ok) return { fieldErrors: fieldErrors(r.error) };
  } catch (e) {
    if (e instanceof AdminError) return { error: e.message };
    throw e;
  }
  revalidatePath("/admin", "layout");
  return { ok: "Draft saved. Learners won't see it until it's reviewed and published." };
}

export async function submitForReviewAction(formData: FormData) {
  const admin = await requireAdmin("content:edit");
  const versionId = id.parse(formData.get("versionId"));
  const lessonId = id.parse(formData.get("lessonId"));
  const note = z.string().max(1000).catch("").parse(formData.get("note"));
  await guarded(`/admin/lessons/${lessonId}`, () => submitForReview(versionId, admin.id, note));
  back(`/admin/lessons/${lessonId}`, "Sent for review.");
}

export async function publishVersionAction(formData: FormData) {
  const admin = await requireAdmin("content:publish");
  const versionId = id.parse(formData.get("versionId"));
  const lessonId = id.parse(formData.get("lessonId"));
  await guarded(`/admin/lessons/${lessonId}`, () => publishVersion(versionId, admin.id));
  revalidatePath("/", "layout");
  back(`/admin/lessons/${lessonId}`, "Published. Learners now see this version, and anyone part-way through keeps their place.");
}

export async function discardDraftAction(formData: FormData) {
  const admin = await requireAdmin("content:edit");
  const versionId = id.parse(formData.get("versionId"));
  const lessonId = id.parse(formData.get("lessonId"));
  await guarded(`/admin/lessons/${lessonId}`, () => discardDraft(versionId, admin.id));
  back(`/admin/lessons/${lessonId}`, "Draft discarded.");
}

// ---------- Question banks ----------

export async function saveQuestionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("content:edit");
  const bankId = id.parse(formData.get("bankId"));
  const r = await saveQuestionDraft(bankId, admin.id, raw(formData));
  if (!r.ok) {
    if ("message" in r) return { error: r.message };
    const fe = fieldErrors(r.error);
    return { error: Object.values(fe).join(" ") };
  }
  revalidatePath(`/admin/question-banks/${bankId}`);
  return { ok: "Saved as a draft. Publish the bank to make it live." };
}

export async function publishBankAction(formData: FormData) {
  const admin = await requireAdmin("content:publish");
  const bankId = id.parse(formData.get("bankId"));
  const n = await guarded(`/admin/question-banks/${bankId}`, () => publishBank(bankId, admin.id));
  revalidatePath("/", "layout");
  back(`/admin/question-banks/${bankId}`, `Published ${n} change${n === 1 ? "" : "s"}. New attempts use them straight away.`);
}

export async function discardBankDraftsAction(formData: FormData) {
  const admin = await requireAdmin("content:edit");
  const bankId = id.parse(formData.get("bankId"));
  await discardBankDrafts(bankId, admin.id);
  back(`/admin/question-banks/${bankId}`, "Draft changes discarded.");
}

export async function setQuestionActiveAction(formData: FormData) {
  const admin = await requireAdmin("content:edit");
  const questionId = id.parse(formData.get("questionId"));
  const bankId = id.parse(formData.get("bankId"));
  const active = formData.get("active") === "true";
  await guarded(`/admin/question-banks/${bankId}`, () => setQuestionActive(questionId, admin.id, active));
  back(`/admin/question-banks/${bankId}`, active ? "Question restored." : "Question retired.");
}

// ---------- Assessments ----------

export async function updateAssessmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("assessment:configure");
  const assessmentId = id.parse(formData.get("assessmentId"));
  const r = await updateAssessment(assessmentId, admin.id, raw(formData));
  if (!r.ok) return "message" in r ? { error: r.message } : { fieldErrors: fieldErrors(r.error) };
  revalidatePath("/", "layout");
  return { ok: "Saved. The new settings apply to attempts started from now on." };
}

// ---------- Users ----------

export async function setRoleAction(formData: FormData) {
  const admin = await requireAdmin("users:manage");
  const userId = id.parse(formData.get("userId"));
  const role = z.enum(["LEARNER", "ADMIN"]).parse(formData.get("role"));
  if (userId === admin.id) back("/admin/users", "You can't change your own role.", "error");
  const before = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, email: true } });
  // Bumping the session version signs the person out so the new role takes effect everywhere.
  await db.user.update({ where: { id: userId }, data: { role, sessionVersion: { increment: 1 } } });
  await audit(admin.id, "user.role.change", "User", userId, { role: before.role }, { role });
  back("/admin/users", `${before.email} is now ${role === "ADMIN" ? "an admin" : "a learner"}.`);
}
