import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadContent } from "@/lib/content/load";
import { parseLesson } from "@/lib/content/parse-lesson";
import { questionBankSchema } from "@/lib/content/schemas";
import { LESSON_PARTS } from "@/lib/content/lesson-parts";

describe("course content in content/", () => {
  const content = loadContent();
  it("loads and passes every check", () => {
    expect(content.lessons.length).toBeGreaterThan(0);
  });
  it("has module banks of at least 25 questions", () => {
    for (const b of content.banks.filter((b) => b.purpose === "MODULE")) expect(b.questions.length).toBeGreaterThanOrEqual(25);
  });
  it("never claims certification in learner-facing text", () => {
    const text = [
      ...content.lessons.map((l) => JSON.stringify(l.sections)),
      ...content.banks.map((b) => JSON.stringify(b.questions)),
    ].join(" ");
    expect(text).not.toMatch(/\bcertified\b|\baccredited\b/i);
  });
});

const lessonWithParts = (parts: readonly { key: string; label: string }[]) =>
  [
    "---",
    "slug: test-lesson",
    "module: foundations",
    "order: 1",
    "title: Test lesson",
    "estimatedMinutes: 10",
    "objectives: [Do a thing]",
    "knowledgeCheck: kc",
    "---",
    ...parts.map((p) => `## ${p.label} {#${p.key}}\nText.`),
  ].join("\n");

describe("parseLesson", () => {
  it("accepts a lesson with all nine parts in order", () => {
    expect(parseLesson(lessonWithParts(LESSON_PARTS)).sections).toHaveLength(9);
  });
  it("rejects a lesson with a missing part, naming what's expected", () => {
    expect(() => parseLesson(lessonWithParts(LESSON_PARTS.slice(0, 8)), "x.md")).toThrow(/x\.md: lessons need these nine parts/);
  });
  it("rejects bad front matter with the field name", () => {
    expect(() => parseLesson(lessonWithParts(LESSON_PARTS).replace("estimatedMinutes: 10", "estimatedMinutes: 2"), "y.md")).toThrow(/estimatedMinutes/);
  });
});

describe("question bank rules", () => {
  const q = (over: object) => ({
    key: "k1",
    type: "SINGLE",
    objective: "o",
    lessonRef: { lesson: "l", section: "explanation" },
    stem: "s",
    options: [
      { id: "a", text: "A", correct: true, explanation: "e" },
      { id: "b", text: "B", explanation: "e" },
    ],
    ...over,
  });
  const bank = (questions: object[], purpose = "KNOWLEDGE_CHECK") => ({ slug: "b", title: "B", purpose, questions });
  const messages = (r: ReturnType<typeof questionBankSchema.safeParse>) => (r.success ? "" : r.error.issues.map((i) => i.message).join("; "));

  it("needs exactly one correct option for single choice", () => {
    const r = questionBankSchema.safeParse(bank([q({ options: [{ id: "a", text: "A", explanation: "e" }, { id: "b", text: "B", explanation: "e" }] }), q({ key: "k2" }), q({ key: "k3" })]));
    expect(messages(r)).toMatch(/exactly one correct option/);
  });
  it("needs an explanation for every option", () => {
    const r = questionBankSchema.safeParse(bank([q({ options: [{ id: "a", text: "A", correct: true, explanation: "" }, { id: "b", text: "B", explanation: "e" }] }), q({ key: "k2" }), q({ key: "k3" })]));
    expect(messages(r)).toMatch(/Every option needs an explanation/);
  });
  it("needs 25+ questions in a module bank", () => {
    expect(messages(questionBankSchema.safeParse(bank([q({})], "MODULE")))).toMatch(/at least 25/);
  });
  it("rejects duplicate keys", () => {
    expect(messages(questionBankSchema.safeParse(bank([q({}), q({}), q({ key: "k3" })])))).toMatch(/Duplicate question keys/);
  });
});

describe("loadContent cross-file checks", () => {
  it("reports links to missing lessons", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-"));
    fs.cpSync(path.join(process.cwd(), "content"), dir, { recursive: true });
    const file = path.join(dir, "questions", "foundations-l1-check.yaml");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("lesson: how-software-is-built, section: workplace-example", "lesson: no-such-lesson, section: workplace-example"));
    expect(() => loadContent(dir)).toThrow(/unknown lesson "no-such-lesson"/);
    fs.rmSync(dir, { recursive: true });
  });
});
