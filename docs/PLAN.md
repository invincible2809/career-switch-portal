# PLAN – Career-Switch Learning Portal

Status: **Approved 10 Nov 2026** with the recommendations in §7, plus one change: no AI provider (see §8).
Sources: `CLAUDE.md`, `docs/SPEC.md` (§1–§17), `docs/PROGRESS.md`, `PHASE-PROMPTS.md`.

---

## 1. Assumptions, unclear points and contradictions

### 1.1 Assumptions I will build on unless you say otherwise
| # | Assumption |
|---|---|
| A1 | **Local-first.** The target is `pnpm dev` + Docker Postgres on a laptop. No hosting target is chosen, so nothing is tied to a vendor. Production hardening (HTTPS, secure cookies) is set up in config but only tested locally. |
| A2 | **Foundations is a "shared pathway"** with one module of 5 lessons. Every learner can open it. Scrum Master and QA Tester are role pathways. A learner has exactly one *active* role pathway, can switch at any time, and keeps all progress when they switch (progress belongs to lessons/assessments, not to the pathway choice). |
| A3 | **Lessons are always open** (SPEC §7: "revisit any content freely"). Only **assessed milestones** are locked: a module assessment unlocks when all lessons in that module are *content completed*; a practical assignment unlocks when its module assessment is *passed*. Foundations is *recommended*, not required, before Module 1 – the diagnostic can say "skip to Module 1". Rules are data (a prerequisite table) evaluated by a pure function, so admins can change them. |
| A4 | **Content completed** = the learner reached and confirmed the final lesson part ("Feedback and next step"). The lesson's knowledge check is practice: it gives feedback and feeds spaced review but does not gate completion. |
| A5 | **Question draws.** A module assessment draws 10 questions from a 25+ bank, picking the least-recently-seen questions first (random tie-break), spread across lesson objectives. With 25 questions the 2nd attempt shares no questions with the 1st; the 3rd will reuse the oldest. Each attempt stores a snapshot of question IDs, versions and the pass mark in force when it started, so later pass-mark changes only affect *new* attempts (AC 11). |
| A6 | **Scoring.** Single choice and scenario: 1 mark each, all-or-nothing. Multiple select: all-or-nothing (simpler to explain to beginners; partial credit can be added later). Ordering: all-or-nothing. Score % = marks / questions. Pass = score ≥ pass mark. |
| A7 | **Spaced review.** A wrong answer (or a question marked `isKey: true`) creates a review item due in 1 day. Correct in review → next interval (1 → 3 → 7 → 21 days → retired). Wrong → back to 1 day. "Quick review" shows up to 5 due items. No streaks, no penalties. |
| A8 | **Content versioning.** Lessons are stored as immutable `LessonVersion` rows. Learners always see the latest *published* version. Lesson position is saved as a stable **section key** (e.g. `worked-example`), not a page index, so a new version doesn't lose a learner's place. If a key no longer exists, they resume at the nearest earlier section. Questions are versioned the same way so old attempts still show what the learner actually saw. |
| A9 | **Content files vs admin edits.** `pnpm db:seed` imports `content/` only for items that don't exist yet (matched by slug). It never overwrites admin edits. `pnpm db:reset` wipes the database and reimports everything. Admin edits are *not* written back to files. This will be documented in the README. |
| A10 | **Roles.** `LEARNER` and `ADMIN` in the MVP. Access goes through one permission map (`can(role, action)`), so `CONTENT_EDITOR` and `ASSESSOR` can be added later without touching every route. The admin does every review step (draft → review → published) in the MVP. |
| A11 | **Learner name** (for the certificate) is collected at registration as "Name to show on your certificate", and can be edited. |
| A12 | **"Audio" format preference.** There is no recorded audio in the MVP. Choosing "audio" turns on a clearly labelled **Read aloud** button that uses the browser's built-in speech (Web Speech API), with no data leaving the browser. If the browser doesn't support it, the button is hidden and a short note explains why. |
| A13 | **Dyslexia-friendly font.** Self-hosted **Atkinson Hyperlegible** (SIL Open Font Licence) as the alternative font. A "larger text" setting scales the base size (16 → 18 → 20px). |
| A14 | **Test Lab defect feedback** is rule-based (no AI needed). Each known defect has an area (login / basket / checkout / accessibility) and a set of key behaviours. A report is **found** if it names the right area and the key behaviour, **partly described** if the area matches but steps or expected/actual results miss the key point, and **missed** for any known defect with no matching report. The full list is shown only after the learner submits the assignment. |
| A15 | **Rate limits** are stored in Postgres (a small bucket table). No Redis, so there is one less service to run. |
| A16 | **Search** uses Postgres full-text search over published lesson text and the glossary. No external search service. |
| A17 | **Password reset email** in demo mode is written to a `DevMailboxMessage` table and shown at `/dev/mailbox` (only reachable when demo mode is on, and labelled as such). Real sending (SMTP) is supported when `SMTP_*` env vars are set. |
| A18 | **Account deletion** is a hard delete of the learner's personal data. Audit-log rows keep the action but replace the user reference with "deleted user". A deleted learner's certificate verification page says "This certificate is no longer available." |

