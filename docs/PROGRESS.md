# PROGRESS

Claude: read this at the start of every session and update it at the end of each phase or work session.

## Current phase
Phase 3 – practice sandboxes: **done** (10 Nov 2026). Next: Phase 4 – rule-based learning coach, portfolio, career tools, certificate and reporting.

## Done
- **Phase 0:** `docs/PLAN.md` written and approved with the recommended answers, plus the decision to build without any AI provider (PLAN §8).
- **Phase 1 – core platform**
  - Scaffold: Next.js 16 + TypeScript strict + Tailwind 4, hand-written shadcn/ui-style components, ESLint, Vitest, Playwright + axe, `docker-compose.yml` (Postgres 16 with `csp_dev` and `csp_test`), `.env.example`.
  - Prisma schema for the whole MVP (PLAN §3, plus `Question.draft`), first migrations, idempotent seed that imports `content/` and creates the demo accounts.
  - Content pipeline: Zod-validated lesson Markdown (nine parts in order), question-bank YAML, `pathways.yaml`, `glossary.yaml`; cross-file checks; `pnpm content:check`.
  - Seeded question generators (`who-does-what`, `bva-values`) – correct by construction, no AI.
  - Auth: register, log in, log out, password reset with demo mailbox, argon2id, JWT sessions re-checked against the database on every request (`sessionVersion`), Postgres rate limits on login/register/reset, learner and admin roles enforced on the server.
  - Onboarding (consent-gated optional data, skills, pathway preference, time, accessibility), 12-question diagnostic, recommendation with reasons, side-by-side comparison and transferable skills; display settings applied site-wide.
  - Lesson player: nine parts, autosaved position (by section key, survives new versions), notes, bookmarks, glossary links, hints, read aloud, knowledge check marked on the server.
  - Quiz engine: least-recently-seen draws spread across objectives, all four question types, all-or-nothing marking, explanation for every option, remediation links to the exact lesson section, retakes with different questions, configurable pass mark/draw count/cooldown, pass mark frozen per attempt.
  - Spaced review (1, 3, 7, 21 days) and quick review page.
  - Progress model with three separate states and prerequisite unlocking; dashboard with continue, progress, history, weekly plan, quick review, notes/bookmarks counts.
  - Admin: curriculum and module editing, lesson draft → review → publish with versions and preview, question-bank drafts and publishing, retire/restore questions, assessment settings, unlock rules, user roles, audit log, admin JSON APIs.
  - Data download (JSON) and account deletion; site search (Postgres full-text) over lessons and glossary; privacy notice.
  - Sample content: Foundations lesson 1, a 4-question knowledge check, a 25-question module bank (6 generated slots) and the diagnostic.
  - Content review (content-reviewer agent): all Must fix and Should fix items fixed – answer options are now shuffled per attempt (the right answer was always "a"), the worked example's rounding maths corrected, generated feedback grammar fixed, ambiguous role duties replaced, a third lesson objective (key terms) added and the key-term questions re-tagged to it, the Scrum Master role added to the lesson, missing glossary terms added, weak distractors replaced, fa-18 (a duplicate of a generated question) replaced, diagnostic and pathway summaries corrected.

- **Phase 2a – Foundations content**
  - Lessons 2–5: how teams plan and test (lifecycles, small steps, Agile values, introduction to Scrum), requirements and user stories (Given / When / Then), web apps, databases and APIs (requests, responses, status codes), work tracking, collaboration tools and security (phishing, passwords, MFA, personal data).
  - Knowledge checks for each lesson (4–5 questions each, every lesson objective covered).
  - Foundations module bank extended from 25 to 51 entries across all five lessons (16 objectives), including two slots from a new `given-when-then` generator.
  - About 30 new glossary terms, linked from lesson text.
  - Diagnostic technology questions now link to Lessons 4 and 5; reasoning, detail and preference questions have no lesson link (`lessonRef` is optional for diagnostic banks only).
  - content-reviewer: no Must fix items; all Should fix items and most Minor items fixed (Scrum Guide precision on the Sprint Review, commitments and Definition of Done; ISTQB test process wording; "Developers" in Scrum added to the glossary; workplace-practice labels for user stories; test data definition; jumbled parts in the generated Given/When/Then questions; stronger distractors).
  - New e2e tests (`tests/e2e/foundations-content.spec.ts`): every Foundations lesson shows all nine parts, every glossary link opens a real term, and an assessment draw covers at least four lessons.

