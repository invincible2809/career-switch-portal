import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { createLearner, db, demonstrateCompetency, markModuleComplete, passAssessment } from "./helpers/db";
import { login, loginAsAdmin, logout } from "./helpers/ui";

const LABEL = "Simulated learning project – not paid work experience";
const qaPayload = {
  testCases: [{ title: "Quantity 0 rejected", field: "quantity", technique: "BVA", testData: "0", steps: "Set quantity to 0", expected: "Rejected", status: "FAIL", actual: "Accepted" }],
  defects: [{ area: "basket", title: "Quantity 0 accepted", environment: "Test Lab", steps: "Set quantity to 0", expected: "Rejected", actual: "Accepted", severity: "Medium", priority: "High", evidence: "" }],
};

test("AC8: add work to the portfolio and export it as a PDF; share link on and off", async ({ page, browser }) => {
  const learner = await createLearner("ac8");
  await demonstrateCompetency(learner.id, "checkout-testing", qaPayload);
  await login(page, learner.email, learner.password);
  await page.goto("/portfolio");
  await page.getByRole("button", { name: "Add to portfolio" }).click();
  await expect(page.getByTestId("portfolio-item")).toHaveCount(1);
  const item = page.getByTestId("portfolio-item").first();
  await expect(item.getByText(LABEL)).toBeVisible();
  await expect(item.getByText("Competency demonstrated – reviewed by an assessor")).toBeVisible();
  await expect(item.getByText(/Quantity 0 rejected \(BVA\)/)).toBeVisible();

  await page.getByLabel("Title").fill("What I learned about boundaries");
  await page.getByLabel("Reflection").fill("Testing the edges of ranges found two of the defects quickly. Next time I'll start there.");
  await page.getByRole("button", { name: "Add reflection" }).click();
  await expect(page.getByTestId("portfolio-item")).toHaveCount(2);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download as PDF" }).click();
  const download = await downloadPromise;
  const pdf = fs.readFileSync(await download.path());
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pdf.length).toBeGreaterThan(2000);

  // Share link
  await page.getByRole("button", { name: "Create a private link" }).click();
  const link = await page.getByTestId("share-link").inputValue();
  expect(link).toMatch(/\/portfolio\/shared\/[A-Za-z0-9_-]{30,}$/);
  const visitor = await browser.newContext();
  const vp = await visitor.newPage();
  await vp.goto(link.replace(/^https?:\/\/[^/]+/, "http://localhost:3100"));
  await expect(vp.getByRole("heading", { name: `Portfolio: ${learner.displayName}` })).toBeVisible();
  await expect(vp.getByText(LABEL).first()).toBeVisible();
  await expect(vp.getByTestId("portfolio-item")).toHaveCount(2);

  // Hide one item, then turn sharing off.
  await page.getByRole("button", { name: 'Hide "What I learned about boundaries" from the share link' }).click();
  await expect(page.getByRole("button", { name: 'Show "What I learned about boundaries" on the share link' })).toBeVisible();
  await vp.reload();
  await expect(vp.getByTestId("portfolio-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Turn off sharing" }).click();
  await expect(page.getByTestId("share-status")).toHaveText("Sharing is off.");
  const res = await vp.goto(link.replace(/^https?:\/\/[^/]+/, "http://localhost:3100"));
  expect(res?.status()).toBe(404);
  await visitor.close();

  // PDF needs a session
  const anon = await browser.newContext();
  expect((await anon.request.get("http://localhost:3100/api/portfolio/pdf")).status()).toBe(401);
  await anon.close();
});

test("coach answers from lessons with links and a label; flagged answers reach the admin queue", async ({ page }) => {
  const learner = await createLearner("coach");
  await login(page, learner.email, learner.password);
  await page.goto("/coach");
  await page.getByLabel("Your question", { exact: true }).fill("What is the Definition of Done?");
  await page.getByRole("button", { name: "Ask the coach" }).click();
  const reply = page.getByTestId("coach-reply").first();
  await expect(reply.getByText("Automated guidance from course content – not reviewed by a person")).toBeVisible();
  await expect(reply.getByRole("link", { name: /Scrum events, artifacts and commitments/ }).first()).toBeVisible();
  await expect(reply.getByRole("link", { name: "Definition of Done" })).toBeVisible();

  // Hint-first: an assessed question gets hints, not the answer.
  await page.getByLabel("Your question", { exact: true }).fill("Who can cancel a Sprint, and when?");
  await page.getByRole("button", { name: "Ask the coach" }).click();
  await expect(page.getByTestId("coach-reply").first().getByText(/looks like an assessment question/)).toBeVisible();
  await expect(page.getByTestId("coach-reply").first().getByText(/Only the Product Owner/)).toHaveCount(0);

  // Flag the first answer.
  const first = page.getByTestId("coach-reply").nth(1);
  await first.getByText("Flag this answer").click();
  await first.getByLabel("What's wrong with this answer?").fill("The quote is cut off.");
  await first.getByRole("button", { name: "Send to an admin" }).click();
  await expect(first.getByText("Thanks – an admin will review this answer.")).toBeVisible();
  await logout(page);

  await loginAsAdmin(page);
  await page.goto("/admin/review-queue");
  const flagged = page.getByTestId("review-queue").locator("li", { hasText: "The quote is cut off." });
  await expect(flagged.getByText("What is the Definition of Done?")).toBeVisible();
  await flagged.getByLabel("What did you do?").fill("Checked – excerpt length is fine.");
  await flagged.getByRole("button", { name: "Mark as resolved" }).click();
  await expect(page.getByText("Marked as resolved.")).toBeVisible();
});