### 1.2 Unclear points and contradictions in the spec
1. **Practical assessment before the AI coach exists.** SPEC §7 says rubric feedback comes from automated checks + AI feedback + self-assessment, and "competency demonstrated" needs the minimum criteria to be met. The build order puts practical assignments in Phase 2b but AI in Phase 4. Many criteria (e.g. "quality of the diagnosis") can't be checked automatically, and self-assessment can't count (Rule 5: submitting never equals mastery). **Proposal:** in Phase 2b each criterion is scored by an automated check where one exists; the rest show "Awaiting assessor review" until an admin scores them. Self-assessment is shown next to the official score but never counts. In Phase 4, AI scores are added for the remaining criteria, labelled "Automated + AI feedback – not reviewed by a person". **See question Q1.**
2. **AC 1 – "Register, verify login".** This could mean email verification or simply "log in successfully after registering". **Proposal:** no email verification in the MVP – the test registers, logs out, logs in and finishes onboarding. Email verification can be added with the same mailbox mechanism. **Q2.**
3. **Certificate trigger.** SPEC §10 lists the certificate's contents but not when it's earned. With only Module 1 built, what does "completion" mean? **Proposal:** a certificate for "Foundations + <Pathway> Module 1" is available once all lessons in those modules are completed, all their module assessments passed and the practical assignment has *competency demonstrated*. The certificate lists exactly what was completed, so it stays honest as more modules are added.
4. **"Coming soon" modules vs prerequisites.** Coming-soon modules are shown in the pathway with their titles and a short description only. They have no lessons, are ignored by prerequisite and certificate rules, and are excluded from progress percentages (otherwise every learner would be stuck at 1/8).
5. **Phase 1 includes acceptance criteria 14 and 15** (axe and 375px/keyboard), but most key pages arrive later. These tests will cover every page that exists at each phase and grow as pages are added.
6. **Auth.js credentials provider requires JWT sessions** (it doesn't support database sessions). A JWT alone can't be revoked when an account is deleted or a role changes. **Proposal:** keep Auth.js (as in CLAUDE.md), but the server guard looks the user up on every request and checks `role`, `deletedAt` and a `sessionVersion` number held in the token. Logging out everywhere, deleting an account or changing a role increments the version and ends existing sessions. Roles are never read from the token alone.
7. **Optional cooldown between attempts** (SPEC §7). Default **0 minutes** (no lockout), configurable per assessment by admins.
8. **Diagnostic recommendation.** SPEC §2 doesn't say how answers map to a recommendation. **Proposal:** each diagnostic question is tagged (`tech`, `logic`, `detail`, `people`). Tech + logic results decide "Start with Foundations" vs "You could skip to Module 1". For "Help me choose", `people` + facilitation interest points to Scrum Master, `detail` + `logic` points to QA Tester. Previous roles add context to the explanation text (e.g. "Your retail experience with customer complaints is good practice for spotting user problems"). The explanation is generated from templates, not AI. The function is pure and unit-tested. The page always says the learner makes the final choice and states the honest note about Scrum Master entry routes from SPEC §1.

---

## 2. Tech stack

**Confirmed as in CLAUDE.md**, with versions pinned when the project is scaffolded (current stable versions on that day):

| Area | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router), TypeScript strict, React Server Components | Server Actions for forms; Route Handlers for the mock API, PDF downloads and data export |
| UI | Tailwind CSS + shadcn/ui (Radix) | Light, calm theme; shadcn components copied into `src/components/ui` |
| DB | PostgreSQL 16 via `docker compose`, Prisma ORM | |
| Auth | Auth.js (credentials) + `@node-rs/argon2` | Prebuilt argon2 binary, so no native build tools are needed. See §1.2 point 6 for session handling |
| Validation | Zod everywhere input crosses a boundary | Shared schemas in `src/lib/schemas` |
| Tests | Vitest (unit), Playwright + `@axe-core/playwright` | Playwright uses its own test database |
| AI | `@anthropic-ai/sdk`, server-only | Demo mode when `ANTHROPIC_API_KEY` is missing |
| Package manager | pnpm | |

**Additional dependencies I'd like approval for** (CLAUDE.md asks me to check before adding major ones):

| Package | Why | Phase |
|---|---|---|
| `gray-matter`, `yaml` | Parse front matter and YAML content files | 1 |
| `unified`, `remark-parse`, `remark-gfm`, `remark-directive`, `remark-rehype`, `rehype-sanitize`, `rehype-stringify` | Render lesson Markdown safely (sanitised HTML) with `:::hint` blocks | 1 |
| `nodemailer` | Real email when SMTP is configured (otherwise dev mailbox) | 1 |
| `sql.js` (SQLite WASM) | In-browser SQL sandbox (CLAUDE.md Rule 3) | 3 |
| `@react-pdf/renderer` | Portfolio and certificate PDFs, rendered on the server | 4 |
| `tsx` | Run the seed script in TypeScript | 1 |

