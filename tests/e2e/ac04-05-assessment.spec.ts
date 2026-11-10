import { expect, test } from "@playwright/test";
import { attemptSnapshots, createLearner, markModuleComplete } from "./helpers/db";
import { answerAttempt, login } from "./helpers/ui";

test("the assessment is locked until the module's lessons are finished", async ({ page }) => {
  const learner = await createLearner("locked");
  await login(page, learner.email, learner.password);
  await page.goto("/assessments/foundations-assessment");
  await expect(page.getByText("Not unlocked yet")).toBeVisible();
  await expect(page.getByText("Finish all lessons in IT Foundations")).toBeVisible();
  await expect(page.getByRole("button", { name: /Start/ })).toHaveCount(0);
});

test("AC4: take a module assessment and get correct scores and explanations", async ({ page }) => {
  const learner = await createLearner("ac4");
  await markModuleComplete(learner.id);
  await login(page, learner.email, learner.password);
  await page.goto("/assessments/foundations-assessment");
  await page.getByRole("button", { name: "Start the assessment" }).click();
  await expect(page.getByTestId("assessment-question")).toHaveCount(10);
  const { items } = await answerAttempt(page, (i) => i % 2 === 0); // 5 right, 5 wrong
  await page.getByRole("button", { name: "Submit answers" }).click();

  await expect(page.getByText("You scored 50% (5 out of 10)")).toBeVisible();
  await expect(page.getByText(/Not passed yet\./)).toBeVisible();
  const feedback = page.getByTestId("feedback-question");
  await expect(feedback).toHaveCount(10);
  // Every option of every question is explained.
  for (const [i, { snapshot }] of items.entries()) {
    const card = feedback.nth(i);
    await expect(card.getByText(i % 2 === 0 ? "✓ You got this right" : "✗ Not quite")).toBeVisible();
    for (const o of snapshot.options) await expect(card.getByText(o.explanation, { exact: false }).first()).toBeVisible();
  }
});

test("AC5: fail, see remediation links, and retry with different questions", async ({ page }) => {
  const learner = await createLearner("ac5");
  await markModuleComplete(learner.id);
  await login(page, learner.email, learner.password);
  await page.goto("/assessments/foundations-assessment");
  await page.getByRole("button", { name: "Start the assessment" }).click();
  const first = await answerAttempt(page, () => false);
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page.getByText("You scored 0%")).toBeVisible();

  const links = page.getByTestId("remediation-links").getByRole("link");
  expect(await links.count()).toBeGreaterThan(0);
  const href = await links.first().getAttribute("href");
  expect(href).toMatch(/^\/learn\/[a-z-]+\?section=[a-z-]+$/);
  await expect(page.getByRole("main").getByRole("link", { name: "quick review", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Try again with different questions" }).click();
  await page.getByRole("button", { name: "Start a new attempt" }).click();
  await expect(page).toHaveURL(/\/attempt\//);
  const secondId = page.url().split("/attempt/")[1];
  const second = await attemptSnapshots(secondId);
  const firstKeys = new Set(first.items.map((i) => i.snapshot.key));
  expect(second.map((s) => s.snapshot.key).filter((k) => firstKeys.has(k))).toEqual([]);

  // The remediation link opens the exact lesson section.
  await page.goto(href!);
  await expect(page.locator("[aria-current=step]")).toBeVisible();
});

test("missed questions come back in quick review", async ({ page }) => {
  const learner = await createLearner("review");
  await markModuleComplete(learner.id);
  await login(page, learner.email, learner.password);
  await page.goto("/assessments/foundations-assessment");
  await page.getByRole("button", { name: "Start the assessment" }).click();
  await answerAttempt(page, (i) => i !== 0);
  await page.getByRole("button", { name: "Submit answers" }).click();
  await page.waitForURL(/\/result$/);
  await page.goto("/review");
  await expect(page.getByText(/Nothing to review right now/)).toBeVisible();
  await expect(page.getByText(/1 question is scheduled for later/)).toBeVisible();
});
