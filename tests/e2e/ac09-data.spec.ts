import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { createLearner, db } from "./helpers/db";
import { login } from "./helpers/ui";

test("AC9: download my data, then delete my account", async ({ page }) => {
  const learner = await createLearner("ac9");
  await login(page, learner.email, learner.password);
  await page.goto("/learn/how-software-is-built?section=objective");
  await page.getByLabel("Add a note").fill("My private note");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("My private note")).toBeVisible();

  await page.goto("/settings/data");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download my data" }).click();
  const download = await downloadPromise;
  const data = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  expect(data.email).toBe(learner.email);
  expect(data.notes[0].body).toBe("My private note");
  expect(JSON.stringify(data)).not.toContain("passwordHash");

  await page.getByLabel("Your password").fill(learner.password);
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete my account and data" }).click();
  await expect(page.getByText("Your account and data have been deleted.")).toBeVisible();
  expect(await db.user.findUnique({ where: { email: learner.email } })).toBeNull();
  expect(await db.note.count({ where: { userId: learner.id } })).toBe(0);

  await page.getByLabel("Email").fill(learner.email);
  await page.getByLabel("Password").fill(learner.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("The email or password is not right")).toBeVisible();
});

test("account deletion needs the right password", async ({ page }) => {
  const learner = await createLearner("ac9b");
  await login(page, learner.email, learner.password);
  await page.goto("/settings/data");
  await page.getByLabel("Your password").fill("wrong-password");
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete my account and data" }).click();
  await expect(page.getByText("That password isn't right").first()).toBeVisible();
  expect(await db.user.findUnique({ where: { email: learner.email } })).not.toBeNull();
});
