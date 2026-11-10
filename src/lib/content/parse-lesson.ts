import matter from "gray-matter";
import { LESSON_PARTS, type LessonSection } from "./lesson-parts";
import { lessonFrontMatterSchema, type LessonFrontMatter } from "./schemas";

export interface ParsedLesson {
  meta: LessonFrontMatter;
  sections: LessonSection[];
}

const HEADING = /^##\s+(.+?)\s*\{#([a-z-]+)\}\s*$/;

/** Parses a lesson Markdown file and checks that all nine parts are present and in order. */
export function parseLesson(source: string, fileLabel = "lesson"): ParsedLesson {
  const { data, content } = matter(source);
  const fm = lessonFrontMatterSchema.safeParse(data);
  if (!fm.success) {
    throw new Error(
      `${fileLabel}: front matter is invalid – ${fm.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }
  const sections: LessonSection[] = [];
  let current: { key: string; title: string; lines: string[] } | null = null;
  for (const line of content.split(/\r?\n/)) {
    const m = HEADING.exec(line);
    if (m) {
      if (current) sections.push(toSection(current));
      current = { title: m[1], key: m[2], lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else if (line.trim()) {
      throw new Error(`${fileLabel}: text found before the first "## … {#objective}" heading`);
    }
  }
  if (current) sections.push(toSection(current));

  const expected = LESSON_PARTS.map((p) => p.key);
  const found = sections.map((s) => s.key);
  if (found.join(",") !== expected.join(",")) {
    throw new Error(
      `${fileLabel}: lessons need these nine parts in this order: ${expected.join(", ")}. Found: ${found.join(", ") || "none"}`,
    );
  }
  if (fm.data.knowledgeCheck === undefined) {
    throw new Error(`${fileLabel}: front matter needs a knowledgeCheck bank slug`);
  }
  return { meta: fm.data, sections };
}

function toSection(s: { key: string; title: string; lines: string[] }): LessonSection {
  return { key: s.key as LessonSection["key"], title: s.title, markdown: s.lines.join("\n").trim() };
}

/** Plain text used for site search. */
export function lessonSearchText(title: string, sections: LessonSection[]): string {
  return [title, ...sections.map((s) => `${s.title}\n${s.markdown}`)]
    .join("\n")
    .replace(/:::\w+/g, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[#*_>`]/g, "");
}
