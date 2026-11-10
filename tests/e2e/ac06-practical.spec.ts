import { expect, test, type Page } from "@playwright/test";
import { createLearner, db, passAssessment } from "./helpers/db";
import { login, loginAsAdmin, logout } from "./helpers/ui";

async function fillScrumForm(page: Page) {
  await page.locator("#diagnosis").fill(
    "Work rolls over because items are too large and testing piles up at the end. Stakeholders bypass the Product Owner, so the Sprint Goal is put at risk, and the Product Owner isn't available to clarify items.",
  );
  const imps = [
    ["Marketing requests go straight to Developers", "Sprint Goal missed", "Lena (Product Owner)", "Agree with Raj that requests go to Lena", "Open"],
    ["Test environment crashes", "Half a day lost each time", "Infrastructure lead", "Show the lost time to the infrastructure lead this week", "In progress"],
    ["Product Owner rarely available", "Developers guess requirements", "Lena and her manager", "Agree two fixed refinement slots a week", "Open"],
  ];
  for (const [i, row] of imps.entries()) {
    await page.locator(`#imp_${i}_impediment`).fill(row[0]);
    await page.locator(`#imp_${i}_impact`).fill(row[1]);
    await page.locator(`#imp_${i}_owner`).fill(row[2]);
    await page.locator(`#imp_${i}_nextStep`).fill(row[3]);
    await page.locator(`#imp_${i}_status`).selectOption(row[4]);
  }
  await page.locator("#retroGoal").fill("Understand why work keeps rolling over and agree one change");
  const rows = [
    ["set-the-stage", "One-word check-in", "5"],
    ["gather-data", "Timeline of the last Sprint", "15"],
    ["generate-insights", "5 whys on unfinished items", "20"],
    ["decide-what-to-do", "Dot-vote and agree one owned action", "15"],
    ["close", "Appreciations", "5"],
  ];
  for (const [i, r] of rows.entries()) {
    await page.locator(`#retro_${i}_stage`).selectOption(r[0]);
    await page.locator(`#retro_${i}_activity`).fill(r[1]);
    await page.locator(`#retro_${i}_minutes`).fill(r[2]);
  }
  await page.locator("#self_diagnosis").selectOption("3");
  await page.locator("#self_facilitation").selectOption("3");
}

