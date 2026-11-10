import { expect, test } from "@playwright/test";
import { createLearner, db } from "./helpers/db";
import { login, loginAsAdmin, logout } from "./helpers/ui";

test("pages send a nonce-based CSP and key pages work without CSP violations", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to (execute|load|apply|connect)/i.test(m.text())) violations.push(`${page.url()}: ${m.text()}`);
  });
  const res = await page.goto("/login");
  const csp = res!.headers()["content-security-policy"];
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(csp).toMatch(/frame-ancestors 'none'/);
  expect(res!.headers()["x-frame-options"]).toBe("DENY");

  const learner = await createLearner("csp");
  await login(page, learner.email, learner.password);
  for (const url of ["/dashboard", "/learn/how-software-is-built?section=guided-practice", "/lab/shop", "/coach", "/portfolio", "/settings"]) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
  }
  // The SQL sandbox needs WebAssembly – it must still work under the CSP.
  await page.goto("/lab/sql");
  await expect(page.getByText("Database ready")).toBeVisible();
  await page.getByRole("button", { name: "Run query" }).click();
  await expect(page.getByTestId("sql-results")).toBeVisible();
  // Interactive client components still work (hydration allowed by the nonce).
  await page.goto("/lab/api");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByTestId("api-status")).toHaveText("200");
  expect(violations).toEqual([]);
});

test("cross-site requests that change data are refused", async ({ page }) => {
  const learner = await createLearner("csrf");
  await login(page, learner.email, learner.password);
  const evil = await page.request.post("/api/lab/shop/basket/items", {
    headers: { Origin: "https://evil.example", "Content-Type": "text/plain" },
    data: JSON.stringify({ productId: "mug", quantity: 3 }),
  });
  expect(evil.status()).toBe(403);
  const fetchMeta = await page.request.delete("/api/lab/shop/basket", { headers: { "Sec-Fetch-Site": "cross-site" } });
  expect(fetchMeta.status()).toBe(403);
  // Same-site requests still work.
  const ok = await page.request.post("/api/lab/shop/basket/items", { headers: { Origin: "http://localhost:3100" }, data: { productId: "mug", quantity: 1 } });
  expect(ok.status()).toBe(200);

  await page.goto("/dashboard");
  await logout(page);
  await loginAsAdmin(page);
  const assessment = await db.assessment.findFirstOrThrow();
  const patch = await page.request.patch("/api/admin/assessments", {
    headers: { Origin: "https://evil.example" },
    data: { id: assessment.id, passMark: 1, drawCount: 10, cooldownMinutes: 0, status: "PUBLISHED" },
  });
  expect(patch.status()).toBe(403);
  expect((await db.assessment.findUniqueOrThrow({ where: { id: assessment.id } })).passMark).toBe(assessment.passMark);
});
