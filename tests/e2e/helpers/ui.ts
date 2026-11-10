import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { attemptSnapshots } from "./db";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

export async function logout(page: Page) {
  const nav = page.getByRole("navigation", { name: "Main", exact: true });
  if (await nav.isVisible()) await nav.getByRole("button", { name: "Log out" }).click();
  else {
    await page.getByText("Menu").click();
    await page.getByRole("navigation", { name: "Main (mobile)" }).getByRole("button", { name: "Log out" }).click();
  }
  await page.waitForURL(/\/login/);
}

export async function loginAsAdmin(page: Page) {
  await login(page, "admin@demo.local", process.env.DEMO_ADMIN_PASSWORD!);
}

/**
 * Answers the current attempt page. `correct(i)` decides whether question i is answered correctly
 * (using the stored snapshot, so the test knows the right answers).
 */
export async function answerAttempt(page: Page, correct: (i: number) => boolean) {
  await page.waitForURL(/\/attempt\/[^/]+$/);
  const attemptId = page.url().split("/attempt/")[1].split(/[/?]/)[0];
  const items = await attemptSnapshots(attemptId);
  for (const [i, { id, snapshot }] of items.entries()) {
    const right = correct(i);
    const q = page.locator("fieldset", { has: page.locator(`[name^="a_${id}"]`) });
    if (snapshot.type === "ORDER") {
      const order = right ? snapshot.correctOrder : [...snapshot.correctOrder].reverse();
      for (const [pos, optionId] of order.entries()) await q.locator(`select[name="a_${id}_pos_${optionId}"]`).selectOption(String(pos + 1));
    } else if (snapshot.type === "MULTI") {
      const targets = right ? snapshot.options.filter((o) => o.correct) : snapshot.options.filter((o) => !o.correct).slice(0, 1);
      for (const o of targets) await q.locator(`input[name="a_${id}"][value="${o.id}"]`).check();
    } else {
      const o = snapshot.options.find((x) => x.correct === right)!;
      await q.locator(`input[name="a_${id}"][value="${o.id}"]`).check();
    }
  }
  return { attemptId, items };
}

/** `allowed` lists deliberate, documented violations (e.g. the planted Test Lab label defect) by rule id and CSS target. */
export async function expectNoSeriousA11yViolations(page: Page, allowed: { id: string; target: string }[] = []) {
  // In dev mode stylesheets can arrive after the HTML; check the page as people see it.
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations
    .map((v) => ({ ...v, nodes: v.nodes.filter((n) => !allowed.some((a) => a.id === v.id && n.target.join(" ") === a.target)) }))
    .filter((v) => (v.impact === "serious" || v.impact === "critical") && v.nodes.length > 0);
  expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `page ${page.url()} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);
}