- **Phase 2b – pathway Module 1s and practical assignments**
  - Scrum Master Module 1 (Scrum fundamentals): 3 lessons – the Scrum Team, events/artifacts/commitments, empiricism in practice – each with a knowledge check; 28-question bank with scenario, ordering and multiple-select questions.
  - QA Tester Module 1 (Testing foundations): 3 lessons – why testing matters, the seven testing principles, test levels/types and risk – each with a knowledge check; 28-question bank.
  - Both Module 1s are available; all other modules still show "Coming soon".
  - Practical assignments with rubrics (5 criteria each, 0–3, competency only if every criterion ≥ 2), stored as `content/assignments/*.md` and `content/rubrics/*.yaml` and imported by the seed:
    - Scrum Master: diagnosis, impediment log (3+) and a 60-minute retrospective plan.
    - QA Tester: 6+ test cases against a written ShopEasy checkout specification and 3+ defect reports from a test session log (written version agreed for Phase 2b; the Test Lab is wired in during Phase 3).
  - Structured submission forms, learner self-assessment (shown, never counted), automated checks for 5 criteria (impediment log, retro structure, test-case completeness, boundary coverage, defects identified against a server-only answer key), "Awaiting assessor review" for the rest.
  - Rubric evaluator: assessor scores override automated ones; competency is written only when every criterion has an official score at or above the minimum. The feedback page shows who or what scored each criterion. The QA answer key is revealed only after submission.
  - Admin: submissions queue, scoring with comments, competency override with a reason; all in the audit log.
  - Assignments unlock when the module assessment is passed; module pages and the dashboard show assignment status and competency.
  - Lesson tables now sit in a keyboard-focusable scroll box so they don't overflow at 375px.
  - content-reviewer: both Must fix items (Sprint Review transparency question; QA vs quality control wording) and all Should fix items fixed, plus most Minor items (tighter answer-key matching, timebox question, extra ordering and multiple-select questions).
  - New e2e tests (`tests/e2e/ac06-practical.spec.ts`) for acceptance criterion 6.

- **Phase 3 – practice sandboxes (ShopEasy Test Lab)**
  - Demo shop at `/lab/shop` (demo login, products, basket, checkout) on per-learner synthetic state (`LabSession`), with a reset. Shop logic is server-only (`src/server/lab/engine.ts`).
  - 10 planted defects (login: wrong-case password accepted, unhelpful error, no lockout; basket: quantity 0 and negative accepted, rounding up so 3 for £5 costs £5.01; checkout: SAVE10 applied twice, delivery charged at exactly £50.00, lower-case postcodes rejected; accessibility: postcode box without a label). A unit test proves each one happens, and others prove the rest follows the specification (`tests/unit/lab-engine.test.ts`). The answer key (`src/server/lab/defects.ts`) is server-only.
  - Test case writing and execution tracking (`/lab/test-cases`); defect reports with feedback – found / partly described / not matched (`/lab/defects`). The full defect list is shown only after the learner submits the QA assignment.
  - SQL sandbox (`/lab/sql`): SQLite (sql.js) running in the browser on a fixed synthetic ShopEasy dataset, 8 guided exercises with answer checking, reset; the WebAssembly file is served from `public/sql/` (copied on install). Learner SQL never reaches the server (e2e checks no requests are made).
  - API sandbox (`/lab/api`): mock ShopEasy API under `/api/lab/shop/*` sharing the demo shop's state and defects; request builder (method, allow-listed URL, headers, JSON body) that refuses anything outside the allow-list; 5 guided exercises.
  - The QA practical assignment now uses the Test Lab: learners submit their own Lab test cases (with results) and defect reports. Rubric version 2 adds "Tests run and results recorded". New assignment form type `QA_TEST_LAB` (migration approved). Earlier submissions keep their rubric version.
  - Fix: React 19 cleared forms after an action returned an error, so people lost what they'd typed (onboarding, assignments, admin lesson editing, the Lab checkout). All forms now use `useFormAction`, which keeps input on error.
  - "Test Lab" added to the main navigation.
  - content-reviewer: all 7 Must fix items fixed – two products added so the £19.99/£20.00 SAVE10 boundary can be tested, an unplanned defect removed (SAVE10 now drops off if the basket falls below £20.00), the accessibility defect described accurately (no visible label – placeholder only), the API exercise's expected figure corrected, automated feedback labelled, and the assignment made achievable. Should fix items also fixed: clearer specification (tea towel prices, what the £20/£50 rules apply to, stock), visible header labels in the API sandbox, unique quantity labels, login and accessibility options for test cases, glossary entries and links for testing terms, "blocked" explained. A ninth SQL exercise (badly formatted postcodes) was added.
  - New e2e tests: `tests/e2e/lab.spec.ts`; AC6 QA test rewritten for the Lab version; axe checks cover the Lab pages, allowing only the one planted label defect.

