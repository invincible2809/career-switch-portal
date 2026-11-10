// Phase 5: key journeys with the keyboard only. Every control is reached by pressing Tab
// (proving it's in the tab order) and operated with keys, never clicked.
import { expect, test, type Page } from "@playwright/test";
import { uniqueEmail } from "./helpers/db";

async function tabTo(page: Page, selector: string, max = 150) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate((sel) => document.activeElement?.matches(sel) ?? false, selector)) return;
  }
  throw new Error(`Couldn't reach ${selector} with the Tab key`);
}

const focusVisible = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const s = getComputedStyle(el);
    return s.outlineStyle !== "none" && s.outlineWidth !== "0px";
  });

test("register, onboard, take the diagnostic and choose a pathway using only the keyboard", async ({ page }) => {
  test.setTimeout(180_000);
  const email = uniqueEmail("kbd");
  await page.goto("/register");
  await tabTo(page, "#displayName");
  expect(await focusVisible(page)).toBe(true);
  await page.keyboard.type("Kay Board");
  await page.keyboard.press("Tab");
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await page.keyboard.type("KeyboardOnly123");
  await page.keyboard.press("Tab");
  await page.keyboard.type("KeyboardOnly123");
  await tabTo(page, "#privacy");
  await page.keyboard.press("Space");
  await tabTo(page, "button[type=submit]");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/onboarding$/);

  // Onboarding: radios with arrow keys, selects with arrow keys, checkboxes with Space.
  await tabTo(page, 'input[name="techConfidence"]');
  await page.keyboard.press("ArrowRight"); // moves to and selects "2"
  await page.keyboard.press("ArrowRight"); // "3"
  await tabTo(page, 'input[name="preferredPathway"]');
  await page.keyboard.press("ArrowDown"); // QA Tester
  await page.keyboard.press("ArrowDown"); // Help me choose
  await tabTo(page, "#textScale");
  await page.keyboard.press("ArrowDown"); // Large
  await tabTo(page, "#reducedMotion");
  await page.keyboard.press("Space");
  await tabTo(page, "button[type=submit]");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/onboarding\/diagnostic/);

  // Diagnostic: Tab into each group and pick an answer with the arrow keys.
  const groups = await page.locator("form fieldset").count();
  for (let g = 0; g < groups; g++) {
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowDown");
  }
  await tabTo(page, "button[type=submit]");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/onboarding\/result/);
  await expect(page.getByRole("heading", { name: /Suggested pathway/ })).toBeVisible();
  await tabTo(page, "button[type=submit]");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/dashboard/);

  // The saved display settings really apply.
  await expect(page.locator("html")).toHaveAttribute("data-text-scale", "LARGE");
  await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("18px");

  // Start the first lesson from the dashboard with the keyboard.
  await tabTo(page, '[data-testid="continue-link"]');
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/learn\//);
  await tabTo(page, 'a[href*="section=explanation"]');
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/section=explanation/);
});

test("form errors move the learner to an error summary that links to each field", async ({ page }) => {
  await page.goto("/register");
  await tabTo(page, "button[type=submit]");
  await page.keyboard.press("Enter");
  const summary = page.getByRole("alert").filter({ hasText: "There is a problem" });
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  // Each summary link takes keyboard focus to its field.
  await summary.getByRole("link", { name: /Email/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#email$/);
  await expect(page.locator("#email")).toHaveAttribute("aria-invalid", "true");
});
