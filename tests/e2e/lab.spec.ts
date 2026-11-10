import { expect, test } from "@playwright/test";
import { createLearner, db, passAssessment } from "./helpers/db";
import { login } from "./helpers/ui";

test("demo shop: log in, basket and checkout, with planted defects visible", async ({ page }) => {
  const learner = await createLearner("labshop");
  await login(page, learner.email, learner.password);
  await page.goto("/lab/shop");
  // Planted defect: wrong-case password is accepted.
  await page.getByLabel("Demo shop email").fill("shopper@shopeasy.example");
  await page.getByLabel("Demo shop password").fill("BASKET123");
  await page.getByRole("button", { name: "Log in to the shop" }).click();
  await expect(page.getByText("You're logged in to the demo shop.").first()).toBeVisible();

  // Planted defect: 3 tea towels cost £5.01.
  const towels = page.getByTestId("product-tea-towel");
  await towels.getByLabel("Quantity").fill("3");
  await towels.getByRole("button", { name: "Add to basket" }).click();
  await expect(page.getByTestId("subtotal")).toHaveText("£5.01");

  // Specification: quantity 11 is rejected.
  await page.getByLabel("Quantity of Cotton tea towel (3 for £5)", { exact: true }).fill("11");
  await page.getByTestId("line-tea-towel").getByRole("button", { name: "Update" }).click();
  await expect(page.getByText("You can buy up to 10 of this item.")).toBeVisible();

  const mug = page.getByTestId("product-mug");
  await mug.getByLabel("Quantity").fill("4");
  await mug.getByRole("button", { name: "Add to basket" }).click();
  await expect(page.getByTestId("subtotal")).toHaveText("£37.01");

  await page.getByRole("link", { name: "Go to checkout" }).click();
  // Planted defect: SAVE10 can be applied twice.
  for (let i = 0; i < 2; i++) {
    await page.getByLabel("Discount code").fill("SAVE10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByTestId("discount-line")).toHaveCount(i + 1);
  }
  await page.getByLabel("Full name").fill("Sam Taylor");
  await page.getByLabel("Address").fill("1 High Street, Leeds");
  // Planted defect: lower-case postcode rejected (the postcode box has no label – also planted).
  await page.locator("#lab-postcode").fill("ls1 4ap");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByText("Enter a valid postcode.")).toBeVisible();
  await page.locator("#lab-postcode").fill("LS1 4AP");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByText(/order SE-40001 placed/)).toBeVisible();
});

test("test cases are written, run and recorded; defect reports get feedback without revealing the list", async ({ page }) => {
  const learner = await createLearner("labrec");
  await login(page, learner.email, learner.password);
  await page.goto("/lab/test-cases");
  await page.getByLabel("Title").fill("Quantity 0 is rejected");
  await page.getByLabel("Technique").selectOption("BVA");
  await page.getByLabel("Test data").fill("0");
  await page.getByLabel("Steps").fill("Set a mug's quantity to 0 and press Update");
  await page.getByLabel("Expected result").fill("A message says the quantity must be 1 to 10");
  await page.getByRole("button", { name: "Save test case" }).click();
  await expect(page.getByTestId("test-case")).toHaveCount(1);
  await page.getByLabel("Result of test 1", { exact: true }).selectOption("FAIL");
  await page.getByLabel("Actual result of test 1").fill("Quantity 0 was accepted, line total £0.00");
  await page.getByRole("button", { name: "Save result" }).click();
  await expect(page.getByTestId("test-case").locator("span", { hasText: /^Fail$/ })).toBeVisible();
  await expect(page.getByLabel("Actual result of test 1")).toHaveValue("Quantity 0 was accepted, line total £0.00");

  await page.goto("/lab/defects");
  await page.getByLabel("Area").selectOption("basket");
  await page.getByLabel("Title").fill("Quantity of 0 is accepted in the basket");
  await page.getByLabel("Steps to reproduce").fill("1. Add a mug. 2. Set quantity to 0. 3. Press Update.");
  await page.getByLabel("Expected result").fill("Quantity 0 is rejected with a message");
  await page.getByLabel("Actual result").fill("Quantity 0 was accepted with a £0.00 line");
  await page.getByLabel("Severity").selectOption("Medium");
  await page.getByLabel("Priority").selectOption("High");
  await page.getByRole("button", { name: "Save defect report" }).click();
  await expect(page.getByTestId("defect-report")).toHaveCount(1);
  await page.getByRole("link", { name: "Check my reports" }).click();
  await expect(page.getByTestId("defect-report").getByText("found", { exact: true })).toBeVisible();
  await expect(page.getByText("The full list of planted defects is shown after you submit")).toBeVisible();
  // The answer key isn't in the page.
  expect(await page.content()).not.toContain("never locks");
});

