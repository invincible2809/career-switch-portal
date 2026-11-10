import "server-only";
import { db } from "../db";
import { lessonSections } from "../learning";
import { matchGlossary, plainText, rankSections, type SectionDoc } from "@/lib/coach/retrieve";
import { checkRequest } from "@/lib/coach/guard";
import { SKILLS_BY_INDUSTRY, type IndustryId } from "@/lib/onboarding/skills-map";
import { LESSON_PARTS } from "@/lib/content/lesson-parts";

export type CoachMode = "ask" | "simpler" | "my-job";

export interface CoachReply {
  kind: "answer" | "hint" | "no-match";
  intro: string;
  excerpts: { lessonSlug: string; lessonTitle: string; sectionKey: string; sectionTitle: string; excerpt: string }[];
  glossary: { slug: string; term: string; definition: string }[];
  skills: { skill: string; example: string }[];
  practice?: { lessonSlug: string; lessonTitle: string };
}

const partLabel = (k: string) => LESSON_PARTS.find((p) => p.key === k)?.label ?? k;

async function sectionIndex(): Promise<SectionDoc[]> {
  const lessons = await db.lesson.findMany({
    where: { publishedVersionId: { not: null }, module: { availability: "AVAILABLE", status: "PUBLISHED" } },
    include: { publishedVersion: true },
  });
  return lessons.flatMap((l) =>
    lessonSections(l.publishedVersion!)
      .filter((s) => !["knowledge-check", "glossary", "next-step"].includes(s.key))
      .map((s) => ({ lessonSlug: l.slug, lessonTitle: l.publishedVersion!.title, sectionKey: s.key, sectionTitle: partLabel(s.key), text: plainText(s.markdown) })),
  );
}

/** Builds a reply from course content only. Learner text is treated as plain data. */
export async function coachReply(question: string, mode: CoachMode, industry: IndustryId | null, pathway: "SCRUM_MASTER" | "QA_TESTER" = "QA_TESTER"): Promise<CoachReply> {
  const assessed = await db.question.findMany({
    where: { active: true, draft: false, generator: null, bank: { purpose: "MODULE" } },
    select: { stem: true, scenario: true },
  });
  const guard = checkRequest(question, assessed.map((q) => `${q.scenario ?? ""} ${q.stem}`.trim()));
  const [docs, terms] = await Promise.all([sectionIndex(), db.glossaryTerm.findMany({ select: { slug: true, term: true, definition: true } })]);
  const hits = rankSections(question, docs, mode === "ask" ? 3 : 2);
  const glossary = matchGlossary(question, terms);
  const top = hits[0]?.doc;
  const excerpts = hits.map((h) => ({ lessonSlug: h.doc.lessonSlug, lessonTitle: h.doc.lessonTitle, sectionKey: h.doc.sectionKey, sectionTitle: h.doc.sectionTitle, excerpt: h.excerpt }));

  if (guard.kind !== "ok") {
    return {
      kind: "hint",
      intro:
        guard.kind === "assignment-request"
          ? "I can't write assignment work or give answers to assessed questions – but here's where to look, and you can ask me about any idea you're unsure of."
          : "That looks like an assessment question, so I won't give the answer. Here's a hint: these parts of the course explain the idea behind it.",
      excerpts: excerpts.map((e) => ({ ...e, excerpt: "" })),
      glossary,
      skills: [],
      practice: top ? { lessonSlug: top.lessonSlug, lessonTitle: top.lessonTitle } : undefined,
    };
  }

  if (!hits.length && !glossary.length) {
    return {
      kind: "no-match",
      intro: "I couldn't find that in the course yet. Try different words, search the glossary, or add a question to your notes to come back to.",
      excerpts: [],
      glossary: [],
      skills: [],
    };
  }

  if (mode === "simpler" && top) {
    const worked = docs.find((d) => d.lessonSlug === top.lessonSlug && d.sectionKey === "worked-example");
    return {
      kind: "answer",
      intro: "Here's the most relevant part of the course, with a worked example.",
      excerpts: worked ? [excerpts[0], { lessonSlug: worked.lessonSlug, lessonTitle: worked.lessonTitle, sectionKey: worked.sectionKey, sectionTitle: worked.sectionTitle, excerpt: plainText(worked.text).split(" ").slice(0, 60).join(" ") + "…" }] : excerpts.slice(0, 1),
      glossary,
      skills: [],
      practice: { lessonSlug: top.lessonSlug, lessonTitle: top.lessonTitle },
    };
  }

  const skills =
    mode === "my-job"
      ? (industry ? SKILLS_BY_INDUSTRY[industry] : SKILLS_BY_INDUSTRY.other)
          .filter((s) => s.helpsWith.includes(pathway))
          .slice(0, 3)
          .map(({ skill, example }) => ({ skill, example }))
      : [];
  return {
    kind: "answer",
    intro:
      mode === "my-job"
        ? industry
          ? "Here's what the course says, and some skills from your previous work that are useful in this role."
          : "Here's what the course says. (Add your previous industry in Settings – with your consent – to get examples from your own work.)"
        : "Here's what the course says about that.",
    excerpts,
    glossary,
    skills,
    practice: top ? { lessonSlug: top.lessonSlug, lessonTitle: top.lessonTitle } : undefined,
  };
}
