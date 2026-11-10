// Zod schemas for the files in content/ (PLAN §5). The seed refuses invalid files.
import { z } from "zod";
import { LESSON_PART_KEYS } from "./lesson-parts";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case words separated by hyphens");

export const glossaryEntrySchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
});

export const lessonFrontMatterSchema = z.object({
  slug,
  module: slug,
  order: z.number().int().min(1),
  title: z.string().min(3),
  estimatedMinutes: z.number().int().min(5).max(40),
  objectives: z.array(z.string().min(3)).min(1),
  glossary: z.array(glossaryEntrySchema).default([]),
  knowledgeCheck: slug.optional(),
});

const optionSchema = z.object({
  id: z.string().regex(/^[a-z]$/),
  text: z.string().min(1),
  correct: z.boolean().default(false),
  explanation: z.string().min(1, "Every option needs an explanation"),
  lean: z.enum(["SCRUM_MASTER", "QA_TESTER"]).optional(),
});

const lessonRef = z.object({ lesson: slug, section: z.enum(LESSON_PART_KEYS as [string, ...string[]]) });

export const authoredQuestionSchema = z
  .object({
    key: z.string().min(1),
    type: z.enum(["SINGLE", "MULTI", "ORDER", "SCENARIO"]),
    objective: z.string().min(1),
    // Optional only for diagnostic questions (checked at bank level); everything else needs a remediation link.
    lessonRef: lessonRef.optional(),
    scenario: z.string().optional(),
    stem: z.string().min(1),
    options: z.array(optionSchema).min(2).max(6),
    correctOrder: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    isKey: z.boolean().default(false),
  })
  .superRefine((q, ctx) => {
    const ids = q.options.map((o) => o.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: `${q.key}: option ids must be unique` });
    const correct = q.options.filter((o) => o.correct).length;
    const isPreference = q.options.some((o) => o.lean);
    if ((q.type === "SINGLE" || q.type === "SCENARIO") && !isPreference && correct !== 1)
      ctx.addIssue({ code: "custom", message: `${q.key}: single-choice questions need exactly one correct option (found ${correct})` });
    if (q.type === "MULTI" && correct < 2)
      ctx.addIssue({ code: "custom", message: `${q.key}: multiple-select questions need at least two correct options` });
    if (q.type === "ORDER") {
      if (q.correctOrder.length !== q.options.length || !q.correctOrder.every((id) => ids.includes(id)))
        ctx.addIssue({ code: "custom", message: `${q.key}: correctOrder must list every option id once` });
    }
    if (q.type === "SCENARIO" && !q.scenario)
      ctx.addIssue({ code: "custom", message: `${q.key}: scenario questions need a scenario` });
  });

export const generatedQuestionSchema = z.object({
  key: z.string().min(1),
  generator: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
  objective: z.string().min(1),
  lessonRef,
  tags: z.array(z.string()).default([]),
  isKey: z.boolean().default(false),
});

export const questionEntrySchema = z.union([generatedQuestionSchema, authoredQuestionSchema]);

export const questionBankSchema = z
  .object({
    slug,
    title: z.string().min(1),
    purpose: z.enum(["DIAGNOSTIC", "KNOWLEDGE_CHECK", "MODULE"]),
    module: slug.optional(),
    lesson: slug.optional(),
    questions: z.array(questionEntrySchema).min(1),
  })
  .superRefine((b, ctx) => {
    const keys = b.questions.map((q) => q.key);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (b.purpose !== "DIAGNOSTIC")
      for (const q of b.questions)
        if (!q.lessonRef) ctx.addIssue({ code: "custom", message: `${q.key}: needs a lessonRef (the lesson section learners are sent back to)` });
    if (dupes.length) ctx.addIssue({ code: "custom", message: `Duplicate question keys: ${dupes.join(", ")}` });
    if (b.purpose === "MODULE" && b.questions.length < 25)
      ctx.addIssue({ code: "custom", message: `Module banks need at least 25 questions (found ${b.questions.length})` });
    if (b.purpose === "KNOWLEDGE_CHECK" && (b.questions.length < 3 || b.questions.length > 5))
      ctx.addIssue({ code: "custom", message: `Knowledge checks need 3–5 questions (found ${b.questions.length})` });
    if (b.purpose === "DIAGNOSTIC" && (b.questions.length < 10 || b.questions.length > 12))
      ctx.addIssue({ code: "custom", message: `The diagnostic needs 10–12 questions (found ${b.questions.length})` });
  });

const moduleSchema = z.object({
  slug,
  title: z.string().min(1),
  summary: z.string().min(1),
  availability: z.enum(["AVAILABLE", "COMING_SOON"]).default("AVAILABLE"),
  assessment: z
    .object({
      slug,
      title: z.string().min(1),
      bank: slug,
      drawCount: z.number().int().min(1).default(10),
      passMark: z.number().int().min(1).max(100).default(80),
      cooldownMinutes: z.number().int().min(0).default(0),
    })
    .optional(),
});

export const pathwaysFileSchema = z.object({
  pathways: z
    .array(
      z.object({
        slug,
        title: z.string().min(1),
        summary: z.string().min(1),
        kind: z.enum(["SHARED", "ROLE"]),
        modules: z.array(moduleSchema).min(1),
      }),
    )
    .min(1),
});

export const AUTO_CHECK_NAMES = ["impedimentLogComplete", "retroPlanStructure", "testCasesComplete", "boundaryCoverage", "defectsIdentified", "testExecution", "labDefectsIdentified"] as const;

export const rubricSchema = z.object({
  slug,
  version: z.number().int().min(1).default(1),
  title: z.string().min(1),
  minimumRule: z.object({ minEach: z.number().int().min(0).max(3) }),
  criteria: z
    .array(
      z.object({
        key: slug,
        title: z.string().min(1),
        autoCheck: z.enum(AUTO_CHECK_NAMES).optional(),
        descriptors: z.object({ 0: z.string().min(1), 1: z.string().min(1), 2: z.string().min(1), 3: z.string().min(1) }),
      }),
    )
    .min(4, "Rubrics need 4–6 criteria")
    .max(6, "Rubrics need 4–6 criteria"),
});

export const assignmentFrontMatterSchema = z.object({
  slug,
  module: slug,
  title: z.string().min(3),
  form: z.enum(["SCRUM_RETRO_PLAN", "QA_CHECKOUT_TESTING", "QA_TEST_LAB"]),
  rubric: slug,
});

export type RubricFile = z.infer<typeof rubricSchema>;

export const glossaryFileSchema = z.object({ terms: z.array(glossaryEntrySchema) });

export type LessonFrontMatter = z.infer<typeof lessonFrontMatterSchema>;
export type QuestionBankFile = z.infer<typeof questionBankSchema>;
export type QuestionEntry = z.infer<typeof questionEntrySchema>;
export type PathwaysFile = z.infer<typeof pathwaysFileSchema>;

export function isGeneratedEntry(q: QuestionEntry): q is z.infer<typeof generatedQuestionSchema> {
  return "generator" in q;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
