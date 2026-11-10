# How to build the portal with Claude Code

## One-time setup
1. Create an empty folder, run `git init`, and copy in this kit:
   ```
   CLAUDE.md
   docs/SPEC.md
   docs/PROGRESS.md
   .claude/agents/content-reviewer.md
   ```
2. Make sure you have Node 20+, pnpm and Docker installed.
3. Run `claude` in the folder.
4. Optional: create `.env.local` with `ANTHROPIC_API_KEY` for the AI coach. Without it the coach runs in a labelled demo mode.

## How to run each phase
- Start every phase in a **fresh session** (`/clear`), so the context holds only what that phase needs. CLAUDE.md and PROGRESS.md carry everything forward.
- Switch to **plan mode** (Shift+Tab) before pasting the prompt. Read the plan, then approve or correct it.
- When the phase finishes, check the app yourself (`pnpm dev`) before moving on.
- If it goes wrong, use `/rewind` (or press Esc twice) rather than piling on corrections.

---

## Phase 0 – Plan
```
Read CLAUDE.md, docs/PROGRESS.md and all of docs/SPEC.md.

Write docs/PLAN.md containing:
1. Your assumptions, and any places where the spec is unclear or contradicts itself
2. Confirmation of the tech stack, or proposed changes with reasons
3. The Prisma data model: entities, key fields and relationships. Cover users/roles, onboarding profile, pathways/modules/lessons/prerequisites, content versions, question banks/questions/attempts, rubrics/submissions/rubric scores, the three separate progress states, spaced-review schedule, notes/bookmarks, portfolio items, certificates, flagged content and the audit log
4. Route/page map for learner and admin
5. Format of the content files in content/ (lesson, question bank, rubric), with one short example of each
6. Phases 1–5 broken into steps, each step with how it will be tested
7. Anything you need from me

Don't write application code yet. Update docs/PROGRESS.md, then stop and wait for my approval.
```

## Phase 1 – Core platform
```
Read CLAUDE.md, docs/PROGRESS.md and docs/PLAN.md. Build Phase 1 using SPEC §2, §6, §7, §8, §11, §12, §13, §14.

Scope:
- Project scaffold, docker compose Postgres, Prisma schema and migrations, seed script, demo accounts (learner@demo.local, admin@demo.local; passwords in README)
- Register, log in, log out, password reset (dev mailbox page in demo mode), learner and admin roles with server-side guards
- Onboarding questions, diagnostic and pathway recommendation with explanation; accessibility preferences saved and applied
- Lesson player with all nine lesson parts, auto-save position, notes and bookmarks
- Quiz engine: draws N questions from a bank, scores them, gives an explanation for every option, remediation links, retake with different questions, configurable pass mark
- Progress model with the three separate states and prerequisite unlocking
- Dashboard: continue button, progress, assessment history, study plan, quick review
- Admin: CRUD and draft/publish for pathways, modules, lessons, question banks and pass marks; audit log
- Data download and account deletion
- Site search over lessons and glossary
- Seed one sample lesson and a 25-question sample bank so everything can be tested

Write Playwright tests for acceptance criteria 1–5, 7, 9–15 as you go. Finish with all tests passing, PROGRESS.md updated and a git commit.
```

## Phase 2a – Foundations content
```
Read CLAUDE.md and docs/PROGRESS.md. Using SPEC §3 and §6, write the 5 Foundations lessons as content files, each with a knowledge check, plus a 25+ question Foundations bank and glossary entries. Use the ShopEasy example throughout.

Run the content-reviewer agent on every file, fix all "Must fix" and "Should fix" items, then seed and check the lessons display correctly. Update PROGRESS.md and commit.
```

## Phase 2b – Pathway Module 1s and assignments
```
Read CLAUDE.md and docs/PROGRESS.md. Using SPEC §4, §5, §6, §7:

1. Scrum Master Module 1 (Scrum fundamentals): at least 3 full lessons, a 25+ question bank including scenario questions, and the practical assignment (diagnosis + impediment log + retro facilitation plan) with its rubric
2. QA Tester Module 1 (Testing foundations): at least 3 full lessons, a 25+ question bank, and the checkout-testing assignment with its rubric
3. Show all other modules from SPEC §4 and §5 as "Coming soon"
4. Build practical submission: structured forms per assignment, learner self-assessment against the rubric, automated checks where possible, and "competency demonstrated" only when the minimum criteria are met. Show who or what assessed it. Admin can review and override.

Run the content-reviewer agent on all content and fix issues. Add the Playwright test for acceptance criterion 6. Update PROGRESS.md and commit.
```

## Phase 3 – Practice sandboxes
```
Read CLAUDE.md and docs/PROGRESS.md. Using SPEC §5, build the ShopEasy Test Lab:

- A self-contained demo shop (login, basket, checkout) inside the app, isolated from real user data, with 8–12 seeded defects. Keep the defect list in a server-only file, never sent to the browser before submission
- Test case writing and execution tracking
- Defect report form (title, environment, steps, expected, actual, severity, priority, evidence) with feedback comparing against known defects (found / partly described / missed)
- SQL sandbox: SQLite WASM in the browser with a synthetic ShopEasy dataset, guided exercises and a reset button
- API sandbox: mock ShopEasy API endpoints plus a simple request builder limited to an allow-list

Add unit tests that confirm each seeded defect actually happens, and e2e tests for the main flows. Update PROGRESS.md and commit.
```

## Phase 4 – AI coach, portfolio, certificate, reporting
```
Read CLAUDE.md and docs/PROGRESS.md. Using SPEC §9, §10, §11:

- AI coach: server-side Anthropic API calls, answers grounded in lesson content with lesson references, hint-first behaviour, labelled output, "Flag this answer" to the admin review queue, per-user rate limit, and labelled demo mode when no API key is set. Treat learner text as untrusted
- Portfolio: add completed work, "Simulated learning project" label, PDF export, private share link the learner controls
- Career tools: transferable-skills statement builder, CV guidance, interview question bank, mock interview (via the coach)
- Certificate of Completion PDF with verification ID and a public verify page; wording exactly as in SPEC §10
- Admin reporting: progress overview, most-failed questions, common gaps; review queue for flagged content

Add the Playwright test for acceptance criterion 8. Update PROGRESS.md and commit.
```

## Phase 5 – Hardening and handover
```
Read CLAUDE.md and docs/PROGRESS.md.

1. Run the full test suite and fix every failure
2. Security review of all route handlers and server actions: role checks, ownership checks, input validation, rate limits. Write tests for anything missing
3. Accessibility pass: axe on every page, keyboard-only walk-through of the main journeys, 375px layout check
4. Finish the README: setup, env vars, seed, demo accounts, how to run the tests, how to add content
5. Fill in the acceptance criteria table in PROGRESS.md with test file names and real results
6. Write an honest "Known limitations" list: what is mocked, missing or simplified, and recommended next steps

Commit at the end.
```
