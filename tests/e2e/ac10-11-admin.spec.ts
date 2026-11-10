import { expect, test } from "@playwright/test";
import { createLearner, db, markModuleComplete, setPassMark } from "./helpers/db";
import { answerAttempt, login, loginAsAdmin, logout } from "./helpers/ui";

test("AC10: admin edits and publishes a lesson, and learners see the change", async ({ page }) => {
  const lesson = await db.lesson.findUniqueOrThrow({ where: { slug: "how-software-is-built" } });
  await loginAsAdmin(page);
  await page.goto(`/admin/lessons/${lesson.id}`);
  // Start a draft unless another test left one open.
  const edit = page.getByRole("button", { name: "Edit lesson (start a draft)" });
  if (await edit.isVisible()) await edit.click();
  const newText = `Updated by an admin at ${Date.now()}.`;
  const explanation = page.getByLabel("Content").nth(1);
  await explanation.fill(`${newText}\n\n${await explanation.inputValue()}`);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft saved.")).toBeVisible();

  // Not visible to learners while it's a draft.
  const learner = await createLearner("ac10");
  const learnerCtx = await page.context().browser()!.newContext();
  const lp = await learnerCtx.newPage();
  await login(lp, learner.email, learner.password);
  await lp.goto("/learn/how-software-is-built?section=explanation");
  await expect(lp.getByText(newText)).toHaveCount(0);

  await page.reload();
  await page.getByRole("button", { name: "Send for review" }).click();
  await expect(page.getByText("Sent for review.")).toBeVisible();
  await page.getByRole("button", { name: "Approve and publish" }).click();
  await expect(page.getByText(/Published\. Learners now see this version/)).toBeVisible();

  await lp.reload();
  await expect(lp.getByText(newText)).toBeVisible();
  await page.goto("/admin/audit-log");
  await expect(page.getByTestId("audit-log").getByText("lesson.publish").first()).toBeVisible();
  await learnerCtx.close();
});

test("AC10: admin edits and publishes a question bank, and learners see the change", async ({ page }) => {
  const bank = await db.questionBank.findUniqueOrThrow({ where: { slug: "foundations-l1-check" } });
  await loginAsAdmin(page);
  await page.goto(`/admin/question-banks/${bank.id}`);
  const card = page.locator("li", { hasText: "fl1-kc-01" });
  await card.getByText("Edit question").click();
  const newStem = `Which role writes the code at ShopEasy? (${Date.now()})`;
  await card.getByLabel("Question", { exact: true }).fill(newStem);
  await card.getByRole("button", { name: "Save as draft" }).click();
  await expect(card.getByText("Saved as a draft.")).toBeVisible();

  const learner = await createLearner("ac10b");
  const ctx = await page.context().browser()!.newContext();
  const lp = await ctx.newPage();
  await login(lp, learner.email, learner.password);
  await lp.goto("/learn/how-software-is-built?section=knowledge-check");
  await expect(lp.getByText(newStem)).toHaveCount(0);

  await page.reload();
  await page.getByRole("button", { name: "Publish bank changes" }).click();
  await expect(page.getByText(/Published 1 change/)).toBeVisible();
  await lp.reload();
  await expect(lp.getByText(newStem)).toBeVisible();
  await ctx.close();
});

test("AC11: admin changes the pass mark and it applies to new attempts only", async ({ page }) => {
  const learner = await createLearner("ac11");
  await markModuleComplete(learner.id);
  const assessment = await db.assessment.findUniqueOrThrow({ where: { slug: "foundations-assessment" } });
  try {
    // An attempt under the old pass mark (80%): 6/10 fails.
    await login(page, learner.email, learner.password);
    await page.goto("/assessments/foundations-assessment");
    await page.getByRole("button", { name: "Start the assessment" }).click();
    await answerAttempt(page, (i) => i < 6);
    await page.getByRole("button", { name: "Submit answers" }).click();
    await expect(page.getByText("The pass mark for this attempt was 80%")).toBeVisible();
    const oldResult = page.url();
    await logout(page);

    await loginAsAdmin(page);
    await page.goto(`/admin/assessments/${assessment.id}`);
    await page.getByLabel("Pass mark (%)").fill("60");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText(/Saved\. The new settings apply/)).toBeVisible();
    await logout(page);

    await login(page, learner.email, learner.password);
    await page.goto("/assessments/foundations-assessment");
    await expect(page.getByText("The pass mark is 60%")).toBeVisible();
    await page.getByRole("button", { name: "Start a new attempt" }).click();
    await answerAttempt(page, (i) => i < 6);
    await page.getByRole("button", { name: "Submit answers" }).click();
    await expect(page.getByText(/Passed\./)).toBeVisible();
    await expect(page.getByText("The pass mark for this attempt was 60%")).toBeVisible();
    // The earlier attempt keeps the pass mark it started with.
    await page.goto(oldResult);
    await expect(page.getByText("The pass mark for this attempt was 80%")).toBeVisible();
  } finally {
    await setPassMark("foundations-assessment", 80);
  }
});
