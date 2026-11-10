// Phase 5 accessibility sweep: every page in the app, as the right kind of user, checked with
// axe (WCAG 2.2 AA), for sideways scrolling at 375px, and for heading/landmark structure.
// If a new page is added without being listed here, the first test fails.
import { expect, test, type Page } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hash } from "@node-rs/argon2";
import { verificationId } from "../../src/lib/certificate/eligibility";
import { createLearner, db, demonstrateCompetency, markModuleComplete, passAssessment, PASSWORD, uniqueEmail } from "./helpers/db";
import { expectNoHorizontalScroll, expectNoSeriousA11yViolations, login, loginAsAdmin, logout } from "./helpers/ui";

function appRoutes(dir = "src/app", base = ""): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isFile() && e.name === "page.tsx") return [base || "/"];
    if (!e.isDirectory() || e.name === "api") return [];
    const seg = /^\(.*\)$/.test(e.name) ? "" : `/${e.name}`;
    return appRoutes(path.join(dir, e.name), base + seg);
  });
}

async function checkStructure(page: Page) {
  const s = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    levels: [...document.querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6")].map((h) => Number(h.tagName[1])),
    main: document.querySelectorAll("main").length,
    lang: document.documentElement.lang,
    title: document.title,
  }));
  expect(s.h1, `${page.url()} should have one h1`).toBe(1);
  expect(s.main, `${page.url()} should have one main landmark`).toBe(1);
  expect(s.lang).toBe("en-GB");
  expect(s.title.length).toBeGreaterThan(3);
  for (let i = 1; i < s.levels.length; i++) {
    expect(s.levels[i] - s.levels[i - 1], `${page.url()} skips a heading level (h${s.levels[i - 1]} → h${s.levels[i]})`).toBeLessThanOrEqual(1);
  }
}

async function sweep(page: Page, urls: string[], allowed: Record<string, { id: string; target: string }[]> = {}) {
  for (const url of urls) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url);
    await expectNoSeriousA11yViolations(page, allowed[url] ?? []);
    await checkStructure(page);
    await page.setViewportSize({ width: 375, height: 800 });
    await expectNoHorizontalScroll(page);
  }
}

test.describe.configure({ timeout: 900_000 });

test("every page in the app is covered by this sweep", () => {
  const covered = new Set(Object.keys(ROUTES));
  const missing = appRoutes().filter((r) => !covered.has(r));
  expect(missing, "add new pages to ROUTES in a11y-all-routes.spec.ts").toEqual([]);
});

// Route pattern -> who visits it. URLs with [params] are filled in by the test below.
const ROUTES: Record<string, "public" | "onboarding" | "learner" | "admin"> = {
  "/": "public", "/login": "public", "/register": "public", "/forgot-password": "public", "/reset-password/[token]": "public",
  "/privacy": "public", "/glossary": "public", "/glossary/[term]": "public", "/verify/[id]": "public",
  "/portfolio/shared/[token]": "public", "/dev/mailbox": "public",
  "/onboarding": "onboarding", "/onboarding/diagnostic": "onboarding", "/onboarding/result": "onboarding",
  "/dashboard": "learner", "/pathways": "learner", "/pathways/[pathway]": "learner", "/pathways/[pathway]/[module]": "learner",
  "/learn/[lesson]": "learner", "/assessments/[slug]": "learner", "/assessments/[slug]/attempt/[id]": "learner",
  "/assessments/[slug]/attempt/[id]/result": "learner", "/assignments/[slug]": "learner", "/assignments/[slug]/submissions/[id]": "learner",
  "/review": "learner", "/notes": "learner", "/bookmarks": "learner", "/search": "learner", "/settings": "learner",
  "/settings/accessibility": "learner", "/settings/data": "learner", "/coach": "learner", "/coach/interview": "learner",
  "/coach/roleplay/[id]": "learner", "/portfolio": "learner", "/career": "learner", "/certificate": "learner",
  "/lab": "learner", "/lab/shop": "learner", "/lab/shop/checkout": "learner", "/lab/test-cases": "learner",
  "/lab/defects": "learner", "/lab/sql": "learner", "/lab/api": "learner",
  "/admin": "admin", "/admin/curriculum": "admin", "/admin/modules/[id]": "admin", "/admin/lessons/[id]": "admin",
  "/admin/lessons/[id]/preview": "admin", "/admin/question-banks": "admin", "/admin/question-banks/[id]": "admin",
  "/admin/assessments": "admin", "/admin/assessments/[id]": "admin", "/admin/submissions": "admin", "/admin/submissions/[id]": "admin",
  "/admin/review-queue": "admin", "/admin/reports": "admin", "/admin/users": "admin", "/admin/audit-log": "admin",
};