test("QA assignment in the Test Lab: submitted from Lab work, scored, and the defect list revealed", async ({ page }) => {
  const learner = await createLearner("labqa");
  await passAssessment(learner.id, "testing-foundations-assessment");
  const cases = [
    ["Qty 0", "0", "FAIL", "Accepted"],
    ["Qty 1", "1", "PASS", ""],
    ["Qty 10", "10", "PASS", ""],
    ["Qty 11", "11", "PASS", ""],
    ["Free delivery 49.99", "£49.99 and £50.00", "FAIL", "Delivery charged at £50.00"],
    ["SAVE10 minimum", "19.99 and 20.00", "PASS", ""],
  ] as const;
  for (const [title, data, status, actual] of cases) {
    await db.labTestCase.create({
      data: { userId: learner.id, title, technique: "BVA", preconditions: "", testData: data, steps: "Do it in the demo shop", expected: "As the specification says", status, actual: actual || null, executedAt: new Date() },
    });
  }
  const defects = [
    ["basket", "Quantity of 0 accepted", "Quantity 0 should be rejected", "Quantity 0 was accepted"],
    ["checkout", "Delivery charged at exactly £50.00", "Delivery should be free at £50.00", "£3.95 delivery was charged"],
    ["login", "Password accepted in the wrong case", "Password BASKET123 should be rejected – passwords are case-sensitive", "Logged in with the upper case password"],
  ] as const;
  for (const [area, title, expected, actual] of defects) {
    await db.defectReport.create({ data: { userId: learner.id, area, title, environment: "Test Lab, Chrome", steps: "Follow the steps in the demo shop", expected, actual, severity: "High", priority: "High", evidence: "" } });
  }
  await login(page, learner.email, learner.password);
  await page.goto("/assignments/checkout-testing");
  await expect(page.getByRole("heading", { name: "Test the ShopEasy checkout in the Test Lab" })).toBeVisible();
  const fields = ["quantity", "quantity", "quantity", "quantity", "delivery", "discount"];
  for (const [i, f] of fields.entries()) await page.getByLabel(`What test ${i + 1} tests`).selectOption(f);
  await page.getByRole("button", { name: "Submit my work" }).click();
  await page.waitForURL(/\/submissions\//);
  await expect(page.getByTestId("criterion-test-case-completeness").getByText("3 out of 3")).toBeVisible();
  await expect(page.getByTestId("criterion-boundary-coverage").getByText("3 out of 3")).toBeVisible();
  await expect(page.getByTestId("criterion-test-execution").getByText("3 out of 3")).toBeVisible();
  await expect(page.getByTestId("criterion-defects-identified").getByText("3 out of 3")).toBeVisible();
  await expect(page.getByTestId("competency-status").getByText("Awaiting assessor review.")).toBeVisible();
  await expect(page.getByText(/The account never locks after 3 failed attempts\.\s*– missed/)).toBeVisible();
  // After submitting, the Lab's defect page shows the full list too.
  await page.goto("/lab/defects");
  await expect(page.getByRole("heading", { name: "All the planted defects" })).toBeVisible();
});

test("SQL sandbox runs in the browser only, checks answers and resets", async ({ page }) => {
  const learner = await createLearner("labsql");
  await login(page, learner.email, learner.password);
  await page.goto("/lab/sql");
  await expect(page.getByText("Database ready")).toBeVisible();
  const requests: string[] = [];
  page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));

  await page.getByLabel("Your SQL").fill("SELECT * FROM order_items WHERE quantity = 0;");
  await page.getByLabel("Exercise").selectOption("zero-quantity");
  await page.getByRole("button", { name: "Run query" }).click();
  await expect(page.getByTestId("sql-results").locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByText("That's right")).toBeVisible();

  await page.getByLabel("Your SQL").fill("DELETE FROM products; SELECT COUNT(*) FROM products;");
  await page.getByRole("button", { name: "Run query" }).click();
  await expect(page.getByTestId("sql-results").locator("tbody td")).toHaveText("0");
  await page.getByRole("button", { name: "Reset the database" }).click();
  await page.getByLabel("Your SQL").fill("SELECT COUNT(*) FROM products;");
  await page.getByRole("button", { name: "Run query" }).click();
  await expect(page.getByTestId("sql-results").locator("tbody td")).toHaveText("12");

  await page.getByLabel("Your SQL").fill("SELEC nonsense");
  await page.getByRole("button", { name: "Run query" }).click();
  await expect(page.getByText(/Error:/)).toBeVisible();
  // Learner SQL never leaves the browser.
  expect(requests).toEqual([]);
});

test("API sandbox calls the mock API and blocks anything else", async ({ page }) => {
  const learner = await createLearner("labapi");
  await login(page, learner.email, learner.password);
  await page.goto("/lab/api");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByTestId("api-status")).toHaveText("200");
  await expect(page.getByTestId("api-response")).toContainText("Stovetop kettle");

  await page.getByLabel("Endpoint").selectOption({ label: "POST /basket/items – Set the quantity of an item" });
  await page.getByLabel("JSON body").fill('{ "productId": "mug", "quantity": 11 }');
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByTestId("api-status")).toHaveText("400");
  await expect(page.getByTestId("api-response")).toContainText("up to 10");

  const sent: string[] = [];
  page.on("request", (r) => sent.push(r.url()));
  await page.getByLabel("URL").fill("https://example.com/steal");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(/^Blocked: only the ShopEasy mock API/)).toBeVisible();
  await page.getByLabel("URL").fill("/api/admin/users");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(/^Blocked/)).toBeVisible();
  expect(sent).toEqual([]);

  // The mock API needs a portal session.
  const anon = await page.context().browser()!.newContext();
  expect((await anon.request.get("http://localhost:3100/api/lab/shop/products")).status()).toBe(401);
  await anon.close();
});