**No stack changes proposed.**

---

## 3. Data model (Prisma)

Conventions: `cuid()` IDs, `createdAt`/`updatedAt` on every table, learner-owned tables have `userId` with `onDelete: Cascade`. `status` enums use `DRAFT | IN_REVIEW | PUBLISHED | ARCHIVED`.

### 3.1 Users, auth, onboarding
| Model | Key fields | Relations / notes |
|---|---|---|
| `User` | `email` (unique, lower-cased), `displayName`, `passwordHash`, `role` (`LEARNER`/`ADMIN`), `sessionVersion`, `deletedAt?` | 1–1 profile, prefs; 1–many everything learner-owned |
| `PasswordResetToken` | `tokenHash` (SHA-256), `expiresAt` (1 h), `usedAt?` | Single use; raw token only appears in the email/link |
| `DevMailboxMessage` | `to`, `subject`, `body`, `createdAt` | Demo mode only |
| `LearnerProfile` | `previousRoles` (text[]), `industry`, `skills` (JSON, self-rated 1–5), `techConfidence` (1–5), `preferredPathway` (`SCRUM_MASTER`/`QA_TESTER`/`HELP_ME_CHOOSE`), `activePathwayId?`, `weeklyMinutes`, `goal`, `optionalDataConsentAt?`, `onboardingCompletedAt?` | Previous employment and accessibility needs are only stored when `optionalDataConsentAt` is set (SPEC §13) |
| `AccessibilityPrefs` | `textScale` (`DEFAULT`/`LARGE`/`LARGER`), `reducedMotion`, `dyslexiaFont`, `readAloud` | Applied on every page from the server; editable in Settings |
| `DiagnosticAttempt` | `answers` (JSON), `result` (JSON: starting point, recommended pathway, reasons[]), `chosenPathwayId` | Learner can retake |

### 3.2 Curriculum and content versions
| Model | Key fields | Relations / notes |
|---|---|---|
| `Pathway` | `slug`, `title`, `summary`, `kind` (`SHARED`/`ROLE`), `order`, `status` | Has many `Module` |
| `Module` | `slug`, `title`, `summary`, `order`, `availability` (`AVAILABLE`/`COMING_SOON`), `status` | Belongs to `Pathway`; has many `Lesson`, one `Assessment`, many `Assignment` |
| `Lesson` | `slug`, `order`, `publishedVersionId?`, `reviewDueAt?` | Belongs to `Module`; many `LessonVersion` |
| `LessonVersion` | `version` (int), `status`, `title`, `estimatedMinutes`, `objectives` (text[]), `sections` (JSON: `[{key, part, title, markdown}]`), `searchText` (tsvector), `authorId`, `publishedAt?`, `reviewNote?` | Immutable once published; editing creates a new draft version |
| `Prerequisite` | `targetType` (`ASSESSMENT`/`ASSIGNMENT`/`MODULE`), `targetId`, `requirement` (`LESSONS_COMPLETED`/`ASSESSMENT_PASSED`/`COMPETENCY_DEMONSTRATED`), `requiredId` | Evaluated by the pure function `isUnlocked()` |
| `GlossaryTerm` | `slug`, `term`, `definition`, `firstLessonId?` | Fed from lesson glossaries; linked from lesson text with `[[term]]` |

### 3.3 Assessment
| Model | Key fields | Relations / notes |
|---|---|---|
| `QuestionBank` | `slug`, `title`, `purpose` (`DIAGNOSTIC`/`KNOWLEDGE_CHECK`/`MODULE`), `status`, `moduleId?`, `lessonId?` | Has many `Question` |
| `Question` | `key` (stable), `version`, `active`, `type` (`SINGLE`/`MULTI`/`ORDER`/`SCENARIO`), `scenario?`, `stem`, `options` (JSON: `[{id, text, correct, explanation}]`), `correctOrder?` (string[]), `objective`, `lessonRef` (`{lessonSlug, sectionKey}`), `tags` (text[]), `isKey` (always added to spaced review) | Editing creates a new version; old attempts keep pointing at the version they saw |
| `Assessment` | `slug`, `kind` (`MODULE`/`DIAGNOSTIC`), `bankId`, `drawCount` (10), `passMark` (80), `cooldownMinutes` (0), `status` | Admin-editable; changes go in the audit log |
| `AssessmentAttempt` | `userId`, `assessmentId`, `passMarkAtStart`, `drawCountAtStart`, `startedAt`, `submittedAt?`, `scorePercent?`, `passed?` | Many `AttemptAnswer` |
| `AttemptAnswer` | `questionId`, `questionVersion`, `position`, `response` (JSON), `correct?` | |
| `ReviewItem` | `userId`, `questionId`, `stage` (0–4), `dueAt`, `lastAnsweredAt?`, `retiredAt?` | Spaced review (A7) |