## In progress
- Nothing.

## Next steps
1. Phase 4: rule-based learning coach (no AI provider), portfolio with PDF export and share link, career tools, certificate of completion and verification page, admin reporting and review queue.

## Acceptance criteria status (SPEC §16)
Results from `pnpm test:e2e` on 10 Nov 2026 (after Phase 3): 34 tests, all passing.

| # | Criterion | Test file | Status |
|---|-----------|-----------|--------|
| 1 | Register + onboarding | `tests/e2e/ac01-02-register-onboarding.spec.ts` | Passing |
| 2 | Pathway recommendation | `tests/e2e/ac01-02-register-onboarding.spec.ts` | Passing |
| 3 | Lesson pause/resume | `tests/e2e/ac03-07-lesson-progress.spec.ts` | Passing |
| 4 | Assessment scoring + explanations | `tests/e2e/ac04-05-assessment.spec.ts` | Passing |
| 5 | Fail → remediation → retry with new questions | `tests/e2e/ac04-05-assessment.spec.ts` | Passing |
| 6 | Practical submission + rubric feedback | `tests/e2e/ac06-practical.spec.ts` | Passing |
| 7 | Log out / back in, progress intact | `tests/e2e/ac03-07-lesson-progress.spec.ts` | Passing |
| 8 | Portfolio add + PDF export | | Not started (Phase 4) |
| 9 | Data download + account deletion | `tests/e2e/ac09-data.spec.ts` | Passing |
| 10 | Admin edits + publishes lesson and question bank | `tests/e2e/ac10-11-admin.spec.ts` | Passing |
| 11 | Admin changes pass mark | `tests/e2e/ac10-11-admin.spec.ts` | Passing |
| 12 | Learner blocked from admin pages and APIs | `tests/e2e/ac12-13-security.spec.ts`, `tests/unit/guard-coverage.test.ts` | Passing |
| 13 | Learner can't see other learners' data | `tests/e2e/ac12-13-security.spec.ts` | Passing |
| 14 | axe: no serious violations on key pages | `tests/e2e/ac14-15-accessibility.spec.ts` | Passing (all Phase 1 pages) |
| 15 | 375px + keyboard-only journeys | `tests/e2e/ac14-15-accessibility.spec.ts` | Passing (see limitations) |

Unit tests: 120 passing (`pnpm test`). `pnpm lint`, `pnpm typecheck` and `pnpm build` pass.

