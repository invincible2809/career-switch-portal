// Imports content/ into the database (PLAN A9): creates anything that doesn't exist yet,
// matched by slug or question key, and never overwrites edits made in the admin area.
// No "server-only" import here so the seed script can use it.
import type { PrismaClient } from "@/generated/prisma/client";
import type { ContentBundle } from "@/lib/content/load";
import { isGeneratedEntry, slugify, type QuestionEntry } from "@/lib/content/schemas";
import { lessonSearchText } from "@/lib/content/parse-lesson";

export interface ImportReport {
  created: string[];
  skipped: number;
}

function questionData(q: QuestionEntry) {
  if (isGeneratedEntry(q)) {
    return {
      key: q.key,
      type: "SINGLE" as const,
      stem: `Generated question (${q.generator})`,
      options: [],
      correctOrder: [],
      objective: q.objective,
      lessonSlug: q.lessonRef.lesson,
      sectionKey: q.lessonRef.section,
      tags: q.tags,
      isKey: q.isKey,
      generator: q.generator,
      generatorParams: q.params as object,
    };
  }
  return {
    key: q.key,
    type: q.type,
    scenario: q.scenario ?? null,
    stem: q.stem,
    options: q.options,
    correctOrder: q.correctOrder,
    objective: q.objective,
    lessonSlug: q.lessonRef.lesson,
    sectionKey: q.lessonRef.section,
    tags: q.tags,
    isKey: q.isKey,
  };
}

export async function importContent(db: PrismaClient, content: ContentBundle): Promise<ImportReport> {
  const report: ImportReport = { created: [], skipped: 0 };
  const moduleIds = new Map<string, string>();

  for (const [pi, p] of content.pathways.pathways.entries()) {
    const pathway =
      (await db.pathway.findUnique({ where: { slug: p.slug } })) ??
      (report.created.push(`pathway ${p.slug}`),
      await db.pathway.create({ data: { slug: p.slug, title: p.title, summary: p.summary.trim(), kind: p.kind, order: pi + 1 } }));
    for (const [mi, m] of p.modules.entries()) {
      const mod =
        (await db.module.findUnique({ where: { slug: m.slug } })) ??
        (report.created.push(`module ${m.slug}`),
        await db.module.create({
          data: {
            pathwayId: pathway.id,
            slug: m.slug,
            title: m.title,
            summary: m.summary.trim(),
            order: mi + 1,
            availability: m.availability,
          },
        }));
      moduleIds.set(m.slug, mod.id);
    }
  }

  // Lessons (version 1, published)
  const lessonIds = new Map<string, string>();
  for (const l of content.lessons) {
    const existing = await db.lesson.findUnique({ where: { slug: l.meta.slug } });
    if (existing) {
      lessonIds.set(l.meta.slug, existing.id);
      report.skipped++;
      continue;
    }
    const lesson = await db.lesson.create({
      data: { slug: l.meta.slug, moduleId: moduleIds.get(l.meta.module)!, order: l.meta.order },
    });
    const version = await db.lessonVersion.create({
      data: {
        lessonId: lesson.id,
        version: 1,
        status: "PUBLISHED",
        title: l.meta.title,
        estimatedMinutes: l.meta.estimatedMinutes,
        objectives: l.meta.objectives,
        sections: l.sections as unknown as object,
        searchText: lessonSearchText(l.meta.title, l.sections),
        knowledgeCheck: l.meta.knowledgeCheck ?? null,
        publishedAt: new Date(),
      },
    });
    await db.lesson.update({ where: { id: lesson.id }, data: { publishedVersionId: version.id } });
    lessonIds.set(l.meta.slug, lesson.id);
    report.created.push(`lesson ${l.meta.slug}`);
  }

  // Glossary: shared terms, then lesson terms (first lesson that defines a term owns it)
  const terms = [
    ...content.glossary.terms.map((t) => ({ ...t, lessonSlug: null as string | null })),
    ...content.lessons.flatMap((l) => l.meta.glossary.map((t) => ({ ...t, lessonSlug: l.meta.slug }))),
  ];
  for (const t of terms) {
    const slug = slugify(t.term);
    if (await db.glossaryTerm.findUnique({ where: { slug } })) continue;
    await db.glossaryTerm.create({
      data: {
        slug,
        term: t.term,
        definition: t.definition,
        firstLessonId: t.lessonSlug ? (lessonIds.get(t.lessonSlug) ?? null) : null,
      },
    });
    report.created.push(`glossary ${slug}`);
  }

  // Question banks: create missing banks, and add questions whose key isn't there yet
  const bankIds = new Map<string, string>();
  for (const b of content.banks) {
    let bank = await db.questionBank.findUnique({ where: { slug: b.slug } });
    if (!bank) {
      bank = await db.questionBank.create({
        data: {
          slug: b.slug,
          title: b.title,
          purpose: b.purpose,
          moduleId: b.module ? (moduleIds.get(b.module) ?? null) : null,
          lessonId: b.lesson ? (lessonIds.get(b.lesson) ?? null) : null,
        },
      });
      report.created.push(`bank ${b.slug}`);
    }
    bankIds.set(b.slug, bank.id);
    const existingKeys = new Set(
      (await db.question.findMany({ where: { bankId: bank.id }, select: { key: true } })).map((q) => q.key),
    );
    const fresh = b.questions.filter((q) => !existingKeys.has(q.key));
    if (fresh.length) {
      await db.question.createMany({
        data: fresh.map((q) => ({ bankId: bank.id, version: 1, ...questionData(q) })),
      });
      report.created.push(`${fresh.length} question(s) in ${b.slug}`);
    }
  }

  // Module assessments + default prerequisite (all lessons in the module completed)
  for (const p of content.pathways.pathways) {
    for (const m of p.modules) {
      if (!m.assessment) continue;
      const moduleId = moduleIds.get(m.slug)!;
      let assessment = await db.assessment.findUnique({ where: { slug: m.assessment.slug } });
      if (!assessment) {
        assessment = await db.assessment.create({
          data: {
            slug: m.assessment.slug,
            title: m.assessment.title,
            kind: "MODULE",
            bankId: bankIds.get(m.assessment.bank)!,
            moduleId,
            drawCount: m.assessment.drawCount,
            passMark: m.assessment.passMark,
            cooldownMinutes: m.assessment.cooldownMinutes,
          },
        });
        report.created.push(`assessment ${m.assessment.slug}`);
        await db.prerequisite.create({
          data: { targetType: "ASSESSMENT", targetId: assessment.id, requirement: "LESSONS_COMPLETED", requiredId: moduleId },
        });
      }
    }
  }
  return report;
}