### 3.4 Practical work
| Model | Key fields | Relations / notes |
|---|---|---|
| `Rubric` | `slug`, `version`, `title`, `minimumRule` (JSON, e.g. `{ "minEach": 2 }`), `status` | Has many `RubricCriterion` |
| `RubricCriterion` | `key`, `title`, `descriptors` (JSON `{0,1,2,3}`), `autoCheck?` (name of a registered check function), `order` | 4–6 per rubric (validated) |
| `Assignment` | `slug`, `moduleId`, `title`, `briefMarkdown`, `formKind` (`SCRUM_RETRO_PLAN`/`QA_CHECKOUT_TESTING`), `rubricId`, `status` | |
| `Submission` | `userId`, `assignmentId`, `rubricVersion`, `payload` (JSON, validated per `formKind`), `submittedAt`, `assessmentState` (`AWAITING_REVIEW`/`ASSESSED`), `assessedBy` (`AUTOMATED`/`AUTOMATED_AI`/`ASSESSOR`) | One learner can submit again; each is a new row |
| `RubricScore` | `submissionId`, `criterionId`, `score` (0–3), `source` (`SELF`/`AUTOMATED`/`AI`/`ASSESSOR`), `comment`, `scoredById?` | `SELF` scores never count towards competency. `ASSESSOR` overrides others |

### 3.5 The three progress states (kept separate, CLAUDE.md Rule 5)
| Model | Key fields | Meaning |
|---|---|---|
| `LessonProgress` | `userId`, `lessonId`, `lastSectionKey`, `lastVersionId`, `startedAt`, `contentCompletedAt?` | **Content completed** |
| `AssessmentStatus` | `userId`, `assessmentId`, `bestScore`, `attemptsCount`, `passedAt?` | **Assessment passed** (updated from attempts) |
| `Competency` | `userId`, `assignmentId`, `submissionId`, `demonstratedAt`, `assessedBy`, `overriddenById?` | **Competency demonstrated** – only written by the rubric evaluator or an admin override, never by a submit action |

### 3.6 Learner tools, portfolio, certificates, coach
| Model | Key fields | Notes |
|---|---|---|
| `Note` | `userId`, `lessonId`, `sectionKey?`, `body` | |
| `Bookmark` | `userId`, `lessonId`, `sectionKey` | Unique per user + lesson + section |
| `StudyPlanWeek` | `userId`, `weekStart`, `items` (JSON) | Generated by a pure function from `weeklyMinutes` and remaining lesson times |
| `PortfolioItem` | `userId`, `submissionId?`, `kind`, `title`, `content` (JSON), `includeInShare` | Label "Simulated learning project – not paid work experience" is added at render time, so it can't be removed |
| `PortfolioShare` | `userId`, `tokenHash`, `enabled`, `revokedAt?` | Private link, learner can turn it off |
| `Certificate` | `userId`, `pathwayId`, `verificationId` (unique, random), `snapshot` (JSON: name, modules, assessments + dates), `issuedAt`, `revokedAt?` | Public `/verify/[id]` shows the snapshot |
| `SkillsStatement` | `userId`, `body` | Career tools (Phase 4) |
| `CoachMessage` | `userId`, `threadId`, `role`, `content`, `lessonRefs` (JSON), `isDemo` | |
| `FlaggedItem` | `reporterId`, `kind` (`AI_ANSWER`/`LESSON`/`QUESTION`), `targetId`, `reason`, `status` (`OPEN`/`RESOLVED`), `resolvedById?`, `resolution?` | Admin review queue |

### 3.7 Test Lab (Phase 3) and platform
| Model | Key fields | Notes |
|---|---|---|
| `LabSession` | `userId`, `state` (JSON: demo shop user, basket, orders), `resetAt` | Isolated synthetic data; never touches real users |
| `LabTestCase` | `userId`, `title`, `technique` (`EP`/`BVA`/`OTHER`), `preconditions`, `steps`, `testData`, `expected`, `status` (`NOT_RUN`/`PASS`/`FAIL`/`BLOCKED`), `actual?`, `executedAt?` | |
| `DefectReport` | `userId`, `submissionId?`, `title`, `area`, `environment`, `steps`, `expected`, `actual`, `severity`, `priority`, `evidence` | Match result is computed server-side on submission |
| `RateLimitBucket` | `key`, `windowStart`, `count` | A15 |
| `AuditLog` | `actorId?`, `action`, `entityType`, `entityId`, `before` (JSON), `after` (JSON), `createdAt` | Written for every admin change |

