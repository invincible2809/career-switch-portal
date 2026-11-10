import { expect, test } from "@playwright/test";
import { attemptSnapshots, createLearner, db, markModuleComplete } from "./helpers/db";
import { login } from "./helpers/ui";

const PARTS = ["objective", "explanation", "glossary", "workplace-example", "worked-example", "guided-practice", "challenge", "knowledge-check", "next-step"];

test("every Foundations lesson shows all nine parts, and every glossary link opens a real term", async ({ page }) => {
  const learner = await createLearner("foundations");
  await login(page, learner.email, learner.password);
  const lessons = await db.lesson.findMany({ where: { module: { slug: "foundations" } }, orderBy: { order: "asc" } });
  expect(lessons).toHaveLength(5);

  await page.goto("/pathways/it-foundations/foundations");
  await expect(page.getByRole("main").getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3 }) })).toHaveCount(5);

  const glossaryHrefs = new Set<string>();
  for (const lesson of lessons) {
    await page.goto(`/learn/${lesson.slug}?section=objective`);
    const nav = page.getByRole("navigation", { name: "Parts of this lesson" });
    await expect(nav.getByRole("link")).toHaveCount(9);
    for (const part of PARTS) {
      await page.goto(`/learn/${lesson.slug}?section=${part}`);
      await expect(page.locator("#section-title")).not.toBeEmpty();
      for (const href of await page.locator('main a[href^="/glossary/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")!)))
        glossaryHrefs.add(href);
    }
    // The knowledge check has 3–5 questions.
    await page.goto(`/learn/${lesson.slug}?section=knowledge-check`);
    const n = await page.getByRole("button", { name: "Check answer" }).count();
    expect(n, lesson.slug).toBeGreaterThanOrEqual(3);
    expect(n, lesson.slug).toBeLessThanOrEqual(5);
  }
  expect(glossaryHrefs.size).toBeGreaterThan(20);
  for (const href of glossaryHrefs) expect((await page.request.get(href)).status(), href).toBe(200);
});

test("the Foundations assessment draws questions from more than one lesson", async ({ page }) => {
  const learner = await createLearner("spread");
  await markModuleComplete(learner.id);
  await login(page, learner.email, learner.password);
  await page.goto("/assessments/foundations-assessment");
  await page.getByRole("button", { name: "Start the assessment" }).click();
  await page.waitForURL(/\/attempt\//);
  const items = await attemptSnapshots(page.url().split("/attempt/")[1]);
  const lessons = new Set(items.map((i) => i.snapshot.lessonRef.lessonSlug));
  expect(lessons.size).toBeGreaterThanOrEqual(4);
});
