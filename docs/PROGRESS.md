# PROGRESS

Claude: read this at the start of every session and update it at the end of each phase or work session.

## Current phase
Phase 2a – Foundations content: **done** (10 Nov 2026). Next: Phase 2b – pathway Module 1s and practical assignments.

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

## In progress
- Nothing.

## Next steps
1. Phase 2b: Scrum Master and QA Tester Module 1, assignments, rubrics, practical submission and assessor review.

## Acceptance criteria status (SPEC §16)
Results from `pnpm test:e2e` on 10 Nov 2026 (after Phase 2a): 26 tests, all passing.

| # | Criterion | Test file | Status |
|---|-----------|-----------|--------|
| 1 | Register + onboarding | `tests/e2e/ac01-02-register-onboarding.spec.ts` | Passing |
| 2 | Pathway recommendation | `tests/e2e/ac01-02-register-onboarding.spec.ts` | Passing |
| 3 | Lesson pause/resume | `tests/e2e/ac03-07-lesson-progress.spec.ts` | Passing |
| 4 | Assessment scoring + explanations | `tests/e2e/ac04-05-assessment.spec.ts` | Passing |
| 5 | Fail → remediation → retry with new questions | `tests/e2e/ac04-05-assessment.spec.ts` | Passing |
| 6 | Practical submission + rubric feedback | | Not started (Phase 2b) |
| 7 | Log out / back in, progress intact | `tests/e2e/ac03-07-lesson-progress.spec.ts` | Passing |
| 8 | Portfolio add + PDF export | | Not started (Phase 4) |
| 9 | Data download + account deletion | `tests/e2e/ac09-data.spec.ts` | Passing |
| 10 | Admin edits + publishes lesson and question bank | `tests/e2e/ac10-11-admin.spec.ts` | Passing |
| 11 | Admin changes pass mark | `tests/e2e/ac10-11-admin.spec.ts` | Passing |
| 12 | Learner blocked from admin pages and APIs | `tests/e2e/ac12-13-security.spec.ts`, `tests/unit/guard-coverage.test.ts` | Passing |
| 13 | Learner can't see other learners' data | `tests/e2e/ac12-13-security.spec.ts` | Passing |
| 14 | axe: no serious violations on key pages | `tests/e2e/ac14-15-accessibility.spec.ts` | Passing (all Phase 1 pages) |
| 15 | 375px + keyboard-only journeys | `tests/e2e/ac14-15-accessibility.spec.ts` | Passing (see limitations) |

Unit tests: 69 passing (`pnpm test`). `pnpm lint`, `pnpm typecheck` and `pnpm build` pass.

## Decisions
- Stack as in CLAUDE.md, with **no AI provider**: questions, coach replies and feedback are rule-based from course content (PLAN §8.2).
- Exact versions and technical choices: PLAN §8.3 (Cache Components off, hand-written shadcn-style components, question drafts, attempt snapshots, CommonJS Prisma client).
- Learners who visit `/admin/*` get a 404 (so admin pages aren't revealed); admin APIs return 401/403 JSON.
- The demo mailbox only exists in demo mode and is off in production builds unless `ALLOW_DEMO_MAILBOX=true`.
- E2E tests empty and reseed a dedicated `*_test` database rather than using `prisma migrate reset`.

## Known limitations / mocked features
- **Email** runs in demo mode in all tests (reset links shown at `/dev/mailbox`). The SMTP path is written but hasn't been tested against a real mail server.
- **Docker:** the build environment had no Docker daemon, so everything was tested against a local PostgreSQL 16. `docker-compose.yml` follows the standard Postgres image but hasn't been run here.
- **Role pathways:** all Scrum Master and QA Tester modules still show "Coming soon" until Phase 2b.
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