test("role-play gives feedback on each choice, and the mock interview checks key points", async ({ page }) => {
  const learner = await createLearner("roleplay", "scrum-master");
  await login(page, learner.email, learner.password);
  await page.goto("/coach/roleplay/pushy-stakeholder");
  await page.getByRole("link", { name: /Lena, our Product Owner, decides/ }).click();
  await expect(page.getByTestId("roleplay-feedback").getByText("Strong response")).toBeVisible();
  await page.getByRole("link", { name: /look at the Sprint Backlog together/ }).click();
  await expect(page.getByText("End of the conversation.")).toBeVisible();

  await page.goto("/coach/interview?q=sm-daily-scrum");
  await page.getByLabel(/Your answer to/).fill("The Daily Scrum is a 15 minute event for the developers to check progress towards the Sprint Goal. I would coach them to talk to each other and step back.");
  await page.getByRole("button", { name: "Get feedback" }).click();
  const fb = page.getByTestId("interview-feedback");
  await expect(fb.getByText("Automated guidance from course content – not reviewed by a person")).toBeVisible();
  await expect(fb.getByText(/Covered:.*It's for the Developers.*Focus on the Sprint Goal/)).toBeVisible();
});

test("certificate: shows what's missing, then issues a PDF with a public verification page", async ({ page, browser }) => {
  const learner = await createLearner("cert", "qa-tester");
  await login(page, learner.email, learner.password);
  await page.goto("/certificate");
  const qa = page.locator("div", { has: page.getByRole("heading", { name: "QA Tester pathway" }) }).last();
  await expect(qa.getByTestId("certificate-missing")).toContainText("Pass IT Foundations – module assessment");

  await markModuleComplete(learner.id, "foundations");
  await markModuleComplete(learner.id, "testing-foundations");
  await passAssessment(learner.id, "foundations-assessment");
  await passAssessment(learner.id, "testing-foundations-assessment");
  await demonstrateCompetency(learner.id, "checkout-testing", qaPayload);
  await page.reload();
  await page.getByRole("button", { name: "Create my certificate" }).click();
  const cert = page.getByTestId("certificate");
  await expect(cert.getByText("Certificate of Completion")).toBeVisible();
  await expect(cert.getByText(`This is to confirm that ${learner.displayName} has completed the QA Tester pathway`)).toBeVisible();
  await expect(cert.getByText("This is not an accredited qualification.")).toBeVisible();
  await expect(cert.getByText(/Practical assignment \(simulated project\) met the course standard: Test the ShopEasy checkout in the Test Lab .*\(reviewed by an assessor\)/)).toBeVisible();
  expect(await cert.textContent()).not.toMatch(/certified/i);
  const id = (await cert.getByText(/Verification ID:/).textContent())!.replace("Verification ID: ", "").trim();

  const downloadPromise = page.waitForEvent("download");
  await cert.getByRole("link", { name: "Download PDF" }).click();
  const pdf = fs.readFileSync(await (await downloadPromise).path());
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");

  const visitor = await browser.newContext();
  const vp = await visitor.newPage();
  await vp.goto(`http://localhost:3100/verify/${id}`);
  await expect(vp.getByTestId("verify-result")).toContainText("This is a genuine Certificate of Completion");
  await expect(vp.getByText("This is not an accredited qualification.")).toBeVisible();
  await vp.goto("http://localhost:3100/verify/CSP-AAAA-BBBB-CCCC");
  await expect(vp.getByTestId("verify-result")).toContainText("no longer available");
  // Another person can't download it.
  expect((await vp.request.get(`http://localhost:3100/api/certificate/pdf?id=${id}`)).status()).toBe(401);
  await visitor.close();
});

test("admin reports show aggregate progress, most-failed questions and gaps", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  await expect(page.getByTestId("progress-report").getByRole("rowheader", { name: /IT Foundations/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Most-failed assessment questions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Common gaps" })).toBeVisible();
  expect(await db.user.count()).toBeGreaterThan(0);
});