The **known defect list is not stored in the database**. It lives in `src/server/lab/defects.ts` (with `import "server-only"`), so it can't be sent to the browser by accident.

---

## 4. Route / page map

### 4.1 Public
| Route | Purpose |
|---|---|
| `/` | What the portal is, the two roles, honest notes on outcomes (SPEC §1) |
| `/register`, `/login`, `/forgot-password`, `/reset-password/[token]` | Auth |
| `/privacy` | Privacy notice (UK GDPR) |
| `/verify/[verificationId]` | Certificate verification |
| `/portfolio/shared/[token]` | Learner-controlled shared portfolio |
| `/dev/mailbox` | Demo mode only – reset emails |

### 4.2 Learner (signed in)
| Route | Purpose |
|---|---|
| `/onboarding` (steps: about you → skills → goals & time → accessibility → consent) | SPEC §2 |
| `/onboarding/diagnostic`, `/onboarding/result` | Diagnostic and recommendation, side-by-side role comparison |
| `/dashboard` | Continue, progress (3 states), history, study plan, quick review, portfolio progress |
| `/pathways`, `/pathways/[pathway]`, `/pathways/[pathway]/[module]` | Pathway and module overviews (incl. "Coming soon") |
| `/learn/[lesson]?section=[key]` | Lesson player (9 parts, autosave, notes, bookmarks, read aloud) |
| `/assessments/[slug]`, `/assessments/[slug]/attempt/[id]`, `/assessments/[slug]/attempt/[id]/result` | Module assessments, results with explanations and remediation links |
| `/review` | Quick review (spaced repetition) |
| `/assignments/[slug]`, `/assignments/[slug]/submissions/[id]` | Practical work, self-assessment, rubric feedback |
| `/lab`, `/lab/shop/*`, `/lab/test-cases`, `/lab/defects`, `/lab/sql`, `/lab/api` | ShopEasy Test Lab (Phase 3) |
| `/coach` | AI coach (Phase 4) |
| `/portfolio`, `/career`, `/career/interview`, `/certificate` | Phase 4 |
| `/notes`, `/bookmarks`, `/glossary`, `/glossary/[term]`, `/search` | Learner tools |
| `/settings`, `/settings/accessibility`, `/settings/data` | Profile, display prefs, data download, delete account |

### 4.3 Admin (`/admin/*`, server-side `ADMIN` check in the layout **and** in every action/route handler)
| Route | Purpose |
|---|---|
| `/admin` | Overview |
| `/admin/pathways`, `/admin/modules/[id]`, `/admin/lessons/[id]` (+ versions, diff, publish) | Curriculum CRUD, draft → review → published, prerequisites |
| `/admin/question-banks/[id]`, `/admin/assessments/[id]` | Questions, pass marks, draw count, cooldown |
| `/admin/rubrics/[id]`, `/admin/assignments/[id]`, `/admin/submissions` | Rubrics and assessor review/override |
| `/admin/review-queue` | Flagged content and AI answers |
| `/admin/reports` | Progress overview, most-failed questions, common gaps (aggregate) |
| `/admin/users` | Users and roles |
| `/admin/audit-log` | Audit log |

### 4.4 API route handlers
| Route | Purpose |
|---|---|
| `/api/auth/*` | Auth.js |
| `/api/me/export` | Learner data download (JSON) |
| `/api/portfolio/pdf`, `/api/certificate/pdf` | PDF downloads |
| `/api/lab/shop/*` | Mock ShopEasy API (allow-listed, used by the API sandbox) |
| `/api/coach` | AI coach (rate-limited) |
| `/api/admin/*` | Admin JSON endpoints (role-checked; covered by AC 12 tests) |

---

## 5. Content file formats (`content/`)

```
content/
  pathways.yaml                 # pathways, modules (incl. "coming soon"), order
  glossary.yaml                 # shared terms (lessons can add more)
  lessons/<pathway>/<module>/<nn>-<slug>.md
  questions/<bank-slug>.yaml
  rubrics/<rubric-slug>.yaml
  assignments/<assignment-slug>.md
```

Every file is validated with Zod on seed; a broken file stops the seed with a clear message (file, line, field).

### 5.1 Lesson (Markdown + front matter)
Each of the 9 parts is a level-2 heading with a fixed key in `{#…}`. The seed checks that all 9 are present and in order. `[[term]]` links to the glossary. `:::hint` blocks become expandable hints.