test("every page passes axe, has sound structure and doesn't scroll sideways at 375px", async ({ page }) => {
  // ---- Data so every page has something to show ----
  const learner = await createLearner("sweep", "qa-tester");
  await markModuleComplete(learner.id, "foundations");
  await markModuleComplete(learner.id, "testing-foundations");
  await passAssessment(learner.id, "foundations-assessment");
  await passAssessment(learner.id, "testing-foundations-assessment");
  const sub = await demonstrateCompetency(learner.id, "checkout-testing", {
    testCases: [{ title: "Qty 0", field: "quantity", technique: "BVA", testData: "0", steps: "Set 0", expected: "Rejected", status: "FAIL", actual: "Accepted" }],
    defects: [{ area: "basket", title: "Quantity 0 accepted", environment: "Lab", steps: "Set 0", expected: "Rejected", actual: "Accepted", severity: "Medium", priority: "High", evidence: "" }],
  });
  await db.portfolioItem.create({ data: { userId: learner.id, submissionId: sub.id, kind: "qa-assignment", title: "Checkout testing", content: { sections: [{ heading: "Notes", lines: ["Example"] }] } } });
  const shareToken = crypto.randomBytes(24).toString("base64url");
  await db.portfolioShare.create({ data: { userId: learner.id, tokenHash: crypto.createHash("sha256").update(shareToken).digest("hex") } });
  const cert = await db.certificate.create({
    data: {
      userId: learner.id,
      pathwayId: (await db.pathway.findUniqueOrThrow({ where: { slug: "qa-tester" } })).id,
      verificationId: verificationId(),
      snapshot: { name: "Test sweep", pathway: "QA Tester", modules: ["IT Foundations"], assessments: [], competencies: [], issuedAt: new Date().toISOString() },
    },
  });

  const onboarding = await db.user.create({
    data: {
      email: uniqueEmail("onb"),
      displayName: "New Learner",
      passwordHash: await hash(PASSWORD),
      accessibility: { create: {} },
      profile: { create: { preferredPathway: "HELP_ME_CHOOSE", techConfidence: 2, weeklyMinutes: 120 } },
      diagnosticAttempts: {
        create: {
          answers: [],
          result: {
            startingPoint: "FOUNDATIONS", startingReasons: ["Some technology questions were new to you."], pathway: "QA_TESTER",
            pathwayReasons: ["You did well on detail questions.", "Honest note: entry-level testing roles are a realistic first step."],
            compared: true, transferableSkills: [{ skill: "Communication", example: "You explain things clearly.", helpsWith: ["QA_TESTER"] }],
          },
        },
      },
    },
  });

  // ---- Public pages ----
  await sweep(page, ["/", "/login", "/register", "/forgot-password", "/reset-password/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "/privacy", "/glossary", "/glossary/definition-of-done", `/verify/${cert.verificationId}`, "/verify/CSP-AAAA-BBBB-CCCC", `/portfolio/shared/${shareToken}`, "/dev/mailbox"]);

  // ---- Onboarding ----
  await login(page, onboarding.email, PASSWORD);
  await sweep(page, ["/onboarding", "/onboarding/diagnostic", "/onboarding/result"]);
  await page.setViewportSize({ width: 1280, height: 800 });
  await logout(page);

  // ---- Learner ----
  await login(page, learner.email, learner.password);
  await page.goto("/assessments/foundations-assessment");
  await page.getByRole("button", { name: /Start/ }).click();
  await page.waitForURL(/\/attempt\/[^/]+$/);
  const attemptUrl = new URL(page.url()).pathname;
  await page.getByRole("button", { name: "Submit answers" }).click();
  await page.waitForURL(/\/result$/);
  const resultUrl = new URL(page.url()).pathname;
  await page.goto("/assessments/testing-foundations-assessment");
  await page.getByRole("button", { name: /Start/ }).click();
  await page.waitForURL(/\/attempt\/[^/]+$/);
  const openAttempt = new URL(page.url()).pathname;
  await page.goto("/coach");
  await page.getByLabel("Your question", { exact: true }).fill("What is regression testing?");
  await page.getByRole("button", { name: "Ask the coach" }).click();
  await expect(page.getByTestId("coach-reply")).toHaveCount(1);
  await sweep(
    page,
    [
      "/dashboard", "/pathways", "/pathways/qa-tester", "/pathways/qa-tester/testing-foundations", "/learn/seven-testing-principles?section=explanation",
      "/assessments/foundations-assessment", openAttempt, resultUrl, attemptUrl.replace(/$/, "/result"),
      "/assignments/checkout-testing", `/assignments/checkout-testing/submissions/${sub.id}`, "/assignments/scrum-team-diagnosis",
      "/review", "/notes", "/bookmarks", "/search?q=boundary", "/settings", "/settings/accessibility", "/settings/data",
      "/coach", "/coach/interview", "/coach/roleplay/disputed-bug?path=1", "/portfolio", "/career", "/certificate",
      "/lab", "/lab/shop", "/lab/shop/checkout", "/lab/test-cases", "/lab/defects?check=1", "/lab/sql", "/lab/api",
    ],
    // The planted Test Lab defect for learners to find – the only allowed violation.
    { "/lab/shop/checkout": [{ id: "label", target: "#lab-postcode" }] },
  );
  await page.setViewportSize({ width: 1280, height: 800 });
  await logout(page);

  // ---- Admin ----
  await loginAsAdmin(page);
  const lesson = await db.lesson.findFirstOrThrow({ where: { slug: "how-software-is-built" } });
  await page.goto(`/admin/lessons/${lesson.id}`);
  if (await page.getByRole("button", { name: "Edit lesson (start a draft)" }).isVisible()) await page.getByRole("button", { name: "Edit lesson (start a draft)" }).click();
  const mod = await db.module.findFirstOrThrow({ where: { slug: "foundations" } });
  const bank = await db.questionBank.findFirstOrThrow({ where: { slug: "foundations-assessment" } });
  const assessment = await db.assessment.findFirstOrThrow({ where: { slug: "foundations-assessment" } });
  await sweep(page, [
    "/admin", "/admin/curriculum", `/admin/modules/${mod.id}`, `/admin/lessons/${lesson.id}`, `/admin/lessons/${lesson.id}/preview`,
    "/admin/question-banks", `/admin/question-banks/${bank.id}`, "/admin/assessments", `/admin/assessments/${assessment.id}`,
    "/admin/submissions", `/admin/submissions/${sub.id}`, "/admin/review-queue", "/admin/reports", "/admin/users", "/admin/audit-log",
  ]);
  // Leave no lesson draft behind for other tests.
  await db.lessonVersion.deleteMany({ where: { lessonId: lesson.id, status: { in: ["DRAFT", "IN_REVIEW"] } } });
});
