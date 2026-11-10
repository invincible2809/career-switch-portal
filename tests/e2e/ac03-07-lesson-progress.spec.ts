import { expect, test } from "@playwright/test";
import { createLearner } from "./helpers/db";
import { answerAttempt, login, logout } from "./helpers/ui";

test("AC3: leave a lesson part-way through and resume at the same section", async ({ page }) => {
  const learner = await createLearner("ac3");
  await login(page, learner.email, learner.password);
  await page.getByTestId("continue-link").click();
  await expect(page).toHaveURL(/\/learn\/how-software-is-built\?section=objective/);
  await page.getByRole("link", { name: /Next: Explanation/ }).click();
  await page.getByRole("link", { name: /Next: New terms/ }).click();
  await page.getByRole("link", { name: /Next: At ShopEasy/ }).click();
  await expect(page.getByRole("heading", { name: "At ShopEasy", level: 2 })).toBeVisible();
  await page.waitForTimeout(500); // let the position save

  await logout(page);
  await login(page, learner.email, learner.password);
  await expect(page.getByTestId("continue-link")).toHaveText(/Continue: How software is built/);
  await page.getByTestId("continue-link").click();
  await expect(page).toHaveURL(/section=workplace-example/);
  await expect(page.getByText("Part 4 of 9: At ShopEasy")).toBeVisible();
});

test("notes and bookmarks are saved per lesson", async ({ page }) => {
  const learner = await createLearner("notes");
  await login(page, learner.email, learner.password);
  await page.goto("/learn/how-software-is-built?section=worked-example");
  await page.getByRole("button", { name: "Bookmark this section" }).click();
  await expect(page.getByRole("button", { name: "Remove bookmark" })).toBeVisible();
  await page.getByLabel("Add a note").fill("Rounding bugs: check every basket, not just one.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Rounding bugs: check every basket")).toBeVisible();
  await page.goto("/bookmarks");
  await expect(page.getByRole("link", { name: /How software is built, and who does what – Worked example/ })).toBeVisible();
  await page.goto("/notes");
  await expect(page.getByText("Rounding bugs: check every basket")).toBeVisible();
});

test("knowledge check gives feedback for every option", async ({ page }) => {
  const learner = await createLearner("kc");
  await login(page, learner.email, learner.password);
  await page.goto("/learn/how-software-is-built?section=knowledge-check");
  const q = page.locator("form", { hasText: "Who usually writes and changes the code" });
  await q.getByLabel("A designer").check();
  await q.getByRole("button", { name: "Check answer" }).click();
  await expect(q.getByText("Not quite – here's why.")).toBeVisible();
  await expect(q.getByText(/Designers plan how screens look/)).toBeVisible();
  await expect(q.getByText(/Correct\. Developers write and change the code/)).toBeVisible();
});

test("AC7: log out and back in and see accurate progress and history", async ({ page }) => {
  const learner = await createLearner("ac7");
  await login(page, learner.email, learner.password);
  // Finish the lesson through the UI
  await page.goto("/learn/how-software-is-built?section=next-step");
  await page.getByRole("button", { name: "Mark lesson as complete" }).click();
  await expect(page.getByText(/You finished "How software is built/)).toBeVisible();
  // Take the assessment: 8 of 10 right = pass
  await page.goto("/assessments/foundations-assessment");
  await page.getByRole("button", { name: "Start the assessment" }).click();
  await answerAttempt(page, (i) => i < 8);
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page.getByText("You scored 80% (8 out of 10)")).toBeVisible();

  await logout(page);
  await login(page, learner.email, learner.password);
  const card = page.getByTestId("module-progress-foundations");
  await expect(card.getByText("Lessons finished: 1 of 1")).toBeVisible();
  await expect(card.getByText("Passed")).toBeVisible();
  const history = page.getByTestId("assessment-history");
  await expect(history.getByRole("cell", { name: "80%" })).toBeVisible();
  await expect(history.getByRole("cell", { name: "Passed" })).toBeVisible();
});