test("AC6: a practical assignment is locked until the module assessment is passed", async ({ page }) => {
  const learner = await createLearner("ac6lock", "scrum-master");
  await login(page, learner.email, learner.password);
  await page.goto("/assignments/scrum-team-diagnosis");
  await expect(page.getByText("Not unlocked yet")).toBeVisible();
  await expect(page.getByText("Pass Scrum fundamentals – module assessment")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit my work" })).toHaveCount(0);
});

test("AC6: submit, see rubric feedback, and competency only once the minimum is met", async ({ page }) => {
  const learner = await createLearner("ac6", "scrum-master");
  await passAssessment(learner.id, "scrum-fundamentals-assessment");
  await login(page, learner.email, learner.password);
  await page.goto("/assignments/scrum-team-diagnosis");
  await expect(page.getByText("Simulated learning project – not paid work experience.").first()).toBeVisible();
  await fillScrumForm(page);
  await page.getByRole("button", { name: "Submit my work" }).click();
  await page.waitForURL(/\/submissions\//);

  // Submitting alone never shows competency.
  const status = page.getByTestId("competency-status");
  await expect(status.getByText("Awaiting assessor review.")).toBeVisible();
  await expect(status.getByText("Competency demonstrated")).toHaveCount(0);
  const impLog = page.getByTestId("criterion-impediment-log");
  await expect(impLog.getByText("3 out of 3")).toBeVisible();
  await expect(impLog.getByText("(automated guidance from course content – not reviewed by a person)")).toBeVisible();
  await expect(page.getByTestId("criterion-retro-structure").getByText("3 out of 3")).toBeVisible();
  const diagnosis = page.getByTestId("criterion-diagnosis");
  await expect(diagnosis.getByText("Awaiting assessor review")).toBeVisible();
  await expect(diagnosis.getByText("3 out of 3 (doesn't count towards competency)")).toBeVisible();
  const submissionUrl = page.url();
  await logout(page);

  // An assessor scores the judgement criteria.
  await loginAsAdmin(page);
  await page.goto("/admin/submissions");
  await page.getByTestId("submission-list").getByRole("link", { name: /Diagnose a struggling team.*Test ac6/ }).first().click();
  await page.getByLabel("Your score for Diagnosis of the team's problems").selectOption("2");
  await page.getByLabel("Your score for Scrum accuracy and the Scrum Master's stance").selectOption("3");
  await page.getByLabel("Your score for Facilitation and team ownership").selectOption("2");
  await page.getByLabel("Comment for the learner").first().fill("Good link between oversized items and roll-over.");
  await page.getByRole("button", { name: "Save scores" }).click();
  await expect(page.getByText("Scores saved. Competency demonstrated.")).toBeVisible();
  await logout(page);

  await login(page, learner.email, learner.password);
  await page.goto(submissionUrl);
  await expect(status.getByText("Competency demonstrated.")).toBeVisible();
  await expect(status.getByText("Reviewed by an assessor.")).toBeVisible();
  await expect(page.getByText("Good link between oversized items and roll-over.")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByTestId("module-progress-scrum-fundamentals").getByText("Practical skills shown: 1 of 1")).toBeVisible();
});

test("AC6: competency isn't shown when a criterion is below the minimum, and the defect list stays hidden until submission", async ({ page }) => {
  const learner = await createLearner("ac6qa", "qa-tester");
  await passAssessment(learner.id, "testing-foundations-assessment");
  // Six test cases run in the Lab, but only the quantity boundaries are covered.
  for (const [i, data] of ["0", "1", "10", "11", "sw1a 1aa", "SAVE10 on £30"].entries()) {
    await db.labTestCase.create({
      data: { userId: learner.id, title: `Test ${i + 1}`, technique: i < 4 ? "BVA" : "EP", preconditions: "", testData: data, steps: "Enter it in the demo shop", expected: "As the specification says", status: "PASS", executedAt: new Date() },
    });
  }
  const defects = [
    ["basket", "Quantity of 0 accepted", "Quantity 0 should be rejected with a message", "Quantity 0 was accepted"],
    ["checkout", "Delivery charged at exactly £50", "Delivery should be free at £50.00", "£3.95 delivery was charged"],
    ["login", "Logo looks old", "A new logo", "The old logo"],
  ] as const;
  for (const [area, title, expected, actual] of defects) {
    await db.defectReport.create({ data: { userId: learner.id, area, title, environment: "Test Lab, Chrome", steps: "Follow the steps in the demo shop", expected, actual, severity: "High", priority: "High", evidence: "" } });
  }
  await login(page, learner.email, learner.password);
  await page.goto("/assignments/checkout-testing");
  // The answer key isn't in the page before submitting.
  expect(await page.content()).not.toContain("never locks");
  const fields = ["quantity", "quantity", "quantity", "quantity", "postcode", "discount"];
  for (const [i, f] of fields.entries()) await page.getByLabel(`What test ${i + 1} tests`).selectOption(f);
  await page.getByRole("button", { name: "Submit my work" }).click();
  await page.waitForURL(/\/submissions\//);
  await expect(page.getByTestId("criterion-boundary-coverage").getByText("1 out of 3")).toBeVisible();
  await expect(page.getByTestId("criterion-boundary-coverage").getByText("Below the minimum of 2.")).toBeVisible();
  await expect(page.getByTestId("criterion-defects-identified").getByText("1 out of 3")).toBeVisible();
  await expect(page.getByText("Report 3: not matched")).toBeVisible();
  // Now the full list is revealed.
  await expect(page.getByText(/A quantity of 0 is accepted\.\s*– reported/)).toBeVisible();
  await expect(page.getByText(/SAVE10 can be applied more than once\.\s*– missed/)).toBeVisible();
  const url = page.url();
  await logout(page);

  await loginAsAdmin(page);
  const sub = await db.submission.findFirstOrThrow({ where: { userId: learner.id } });
  await page.goto(`/admin/submissions/${sub.id}`);
  await page.getByLabel("Your score for Clarity of defect reports").selectOption("3");
  await page.getByLabel("Your score for Severity and priority judgement").selectOption("3");
  await page.getByRole("button", { name: "Save scores" }).click();
  await expect(page.getByText("Scores saved.", { exact: true })).toBeVisible();
  await logout(page);

  await login(page, learner.email, learner.password);
  await page.goto(url);
  await expect(page.getByTestId("competency-status").getByText("Competency not yet demonstrated.")).toBeVisible();
  expect(await db.competency.count({ where: { userId: learner.id } })).toBe(0);
});