```markdown
---
slug: what-a-tech-team-does
module: foundations
order: 1
title: How software is built, and who does what
estimatedMinutes: 15
objectives:
  - Name the main roles in a software team and what each one does
glossary:
  - term: Developer
    definition: Someone who builds and changes the software.
knowledgeCheck: foundations-l1-check   # question bank slug
---

## Learning objective {#objective}
By the end you will be able to name the main roles in a software team and say what each one does.

## Explanation {#explanation}
A software product is built by a team. A [[developer]] writes and changes the code…

## New terms {#glossary}
(Rendered from the front matter glossary.)

## At ShopEasy {#workplace-example}
ShopEasy wants customers to save items for later…

## Worked example {#worked-example}
Here is how the "save for later" idea moves through the team…

## Guided practice {#guided-practice}
Who would you ask about how the save button should look?

:::hint
Think about who plans what users see on screen.
:::

## Your turn {#challenge}
Write down who you would speak to first about a slow checkout page, and why.

## Check your understanding {#knowledge-check}
(Rendered from the `foundations-l1-check` bank: 3–5 questions.)

## Feedback and next step {#next-step}
Well done. Next: how teams plan and test their work.
```

### 5.2 Question bank (YAML)
```yaml
slug: scrum-m1-assessment
title: Scrum fundamentals – module assessment
purpose: MODULE
module: scrum-fundamentals
questions:
  - key: sm1-q01
    type: SCENARIO
    objective: Explain the Scrum Master's accountability
    lessonRef: { lesson: scrum-accountabilities, section: explanation }
    scenario: >
      At ShopEasy, a stakeholder asks the Scrum Master to give a developer an
      urgent task in the middle of the Sprint.
    stem: What should the Scrum Master do next?
    options:
      - id: a
        text: Assign the task to the developer straight away.
        correct: false
        explanation: >
          The Scrum Master does not assign work. The Developers decide how to do
          the work in the Sprint Backlog.
      - id: b
        text: Help the stakeholder take the request to the Product Owner.
        correct: true
        explanation: >
          The Product Owner is accountable for ordering the Product Backlog, so
          new requests go to them.
      - id: c
        text: Tell the stakeholder that requests are never allowed during a Sprint.
        correct: false
        explanation: >
          Too strong. The Sprint Backlog can change if the Developers and Product
          Owner agree, as long as the Sprint Goal is not put at risk.
```
Validation: single choice/scenario has exactly one `correct: true`; every option has an `explanation`; `MODULE` banks have ≥ 25 active questions; each `lessonRef` points to a real lesson section.

### 5.3 Rubric (YAML)
```yaml
slug: scrum-retro-plan
title: Diagnosis, impediment log and retrospective plan
minimumRule: { minEach: 2 }     # competency only if no criterion scores below 2
criteria:
  - key: diagnosis
    title: Diagnosis of the team's problems
    descriptors:
      0: No diagnosis, or it only restates the scenario.
      1: Names symptoms but not likely causes.
      2: Names at least two likely causes linked to evidence in the scenario.
      3: As 2, and explains how the causes affect each other and the Sprint Goal.
  - key: impediment-log
    title: Impediment log
    autoCheck: impedimentLogComplete   # ≥ 3 entries, each with owner, impact and next step
    descriptors:
      0: …
      1: …
      2: …
      3: …
  # 4–6 criteria in total
```

---

## 6. Build steps for Phases 1–5

Every step ends with `pnpm lint && pnpm typecheck && pnpm test`. Playwright tests are written alongside the feature. "AC n" = SPEC §16 acceptance criterion.

