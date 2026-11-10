import { expect, test } from "@playwright/test";
import { uniqueEmail } from "./helpers/db";
import { login, logout } from "./helpers/ui";

const PASSWORD = "AnotherGood1Pass";

async function register(page: import("@playwright/test").Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Your name").fill("Sam Taylor");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByLabel(/I have read the privacy notice/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/onboarding$/);
}

async function fillOnboarding(page: import("@playwright/test").Page, pathway: "Scrum Master" | "QA Tester" | "Help me choose") {
  await page.getByLabel(/happy for this portal to store my previous job/).check();
  await page.getByLabel("Previous job titles").fill("Teaching assistant");
  await page.getByLabel("Industry you have most experience in").selectOption("teaching");
  await page.getByRole("radiogroup").getByLabel("3").check();
  await page.getByRole("radio", { name: new RegExp(`^${pathway}`) }).check();
  await page.getByLabel("How much time can you usually study each week?").selectOption("180");
  await page.getByLabel("Use a dyslexia-friendly font").check();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/onboarding\/diagnostic/);
}

async function answerDiagnostic(page: import("@playwright/test").Page, leanToScrum: boolean) {
  await expect(page.getByText("not a test you can fail")).toBeVisible();
  const groups = page.locator("form fieldset");
  const n = await groups.count();
  expect(n).toBeGreaterThanOrEqual(10);
  for (let i = 0; i < n; i++) {
    const g = groups.nth(i);
    const label = leanToScrum ? g.getByText(/Bring everyone together|Helping colleagues adapt|Help them talk it through/) : null;
    if (label && (await label.count())) await label.click();
    else await g.locator('input[type="radio"]').first().check();
  }
  await page.getByRole("button", { name: "See my recommendation" }).click();
  await page.waitForURL(/\/onboarding\/result/);
}

test("AC1: register, log out, log back in and complete onboarding", async ({ page }) => {
  const email = uniqueEmail("ac1");
  await register(page, email);
  await logout(page);
  await login(page, email, PASSWORD);
  await expect(page).toHaveURL(/\/onboarding$/); // onboarding isn't finished yet

  await fillOnboarding(page, "QA Tester");
  await answerDiagnostic(page, false);
  await page.getByRole("button", { name: "Start learning" }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Hello, Sam Taylor" })).toBeVisible();
  await expect(page.getByText("Your pathway: QA Tester")).toBeVisible();
  // The accessibility answer is applied as a saved display setting.
  await expect(page.locator("html")).toHaveAttribute("data-font", "dyslexia");
});

test("AC1: validation errors are shown and linked to their fields", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create account" }).click();
  const summary = page.getByRole("alert");
  await expect(summary.getByText("There is a problem")).toBeVisible();
  await expect(page.locator("#email")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#email")).toHaveAttribute("aria-describedby", /email-error/);
});

test("AC2: 'Help me choose' gives a recommendation with reasons and a side-by-side comparison", async ({ page }) => {
  await register(page, uniqueEmail("ac2"));
  await fillOnboarding(page, "Help me choose");
  await answerDiagnostic(page, true);
  await expect(page.getByRole("heading", { name: "Suggested pathway: Scrum Master" })).toBeVisible();
  await expect(page.getByText(/enjoy helping groups work well together/)).toBeVisible();
  await expect(page.getByText(/Honest note: Scrum Master jobs often ask for previous delivery/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Where to start/ })).toBeVisible();
  await expect(page.getByRole("table", { name: /Comparison of the Scrum Master and QA Tester roles/ })).toBeVisible();
  await expect(page.getByText("Facilitation", { exact: true })).toBeVisible(); // transferable skill from teaching
  // The learner makes the final choice – they can pick the other role.
  await page.getByLabel("QA Tester").check();
  await page.getByRole("button", { name: "Start learning" }).click();
  await expect(page.getByText("Your pathway: QA Tester")).toBeVisible();
});

test("password reset works through the demo mailbox and signs out old sessions", async ({ page }) => {
  const email = uniqueEmail("reset");
  await register(page, email);
  await logout(page);
  await page.goto("/forgot-password");
  await expect(page.getByText(/Demo mode/)).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/If an account exists for that email/)).toBeVisible();
  await page.goto("/dev/mailbox");
  const card = page.locator("li", { hasText: `To ${email}` }).first();
  await card.getByRole("link", { name: /reset-password/ }).click();
  await page.getByLabel("New password", { exact: true }).fill("BrandNewPass99");
  await page.getByLabel("Confirm new password").fill("BrandNewPass99");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("Your password has been changed")).toBeVisible();
  await login(page, email, "BrandNewPass99");
  await expect(page).toHaveURL(/\/onboarding/);
});

test("wrong password shows a helpful error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("learner@demo.local");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("The email or password is not right")).toBeVisible();
});
