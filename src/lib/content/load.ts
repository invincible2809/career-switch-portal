// Reads and validates everything under content/. Used by the seed and `pnpm content:check`.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { parseLesson, type ParsedLesson } from "./parse-lesson";
import matter from "gray-matter";
import {
  assignmentFrontMatterSchema,
  glossaryFileSchema,
  rubricSchema,
  type RubricFile,
  isGeneratedEntry,
  pathwaysFileSchema,
  questionBankSchema,
  type PathwaysFile,
  type QuestionBankFile,
} from "./schemas";
import { validateGeneratorParams } from "../questions/generators";
import { z } from "zod";

export interface ContentBundle {
  pathways: PathwaysFile;
  glossary: z.infer<typeof glossaryFileSchema>;
  lessons: (ParsedLesson & { file: string })[];
  banks: (QuestionBankFile & { file: string })[];
  rubrics: (RubricFile & { file: string })[];
  assignments: { meta: z.infer<typeof assignmentFrontMatterSchema>; brief: string; file: string }[];
}

function walk(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name), ext) : e.name.endsWith(ext) ? [path.join(dir, e.name)] : []))
    .sort();
}

function readYaml<T>(file: string, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(YAML.parse(fs.readFileSync(file, "utf8")));
  if (!parsed.success) {
    throw new Error(`${file}: ${parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`);
  }
  return parsed.data;
}

export function loadContent(root = path.join(process.cwd(), "content")): ContentBundle {
  const errors: string[] = [];
  const attempt = <T>(fn: () => T): T | null => {
    try {
      return fn();
    } catch (e) {
      errors.push((e as Error).message);
      return null;
    }
  };

  const pathways = attempt(() => readYaml(path.join(root, "pathways.yaml"), pathwaysFileSchema));
  const glossary = attempt(() => readYaml(path.join(root, "glossary.yaml"), glossaryFileSchema)) ?? { terms: [] };
  const lessons = walk(path.join(root, "lessons"), ".md")
    .map((file) => attempt(() => ({ ...parseLesson(fs.readFileSync(file, "utf8"), file), file })))
    .filter((l): l is ParsedLesson & { file: string } => l !== null);
  const banks = walk(path.join(root, "questions"), ".yaml")
    .map((file) => attempt(() => ({ ...readYaml(file, questionBankSchema), file })))
    .filter((b): b is QuestionBankFile & { file: string } => b !== null);

  const rubrics = walk(path.join(root, "rubrics"), ".yaml")
    .map((file) => attempt(() => ({ ...readYaml(file, rubricSchema), file })))
    .filter((r): r is RubricFile & { file: string } => r !== null);
  const assignments = walk(path.join(root, "assignments"), ".md")
    .map((file) =>
      attempt(() => {
        const { data, content } = matter(fs.readFileSync(file, "utf8"));
        const meta = assignmentFrontMatterSchema.safeParse(data);
        if (!meta.success) throw new Error(`${file}: front matter is invalid – ${meta.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        if (content.trim().length < 100) throw new Error(`${file}: the brief is missing or too short`);
        return { meta: meta.data, brief: content.trim(), file };
      }),
    )
    .filter((a): a is NonNullable<typeof a> => a !== null);

  // Cross-file checks
  if (pathways) {
    const moduleSlugs = new Set(pathways.pathways.flatMap((p) => p.modules.map((m) => m.slug)));
    const bankSlugs = new Set(banks.map((b) => b.slug));
    const lessonSections = new Map(lessons.map((l) => [l.meta.slug, new Set(l.sections.map((s) => s.key as string))]));
    for (const l of lessons) {
      if (!moduleSlugs.has(l.meta.module)) errors.push(`${l.file}: module "${l.meta.module}" is not in pathways.yaml`);
      if (l.meta.knowledgeCheck && !bankSlugs.has(l.meta.knowledgeCheck))
        errors.push(`${l.file}: knowledge check bank "${l.meta.knowledgeCheck}" not found in content/questions`);
    }
    for (const p of pathways.pathways)
      for (const m of p.modules)
        if (m.assessment && !bankSlugs.has(m.assessment.bank))
          errors.push(`pathways.yaml: module "${m.slug}" assessment bank "${m.assessment.bank}" not found`);
    const rubricSlugs = new Set(rubrics.map((r) => r.slug));
    for (const a of assignments) {
      if (!moduleSlugs.has(a.meta.module)) errors.push(`${a.file}: module "${a.meta.module}" is not in pathways.yaml`);
      if (!rubricSlugs.has(a.meta.rubric)) errors.push(`${a.file}: rubric "${a.meta.rubric}" not found in content/rubrics`);
    }
    for (const b of banks) {
      for (const q of b.questions) {
        if (!q.lessonRef) continue;
        const sections = lessonSections.get(q.lessonRef.lesson);
        if (!sections) errors.push(`${b.file}: ${q.key} links to unknown lesson "${q.lessonRef.lesson}"`);
        else if (!sections.has(q.lessonRef.section))
          errors.push(`${b.file}: ${q.key} links to missing section "${q.lessonRef.section}"`);
        if (isGeneratedEntry(q)) {
          const problem = validateGeneratorParams(q.generator, q.params);
          if (problem) errors.push(`${b.file}: ${q.key}: ${problem}`);
        }
      }
    }
  }

  if (errors.length || !pathways) {
    throw new Error(`Content has ${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
  }
  return { pathways, glossary, lessons, banks, rubrics, assignments };
}