### Phase 1 – Core platform
| # | Step | How it's tested |
|---|---|---|
| 1.1 | Scaffold Next.js + TS strict + Tailwind + shadcn, ESLint, Vitest, Playwright + axe; `docker-compose.yml` (Postgres app + test DB); `.env.example`; scripts in `package.json`; layout with skip link and focus styles | Smoke unit test; Playwright loads `/`; axe on `/` |
| 1.2 | Prisma schema (all models in §3 – fixed before Phase 2 so later phases don't need data-model changes), first migration | `prisma validate`; migration applies to test DB |
| 1.3 | Content loader: Zod schemas for lesson/bank/rubric/pathways files, seed script, demo accounts, 1 sample lesson + 25-question sample bank | Unit tests: valid files pass, each broken example fails with a clear message; seed runs twice without duplicates |
| 1.4 | Auth: register, login, logout, password reset (dev mailbox), `requireUser()` / `requireAdmin()` guards with `sessionVersion`, rate limit on login and reset | Unit: guards, token hashing/expiry. E2E: register → logout → login (**AC 1** part), reset via mailbox, **AC 12** (learner hits every `/admin/*` page and `/api/admin/*` endpoint → 403/redirect) |
| 1.5 | Onboarding steps, consent, accessibility prefs applied site-wide; diagnostic; recommendation + "help me choose" comparison | Unit: `recommend()` for each profile type. E2E: **AC 1**, **AC 2**; prefs persist and change the page (font class, text size, reduced motion) |
| 1.6 | Lesson player: 9 parts, section navigation, autosave position, notes, bookmarks, glossary links, read aloud, mark complete | Unit: resume-key fallback (A8). E2E: **AC 3** (leave mid-lesson, come back at the same section) |
| 1.7 | Quiz engine: draw, score all 4 types, explanations for every option, remediation links, retake with new questions, cooldown; spaced review items | Unit: `drawQuestions()`, `score()`, `nextReview()`. E2E: **AC 4**, **AC 5** (fail, see links, new attempt has different questions) |
| 1.8 | Progress model + prerequisite unlocking; dashboard (continue, 3 states, history, study plan, quick review) | Unit: `isUnlocked()`, `studyPlan()`. E2E: **AC 7** (logout/login, same progress and history) |
| 1.9 | Admin: CRUD + draft/review/publish for pathways, modules, lessons, banks; pass marks; users and roles; audit log | E2E: **AC 10** (edit + publish lesson and bank, learner sees change), **AC 11** (change pass mark, new attempt uses it, old attempt keeps old mark); every admin action writes an audit row |
| 1.10 | Data download (JSON) + account deletion; site search; privacy page | E2E: **AC 9**; **AC 13** (learner B can't load learner A's attempt, note, submission or export by ID – direct URLs and API); search finds lesson and glossary term |
| 1.11 | Accessibility sweep of Phase 1 pages | E2E: **AC 14** (axe, no serious/critical), **AC 15** (375px + keyboard-only for register, onboarding, lesson, assessment) |

### Phase 2a – Foundations content
| # | Step | How it's tested |
|---|---|---|
| 2a.1 | 5 Foundations lessons (SPEC §3), each with a 3–5 question knowledge check | Loader validation; `content-reviewer` agent; fix Must/Should items |
| 2a.2 | Foundations bank (25+), glossary entries | Loader validation (count, explanations, lessonRefs); reviewer |
| 2a.3 | Seed and check display | E2E: each lesson renders all 9 parts; glossary links resolve |

### Phase 2b – Pathway Module 1s and assignments
| # | Step | How it's tested |
|---|---|---|
| 2b.1 | Scrum Master Module 1: 3+ lessons, 25+ bank with scenarios; other modules "Coming soon" | Loader validation; reviewer (Scrum Guide 2020 accuracy, practice labels) |
| 2b.2 | QA Tester Module 1: 3+ lessons, 25+ bank; other modules "Coming soon" | Loader validation; reviewer (ISTQB terms) |
| 2b.3 | Assignment briefs + rubrics (4–6 criteria each) | Loader validation; reviewer |
| 2b.4 | Submission forms per assignment, self-assessment, automated checks, rubric evaluator (`evaluateRubric()`), "Awaiting assessor review", admin score/override, competency record with "assessed by" label | Unit: evaluator (self scores ignored, `minEach` rule, override precedence), each auto-check. E2E: **AC 6** (met → competency shown; not met → not shown; submit alone → not shown) |

### Phase 3 – Practice sandboxes
| # | Step | How it's tested |
|---|---|---|
| 3.1 | ShopEasy demo shop (login, basket, checkout) with 8–12 seeded defects implemented as pure functions; per-learner `LabSession`; reset | **Unit test per defect proving it happens**; unit tests that correct behaviour elsewhere still works |
| 3.2 | Test case writing and execution tracking | E2E: write, run, mark pass/fail |
| 3.3 | Defect report form + matcher (found / partly / missed), list revealed only after submission | Unit: matcher cases. E2E: submit 3 reports → feedback; check page source/JSON before submission contains no defect list |
| 3.4 | Checkout testing assignment connects to Test Lab (6+ test cases, 3+ defects) | E2E: QA assignment end to end |
| 3.5 | SQL sandbox (sql.js, synthetic dataset, guided exercises, reset) | Unit: exercise checker. E2E: run a query, reset; confirm no network call for learner SQL |
| 3.6 | Mock API + request builder (allow-list only) | Unit: allow-list rejects other hosts/paths. E2E: GET/POST mock endpoints; blocked URL shows message |

### Phase 4 – AI coach, portfolio, certificate, reporting
| # | Step | How it's tested |
|---|---|---|
| 4.1 | Coach: retrieval over published lesson text (Postgres full-text), system prompt treating learner text as untrusted, hint-first, lesson references, labels, flag button, rate limit, demo mode | Unit: retrieval, prompt builder strips personal data, rate limiter. E2E (demo mode): banner, label, flag → appears in admin queue |
| 4.2 | AI rubric feedback for criteria without auto-checks (labelled; guidance only) | Unit with a mocked model client |
| 4.3 | Portfolio: add items, fixed "Simulated learning project" label, PDF export, private share link on/off | E2E: **AC 8** (PDF downloads, contains label); share link stops working when turned off |
| 4.4 | Career tools: skills statement builder, CV guidance, interview question bank, mock interview via coach | E2E smoke |
| 4.5 | Certificate PDF + `/verify/[id]` (exact wording from SPEC §10; no "certified") | Unit: eligibility rule; test that the forbidden words never appear in generated text. E2E: verify page |
| 4.6 | Admin reports + review queue | E2E: aggregate numbers match seeded attempts |

### Phase 5 – Hardening and handover
| # | Step | How it's tested |
|---|---|---|
| 5.1 | Full test suite green | All suites |
| 5.2 | Security review: every route handler / server action has role + ownership check + Zod + rate limit where needed; add missing tests | Automated test that lists all server actions/route handlers and fails if one lacks a guard |
| 5.3 | Accessibility pass on every page; keyboard walk-through; 375px check | axe on all routes; manual check notes in PROGRESS |
| 5.4 | README, acceptance table with test files and real results, honest "Known limitations" | Review |

---

## 7. What I need from you

| # | Question | My recommendation |
|---|---|---|
| **Q1** | Before the AI coach exists (Phases 2b–3), how should judgement-based rubric criteria be scored? | Automated checks where possible + **admin assessor review** for the rest. Self-assessment shown but never counted. AI scoring added in Phase 4 |
| **Q2** | Does AC 1 "verify login" need **email verification**? | No for the MVP – just register, log out and log back in |
| **Q3** | Approve the extra dependencies in §2? | Yes |
| **Q4** | Where will this be hosted eventually (e.g. Vercel + managed Postgres, a VPS with Docker)? | Doesn't block Phase 1. Tell me if you already know, so I avoid anything that won't run there |
| **Q5** | OK with the certificate rule in §1.2 point 3 and the "Coming soon" handling in point 4? | Yes |
| **Q6** | Should I **push** each phase's commit to the branch `claude/career-switch-portal-setup-vr75kd` on GitHub? CLAUDE.md says don't push unless asked | Yes, push to that branch (never `main`) |
| **Q7** | `ANTHROPIC_API_KEY` | Not needed until Phase 4; the coach will run in demo mode without it |

---

## 8. Decisions after approval (10 Nov 2026)

### 8.1 Answers to §7
| # | Decision |
|---|---|
| Q1 | Automated checks where possible + admin assessor review for the rest. Self-assessment is shown but never counts. Automated guidance (see 8.2) is added in Phase 4 instead of AI scoring |
| Q2 | No email verification in the MVP |
| Q3 | Extra dependencies approved |
| Q4 | Hosting not decided; nothing vendor-specific |
| Q5 | Certificate rule and "Coming soon" handling approved |
| Q6 | Push each phase's commit to `claude/career-switch-portal-setup-vr75kd` (never `main`) |
| Q7 | Not needed – see 8.2 |

### 8.2 No AI provider or API key
The portal is built **without an AI API**, like the question-bank generators in the Oakling apps. This replaces every AI feature in SPEC §7, §9 and §10:

- **Questions:** authored questions plus **seeded generators** (`src/lib/questions/generators.ts`). A generator builds the question, its answer and an explanation for every option together, so answers are correct by construction and the same seed always gives the same question. Generated questions are snapshotted into each attempt.
- **Learning coach (Phase 4):** rule-based. It finds the relevant lesson sections with Postgres full-text search and answers with quotes and links from published lessons; gives hints first using the lesson's `:::hint` blocks; offers extra practice from generators and the learner's review queue; role-play and mock interviews follow authored scripts and checklists. Output is labelled "Automated guidance from course content – not reviewed by a person", and "Flag this answer" still feeds the admin review queue.
- **Practical work feedback:** automated checks per rubric criterion (e.g. impediment log has 3+ complete entries; test cases cover both boundaries) plus assessor review. `AssessedBy` uses `AUTOMATED`, `AUTOMATED_GUIDANCE` and `ASSESSOR`; there is no AI source.
- `@anthropic-ai/sdk` is not a dependency and `ANTHROPIC_API_KEY` is not used. No learner data leaves the server.

### 8.3 Technical decisions made in Phase 1
- **Versions:** Next.js 16.4 (App Router, Turbopack), React 19.3, Prisma 7.10 with the `pg` driver adapter, Auth.js 5 beta, Zod 4, Tailwind 4, Vitest 4, Playwright 1.63.
- **Cache Components are off.** Nearly every page is per-learner and reads the session cookie, so pages render on request.
- **shadcn/ui-style components are written by hand** in `src/components/ui` (same Radix/cva/tailwind-merge approach), because the shadcn registry isn't reachable from the build environment.
- **Question drafts:** `Question.draft` holds admin edits until the bank is published, so learners never see half-finished changes (AC 10). Retiring/restoring a question takes effect immediately; a module bank can't drop below 25 active questions.
- **Attempt snapshots:** every attempt answer stores exactly what the learner saw (including generated questions and explanations), so later edits never change old results.
- **Prisma client** is generated as CommonJS so the same client works in Next.js, the `tsx` seed script and Playwright.
- **E2E database:** Playwright's global setup applies migrations, empties every table and reseeds – only for a database whose name ends in `_test`. (Prisma's `migrate reset` is blocked when run by an AI agent, and this keeps the dev database untouched.)

