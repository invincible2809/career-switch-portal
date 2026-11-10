import { describe, expect, it } from "vitest";
import { renderMarkdown, markdownToSpeech } from "@/lib/lesson/markdown";
import { can } from "@/lib/permissions";

describe("renderMarkdown", () => {
  it("removes scripts, raw HTML and javascript: links", () => {
    const html = renderMarkdown('Hi <script>alert(1)</script> <img src=x onerror=alert(1)> [x](javascript:alert(1))');
    expect(html).not.toMatch(/<script|onerror|javascript:/);
  });
  it("turns :::hint into an expandable hint", () => {
    expect(renderMarkdown(":::hint\nThink.\n:::")).toMatch(/<details class="hint"><summary>Show hint 1<\/summary>/);
  });
  it("links glossary terms", () => {
    expect(renderMarkdown("A [[Developer|developers]] works")).toContain('<a href="/glossary/developer" class="glossary-link">developers</a>');
  });
  it("produces plain text for read aloud", () => {
    expect(markdownToSpeech("**Hello** [[bug]] :::hint\nx\n:::")).toBe("Hello bug x");
  });
});

describe("permissions", () => {
  it("gives learners no admin actions", () => {
    expect(can("LEARNER", "admin:access")).toBe(false);
    expect(can("LEARNER", "content:publish")).toBe(false);
  });
  it("gives admins admin actions", () => {
    expect(can("ADMIN", "admin:access")).toBe(true);
    expect(can("ADMIN", "users:manage")).toBe(true);
  });
});
