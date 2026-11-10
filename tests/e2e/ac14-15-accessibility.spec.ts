import { expect, test, type Page } from "@playwright/test";
import { createLearner, db, markModuleComplete, passAssessment } from "./helpers/db";
import { expectNoHorizontalScroll, expectNoSeriousA11yViolations, login, loginAsAdmin, logout } from "./helpers/ui";

async function learnerPages(page: Page) {
  const learner = await createLearner("a11y");
  await markModuleComplete(learner.id);
  await passAssessment(learner.id, "scrum-fundamentals-assessment");
  await passAssessment(learner.id, "testing-foundations-assessment");
  await login(page, learner.email, learner.password);
  // Create an attempt so the attempt and result pages exist.
  await page.goto("/assessments/foundations-assessment");
  await page.getByRole("button", { name: "Start the assessment" }).click();
  const attemptUrl = new URL(page.url()).pathname;
  await page.getByRole("button", { name: "Submit answers" }).click();
  await page.waitForURL(/\/result$/);
  const resultUrl = new URL(page.url()).pathname;
  return [
    "/dashboard",
    "/pathways",
    "/pathways/it-foundations",
    "/pathways/it-foundations/foundations",
    "/pathways/qa-tester",
    "/learn/how-software-is-built?section=objective",
    "/learn/how-software-is-built?section=guided-practice",
    "/learn/how-software-is-built?section=knowledge-check",
    "/learn/how-teams-plan-and-test?section=explanation",
    "/learn/requirements-and-user-stories?section=workplace-example",
    "/learn/web-apps-databases-apis?section=explanation",
    "/learn/tools-and-security?section=guided-practice",
    "/assessments/foundations-assessment",
    attemptUrl.replace(/\/result$/, ""),
    resultUrl,
    "/learn/the-scrum-team?section=explanation",
    "/learn/levels-types-and-risk?section=worked-example",
    "/assignments/scrum-team-diagnosis",
    "/assignments/checkout-testing",
    "/lab",
    "/lab/shop",
    "/lab/test-cases",
    "/lab/defects",
    "/lab/sql",
    "/lab/api",
    "/coach",
    "/coach/interview",
    "/coach/roleplay/pushy-stakeholder",
    "/portfolio",
    "/career",
    "/certificate",
    "/review",
    "/notes",
    "/bookmarks",
    "/glossary",
    "/glossary/developer",
    "/search?q=tester",
    "/settings",
    "/settings/accessibility",
    "/settings/data",
  ];
}

const PUBLIC_PAGES = ["/", "/login", "/register", "/forgot-password", "/privacy"];

test("AC14: no serious accessibility violations on key pages (axe)", async ({ page }) => {
  test.setTimeout(240_000); // ~40 pages, each compiled on first visit by the dev server
  for (const url of PUBLIC_PAGES) {
    await page.goto(url);
    await expectNoSeriousA11yViolations(page);
  }
  // Onboarding pages
  const fresh = await db.user.create({
    data: { email: `a11y-onb-${Date.now()}@test.local`, displayName: "New Person", passwordHash: (await createLearner("tmp")).passwordHash, profile: { create: {} }, accessibility: { create: {} } },
  });
  await login(page, fresh.email, "CorrectHorse42!");
  await page.goto("/onboarding");
  await expectNoSeriousA11yViolations(page);
  await page.getByRole("button", { name: "Save and continue" }).click(); // shows the error summary
  await expect(page.getByText("There is a problem")).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await logout(page);

  for (const url of await learnerPages(page)) {
    await page.goto(url);
    await expectNoSeriousA11yViolations(page);
  }
  // The Lab checkout has one deliberate defect for learners to find: the postcode box has no label.
  // Only that exact violation is allowed – anything else on the page still fails.
  await page.goto("/lab/shop/checkout");
  await expectNoSeriousA11yViolations(page, [{ id: "label", target: "#lab-postcode" }]);
  await logout(page);

  await loginAsAdmin(page);
  const lesson = await db.lesson.findFirstOrThrow();
  const bank = await db.questionBank.findFirstOrThrow({ where: { slug: "foundations-assessment" } });
  const assessment = await db.assessment.findFirstOrThrow();
  const mod = await db.module.findFirstOrThrow({ where: { slug: "foundations" } });
  for (const url of [
    "/admin",
    "/admin/curriculum",
    `/admin/modules/${mod.id}`,
    `/admin/lessons/${lesson.id}`,
    "/admin/question-banks",
    `/admin/question-banks/${bank.id}`,
    "/admin/assessments",
    `/admin/assessments/${assessment.id}`,
    "/admin/users",
    "/admin/audit-log",
    "/admin/submissions",
    "/admin/review-queue",
    "/admin/reports",
  ]) {
    await page.goto(url);
    await expectNoSeriousA11yViolations(page);
  }
});

test.describe("AC15: works at 375px wide", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("key pages have no sideways scrolling and the menu works", async ({ page }) => {
    test.setTimeout(180_000);
    for (const url of PUBLIC_PAGES) {
      await page.goto(url);
      await expectNoHorizontalScroll(page);
    }
    for (const url of await learnerPages(page)) {
      await page.goto(url);
      await expectNoHorizontalScroll(page);
    }
    await page.goto("/dashboard");
    await page.getByText("Menu").click();
    await expect(page.getByRole("navigation", { name: "Main (mobile)" }).getByRole("link", { name: "Pathways" })).toBeVisible();
  });
});

test("AC15: key journeys work with the keyboard only", async ({ page }) => {
  const learner = await createLearner("keyboard");
  await markModuleComplete(learner.id);

  // Skip link
  await page.goto("/login");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();

  // Log in with the keyboard
  await page.getByLabel("Email").focus();
  await page.keyboard.type(learner.email);
  await page.keyboard.press("Tab");
  await page.keyboard.type(learner.password);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/dashboard/);

  // Move through a lesson with the keyboard
  await page.goto("/learn/how-software-is-built?section=objective");
  const next = page.getByRole("link", { name: /Next: Explanation/ });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/section=explanation/);

  // Expand a hint with the keyboard
  await page.goto("/learn/how-software-is-built?section=guided-practice");
  await page.locator("summary", { hasText: "Show hint 1" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Think about which role decides what the product should do next")).toBeVisible();

  // Answer and submit an assessment with the keyboard
  await page.goto("/assessments/foundations-assessment");
  await page.getByRole("button", { name: "Start the assessment" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/attempt\//);
  const firstChoice = page.getByTestId("assessment-question").first().locator("input, select").first();
  await firstChoice.focus();
  const tag = await firstChoice.evaluate((el) => el.tagName);
  if (tag === "SELECT") await page.keyboard.press("ArrowDown");
  else await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Submit answers" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/result$/);
  await expect(page.getByTestId("score-summary")).toBeVisible();

  // Focus is always visible
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe("none");
});
