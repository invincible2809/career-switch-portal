import { expect, test } from "@playwright/test";
import { createLearner, db, markLessonComplete } from "./helpers/db";
import { answerAttempt, login, logout } from "./helpers/ui";

const ADMIN_PAGES = ["/admin", "/admin/curriculum", "/admin/question-banks", "/admin/assessments", "/admin/users", "/admin/audit-log"];
const ADMIN_APIS = ["/api/admin/users", "/api/admin/audit-log", "/api/admin/question-banks", "/api/admin/assessments"];

test("AC12: a learner can't reach any admin page or admin API", async ({ page }) => {
  const learner = await createLearner("ac12");
  const lesson = await db.lesson.findFirstOrThrow();
  const bank = await db.questionBank.findFirstOrThrow();
  const assessment = await db.assessment.findFirstOrThrow();
  const mod = await db.module.findFirstOrThrow();
  const pages = [...ADMIN_PAGES, `/admin/lessons/${lesson.id}`, `/admin/lessons/${lesson.id}/preview`, `/admin/question-banks/${bank.id}`, `/admin/assessments/${assessment.id}`, `/admin/modules/${mod.id}`];

  // Not signed in: pages redirect to login, APIs say 401.
  for (const url of ADMIN_PAGES) {
    await page.goto(url);
    await expect(page).toHaveURL(/\/login/);
  }
  for (const url of ADMIN_APIS) expect((await page.request.get(url)).status(), url).toBe(401);

  await login(page, learner.email, learner.password);
  for (const url of pages) {
    const res = await page.goto(url);
    expect(res?.status(), url).toBe(404);
    await expect(page.getByRole("heading", { name: /Admin|Curriculum|Question banks|Users|Audit log/ })).toHaveCount(0);
  }
  for (const url of ADMIN_APIS) expect((await page.request.get(url)).status(), url).toBe(403);
  const patch = await page.request.patch("/api/admin/assessments", { data: { id: assessment.id, passMark: 1, drawCount: 10, cooldownMinutes: 0, status: "PUBLISHED" } });
  expect(patch.status()).toBe(403);
  expect((await db.assessment.findUniqueOrThrow({ where: { id: assessment.id } })).passMark).toBe(80);
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("AC12: a role change ends existing sessions straight away", async ({ page }) => {
  const learner = await createLearner("ac12role");
  await login(page, learner.email, learner.password);
  await db.user.update({ where: { id: learner.id }, data: { role: "ADMIN", sessionVersion: { increment: 1 } } });
  // The old session no longer works after a role change.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await db.user.update({ where: { id: learner.id }, data: { role: "LEARNER" } });
});

test("AC13: a learner can't see another learner's data", async ({ page }) => {
  const a = await createLearner("ac13a");
  const b = await createLearner("ac13b");
  await markLessonComplete(a.id, "how-software-is-built");

  await login(page, a.email, a.password);
  await page.goto("/learn/how-software-is-built?section=objective");
  await page.getByLabel("Add a note").fill("Learner A's secret note");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Learner A's secret note")).toBeVisible();
  await page.goto("/assessments/foundations-assessment");
  await page.getByRole("button", { name: "Start the assessment" }).click();
  const { attemptId } = await answerAttempt(page, () => true);
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page.getByText("You scored 100%")).toBeVisible();
  const note = await db.note.findFirstOrThrow({ where: { userId: a.id } });
  await logout(page);

  await login(page, b.email, b.password);
  for (const url of [
    `/assessments/foundations-assessment/attempt/${attemptId}`,
    `/assessments/foundations-assessment/attempt/${attemptId}/result`,
  ]) {
    const res = await page.goto(url);
    expect(res?.status(), url).toBe(404);
    await expect(page.getByText("You scored")).toHaveCount(0);
  }
  await page.goto("/notes");
  await expect(page.getByText("Learner A's secret note")).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(page.getByText("No assessments taken yet.")).toBeVisible();

  const exported = await (await page.request.get("/api/me/export")).json();
  expect(exported.email).toBe(b.email);
  expect(JSON.stringify(exported)).not.toContain(a.email);
  expect(JSON.stringify(exported)).not.toContain("secret note");

  // Tampering with a form to delete A's note through B's session does nothing.
  await page.goto("/learn/how-software-is-built?section=objective");
  await page.getByLabel("Add a note").fill("B's note");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("B's note")).toBeVisible();
  await page.goto("/notes");
  await page.evaluate((id) => {
    document.querySelector<HTMLInputElement>('input[name="noteId"]')!.value = id;
  }, note.id);
  await page.getByRole("button", { name: "Delete note" }).click();
  await page.waitForLoadState("networkidle");
  expect(await db.note.count({ where: { id: note.id } })).toBe(1);
});