## Decisions
- Stack as in CLAUDE.md, with **no AI provider**: questions, coach replies and feedback are rule-based from course content (PLAN §8.2).
- Exact versions and technical choices: PLAN §8.3 (Cache Components off, hand-written shadcn-style components, question drafts, attempt snapshots, CommonJS Prisma client).
- Learners who visit `/admin/*` get a 404 (so admin pages aren't revealed); admin APIs return 401/403 JSON.
- The demo mailbox only exists in demo mode and is off in production builds unless `ALLOW_DEMO_MAILBOX=true`.
- E2E tests empty and reseed a dedicated `*_test` database rather than using `prisma migrate reset`.

## Known limitations / mocked features
- **Email** runs in demo mode in all tests (reset links shown at `/dev/mailbox`). The SMTP path is written but hasn't been tested against a real mail server.
- **Docker:** the build environment had no Docker daemon, so everything was tested against a local PostgreSQL 16. `docker-compose.yml` follows the standard Postgres image but hasn't been run here.
- **Role pathways:** only Module 1 of each pathway is built; Modules 2–8 (Scrum Master) and 2–10 (QA Tester) show "Coming soon".
- **Existing databases don't switch on the Module 1s by themselves** (the seed never changes existing modules). Use Admin → Curriculum → the module → Availability "Available", or `pnpm db:reset`.
- **QA assignment in existing databases:** the seed doesn't change existing assignments, so a database seeded before Phase 3 keeps the written version (session log). `pnpm db:reset` switches to the Test Lab version. The written version's code stays so its submissions still display.
- **Lab defect matching is keyword-based by area** (like the written version). Reports that describe a real defect in unusual words may show as "not matched" or "partly described"; an assessor can override the automated score.
- **SQL exercise answers ship to the browser** (the checker runs the reference query locally). It's unassessed practice, so this is acceptable, but it means answers can be found in the page's code.
- **The API sandbox's mock API is per-learner and needs a portal session**; it doesn't need the demo shop login except for placing orders.
- **Automated defect matching is keyword-based:** a report counts as "found" when it's linked to a defect's log entry and mentions key words for the expected and actual behaviour; otherwise "partly described". An assessor can override any automated score.
- **Competency overrides:** an admin's grant persists; if an admin removes competency and later re-scores the submission so it meets the minimum, competency is recorded again (re-scoring is treated as a fresh decision).
- **No automated guidance on judgement criteria yet** (diagnosis, Scrum stance, facilitation, report clarity, severity/priority) – these wait for an assessor. Rule-based guidance is planned for Phase 4.
- **The Foundations assessment now needs all five lessons finished** (previously one). Learners in a database seeded earlier who had finished Lesson 1 will see the assessment locked until they finish Lessons 2–5.
- Content written by the course team is aligned with the Scrum Guide 2020 and ISTQB terms and has been checked by the content-reviewer agent, but **not yet by a human subject expert**.
- **Recommendation rules are simple heuristics** (PLAN §1.2 point 8) and only three diagnostic questions measure role preference.
- **Keyboard-only test (AC 15)** covers the skip link, login, lesson navigation, hints and taking an assessment. Registration and onboarding by keyboard alone are covered by native form controls and axe, but not by a scripted keyboard walk-through yet (Phase 5).
- **No manual screen-reader test yet** – planned for Phase 5.
- **Read aloud** uses the browser's own voices; it's hidden where unsupported and isn't tested automatically beyond appearing.
- **Rate limits** use the first `X-Forwarded-For` address for per-connection limits. Behind no proxy, that header can be faked; per-email limits still apply. Revisit when hosting is chosen.
- **Admin UI gaps:** generated questions can be retired/restored but their parameters are edited in the content files; unlock rules can only add "lessons completed" rules from the UI (the data model supports all three types); retiring a question takes effect immediately rather than through publish.
- **Search** builds the full-text index at query time (fine for this amount of content; add a stored `tsvector` index if content grows).
- **Dashboard portfolio card** is a placeholder until Phase 4.
- **Existing databases don't pick up edited content files** (by design, PLAN A9). After the Phase 1 content fixes, a database seeded earlier still has the old lesson text; `pnpm db:reset` reloads everything (and deletes learners).
- If pages look unstyled or out of date in `pnpm dev` or the e2e run, delete `.next/` – Turbopack's dev cache once served a stale stylesheet during this phase.
- Next.js may print `Error: The destination stream errored while writing data` in the e2e server log when a test navigates away mid-response; it doesn't affect results.
