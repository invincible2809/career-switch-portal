# CLAUDE.md – Career-Switch Learning Portal

## What this project is
A self-learning web portal that helps adults with non-IT backgrounds move into **Scrum Master** or **QA Tester** roles. It covers onboarding, a shared IT foundations course, two role pathways, assessments at every stage, practice sandboxes, a rule-based learning coach, a portfolio and an admin area.

- Full product spec: `docs/SPEC.md` (read only the sections the current task needs)
- Current status and next steps: `docs/PROGRESS.md` (read this at the start of every session)
- Approved build plan: `docs/PLAN.md` (created in Phase 0)

## Tech stack
- Next.js (App Router) + TypeScript (strict), Tailwind CSS, shadcn/ui (Radix)
- PostgreSQL via `docker compose`, Prisma ORM
- Auth.js with credentials; argon2 password hashing; HTTP-only secure cookies
- Zod for every input crossing a boundary (forms, API routes, server actions)
- Vitest (unit), Playwright + @axe-core/playwright (end-to-end and accessibility)
- **No AI provider or API key.** The learning coach, extra practice and rubric guidance are rule-based and built from course content, like the Oakling question generators: seeded generators in `src/lib/questions/generators.ts` build each question with its answer and an explanation for every option, so answers are correct by construction (decision 10 Nov 2026, PLAN §8)
- Package manager: pnpm

## Commands
Keep this list accurate as scripts are added.
- `pnpm dev` – run locally (http://localhost:3000)
- `pnpm db:up` / `pnpm db:down` – start/stop Postgres (docker compose, port 5433)
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset` (reset wipes the dev database – ask first)
- `pnpm content:check` – validate everything in `content/` without a database
- `pnpm lint` / `pnpm typecheck`
- `pnpm test` – unit tests (Vitest)
- `pnpm test:e2e` – Playwright incl. axe; empties and reseeds the `*_test` database in `TEST_DATABASE_URL`
- `pnpm build` – production build

## Course content lives in files
- Lessons, question banks and rubrics are authored as Markdown + YAML front matter (or JSON) under `content/`.
- `pnpm db:seed` imports them into the database. After that the admin UI is the place to edit them.
- This keeps content reviewable in git and lets the content-reviewer agent check it.

## Rules (do not break)
1. **Security:** every admin page, route handler and server action checks the role on the server. Learners can only read and write their own data. Never trust client-side role checks.
2. **Secrets:** never put secrets in client code, in seed data or in git. Add every new env var to `.env.example` with a comment.
3. **Sandboxes:** learner SQL runs in the browser (SQLite WASM) on synthetic data. The API sandbox only calls the app's own mock endpoints from an allow-list. No outbound requests from learner input.
4. **Honesty in the product:** never use "certified", "accredited", CSM, PSM or ISTQB CTFL as something this course grants. Portfolio items say "Simulated learning project – not paid work experience". Coach and automated feedback say "Automated guidance from course content – not reviewed by a person". Never describe rule-based output as AI.
5. **Progress model:** keep *content completed*, *assessment passed* and *competency demonstrated* as separate fields. Submitting work never marks it as mastered.
6. **Integrations:** if credentials are missing, run a clearly labelled demo mode (e.g. reset emails go to the `/dev/mailbox` page). Never pretend an integration is live.
7. **Accessibility:** WCAG 2.2 AA. Semantic HTML, labelled inputs, visible focus, full keyboard use, respect `prefers-reduced-motion`. Test at 375px width.
8. **Language:** plain UK English in all learner-facing text. Link technical terms to the glossary.
9. **Scrum accuracy:** follow the Scrum Guide 2020. Label anything else "Common workplace practice (optional)".
10. **QA accuracy:** align terms with ISTQB Foundation. Don't copy or paraphrase official exam questions.

## How to work
- Start each phase in **plan mode**. Present the plan, wait for approval, then build.
- Work in small, testable steps. After each step: `pnpm lint && pnpm typecheck && pnpm test`.
- Write Playwright tests for each acceptance criterion in SPEC §16 as the feature is built, not at the end.
- Don't say something works until a test or a manual check shows it working. If you mock or skip something, say so and log it in `docs/PROGRESS.md` under "Known limitations".
- Ask before: adding a major dependency, changing the stack, changing the data model after Phase 1, or deleting files.
- Use the `content-reviewer` agent on new or changed files in `content/` before marking content work done.
- At the end of each phase: update `docs/PROGRESS.md`, make sure all tests pass, and make a git commit with a clear message. Don't push unless asked.

## Conventions
- `src/app` routes, `src/components`, `src/lib` (domain logic, no React), `src/server` (data access, auth guards)
- Domain logic (scoring, unlock rules, spaced-review scheduling, rubric evaluation, question generators) is pure functions with unit tests in `tests/unit`
- Every admin page calls `requireAdmin()`, every admin API handler `adminApiGuard()`, and every server action `requireUser()`/`requireLearner()`/`requireAdmin()` as its first line; `tests/unit/guard-coverage.test.ts` enforces this
- Prisma 7 client is generated to `src/generated/prisma` (git-ignored; `pnpm install` regenerates it)
- Next.js 16: read `node_modules/next/dist/docs/` before using an unfamiliar API (see AGENTS.md)
- Server components by default; client components only when interactive
- Running example in all content: **ShopEasy**, a fictional online shop
