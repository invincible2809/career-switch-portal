# SPEC – Career-Switch Learning Portal

The product specification. Read only the sections the current phase needs.
For how to work, see CLAUDE.md. Record progress in docs/PROGRESS.md.

Audience: adults with non-IT work experience moving into IT roles. First two pathways: Scrum Master and QA Tester.
Assume learners know nothing about software development. Use plain UK English, a supportive tone, practical examples and accessible design.

## 1. Product goal and honesty
Help learners identify transferable skills, choose a role, follow a structured pathway, practise realistic workplace tasks and test their understanding at every stage.

Be honest throughout:
- Completing a course does not guarantee a job and does not replace work experience or external certification.
- Explain that "Scrum Master" roles often expect prior delivery or team experience. Suggest realistic stepping-stone roles where relevant (e.g. project coordinator, delivery/PMO assistant, junior business analyst, service desk/support analyst, UAT tester, junior manual tester).
- Do not use trademarked certification names as if this course grants them (e.g. CSM, PSM, ISTQB CTFL). You may say content is "aligned with" the Scrum Guide 2020 or ISTQB Foundation terminology. Do not copy or paraphrase official exam questions.

## 2. Onboarding and personal learning plan
Collect:
- Previous roles and industry
- Existing skills and confidence with technology (self-rated, 1–5)
- Preferred pathway: Scrum Master, QA Tester, or "Help me choose"
- Weekly study time and goals (e.g. "career change in 6 months")
- Accessibility needs and preferred format (text, audio, larger text, reduced motion, dyslexia-friendly font)

**Use** the accessibility answers: apply them as saved display settings the learner can change at any time.

Diagnostic assessment (10–12 questions, untimed, clearly "not a test you can fail"):
- Mix of tech familiarity, logical reasoning, attention to detail and scenario questions about working with people.
- Recommend a starting point (e.g. "start with Foundations" or "skip to Module 1") and explain why in plain language.
- "Help me choose" compares both roles side by side (day-to-day work, skills used, typical entry routes) and recommends one, with reasons. The learner always makes the final choice.

Transferable skills mapping (shown with examples tied to their answers):
- Customer service → communication, stakeholder management, spotting user problems
- Operations → process improvement, prioritisation, coordination
- Finance/administration → attention to detail, documentation, analytical thinking
- Teaching/training → facilitation, coaching, explaining complex ideas
- Retail, healthcare, hospitality, logistics → add sensible mappings too

Learners can change pathway and schedule at any time without losing progress.

## 3. Shared IT Foundations course
Running example used in every course: **"ShopEasy"**, a fictional online shop.

MVP: 5 lessons covering:
1. How software products are built, and who does what in a tech team
2. Software development and testing lifecycles; Agile principles and an introduction to Scrum
3. Requirements, user stories and acceptance criteria (incl. Given/When/Then)
4. Web apps, databases and APIs explained simply (front end, back end, data, requests/responses)
5. Issue tracking (Jira-style boards), collaboration tools and basic security awareness (phishing, passwords, data handling)

## 4. Scrum Master pathway
Source of truth: **The Scrum Guide (2020)**. Use its terms: Scrum Team, Product Owner, Developers, Scrum Master as *accountabilities*; the five events (the Sprint, Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective); three artifacts with their commitments (Product Backlog → Product Goal, Sprint Backlog → Sprint Goal, Increment → Definition of Done).

Clearly label every practice as either **"Scrum Guide"** or **"Common workplace practice (optional)"** — e.g. story points, velocity, burndown charts, planning poker and Jira are workplace practices, not Scrum rules.

Make clear that the Scrum Master is not the team's project manager, task assigner or meeting secretary.

Module list (MVP builds Module 1 in full; others show "Coming soon"):
1. **Scrum fundamentals** – accountabilities, events, artifacts, commitments, empiricism (transparency, inspection, adaptation), Scrum values
2. Facilitation and communication
3. Coaching and servant leadership
4. Supporting the Scrum events well
5. Impediments and conflict
6. Working with the Product Owner and stakeholders
7. Delivery measures and their limits (why velocity must not be used to compare teams or judge individuals)
8. Workplace scenarios and interview preparation

Practical exercises (MVP: one fully built and rubric-scored; the rest listed):
- **MVP assignment:** Given a fictional ShopEasy team situation (repeated unfinished work and a stakeholder pushing urgent work mid-Sprint), produce: (a) a short diagnosis of the problems, (b) an impediment log (3+ entries), (c) a 60-minute retrospective facilitation plan.
- Later: simulated retrospective, stakeholder conversation role-play, "spot the problems" team review.

## 5. QA Tester pathway
Terminology aligned with ISTQB Foundation Level (no claim of accreditation).

Module list (MVP builds Module 1 in full):
1. **Testing foundations** – why testing matters, quality assurance vs testing, the 7 testing principles in plain words, test levels and types, risk-based thinking
2. Analysing requirements and acceptance criteria
3. Test scenarios, test cases and test data
4. Test design techniques: equivalence partitioning and boundary value analysis
5. Exploratory testing (charters and session notes)
6. Defect reports; severity vs priority; retesting vs regression testing
7. Testing in Agile teams
8. Introductory SQL for testers
9. Introductory API testing
10. Optional: introduction to test automation (only after 1–9)

**Practice sandbox ("ShopEasy Test Lab")** — a self-contained demo app with **8–12 seeded, documented defects** across:
- Login (e.g. accepts wrong-case email, unhelpful error, no lockout)
- Basket (e.g. quantity accepts 0 or negative, total rounding error)
- Checkout (e.g. discount code applied twice, postcode validation boundary bug)
- Include at least one accessibility defect (e.g. missing form label)

Learners can explore, write and execute test cases, and submit defect reports (title, environment, steps, expected, actual, severity, priority, evidence). Compare submissions with the known-defect list to give feedback (found / partially described / missed), but do not reveal the full list until they've submitted.

**SQL sandbox:** run in the browser (e.g. SQLite via WebAssembly) on a synthetic dataset, reset per learner session. No server-side execution of learner SQL.

**API sandbox:** a mock ShopEasy API served by the app itself, with a simple request builder (method, URL from an allow-list, headers, JSON body). No outbound requests to arbitrary URLs.

**MVP assignment:** test the ShopEasy checkout: write 6+ test cases using equivalence partitioning and boundary values, execute them in the Test Lab, and submit 3+ defect reports.

## 6. Lesson structure
Each lesson (aim for 10–20 minutes; sections can be short):
1. Learning objective ("By the end you will be able to…")
2. Plain-English explanation
3. Glossary of new terms (also feeds a site-wide glossary)
4. Workplace example (ShopEasy)
5. Worked example
6. Guided practice (with hints)
7. Independent challenge
8. Knowledge check (3–5 questions)
9. Feedback and recommended next step

Save position automatically so learners can pause and resume mid-lesson. Allow notes and bookmarks per lesson.

## 7. Assessment
Types: baseline diagnostic, lesson knowledge checks, module assessments, scenario-based decisions, practical assignments, capstone projects (later phase), and spaced review questions.

Rules:
- Default pass mark **80%**, configurable per assessment by admins.
- Each MVP module needs a **question bank of at least 25 questions** (with explanations for every option) so that each attempt draws 10 varied questions. Ten questions in total is not enough for fresh retakes.
- Question types: single choice, multiple select, ordering, scenario-based ("What should the Scrum Master do next?").
- Spaced review: resurface missed or key questions after roughly 1, 3, 7 and 21 days in a short "Quick review" on the dashboard.

When a learner struggles:
- Explain each mistake in supportive language
- Link to the exact lesson section
- Offer targeted extra practice
- Allow a fresh attempt with different questions (no lockout; optional short cooldown, admin-configurable)

Progress model — keep these separate and visible:
- **Content completed** (viewed/finished lessons)
- **Assessment passed** (score ≥ pass mark)
- **Competency demonstrated** (practical work meeting the rubric's minimum criteria)

Practical work assessment:
- Each rubric has 4–6 criteria, each scored 0–3 with descriptors, plus minimum competency rules (e.g. "no criterion below 2").
- Feedback comes from: automated checks where possible + AI feedback (clearly labelled) + learner self-assessment.
- "Competency demonstrated" requires the minimum criteria to be met. Show who/what assessed it ("Automated + AI feedback – not reviewed by a person" vs "Reviewed by assessor"). Admins can review and override.
- Submission alone never counts as mastery.

Learners can revisit any content freely. Assessed milestones unlock when prerequisites are met.

## 8. Learner dashboard
- Current pathway and one clear "Continue" / next recommended activity
- Module progress, assessment results and history (improvement over time)
- Skills demonstrated vs skills needing practice
- Weekly study plan based on available time (adjusts gently; no streak penalties or guilt messages)
- Notes, bookmarks and quick-review questions
- Portfolio progress

## 9. AI learning coach
Can: explain simpler, relate concepts to the learner's previous job, give hints before answers, generate extra practice, role-play workplace conversations (e.g. a pushy stakeholder), give rubric-based feedback, and run mock interviews.

Guardrails:
- Ground answers in course content (retrieval over lesson text) and show lesson references.
- Label all AI output "AI-generated – may contain mistakes" and add a "Flag this answer" button that feeds the admin review queue.
- Hint-first: don't hand over full answers to assessed questions or write assignments for the learner.
- Don't send unnecessary personal data to the model; keep the API key server-side; rate-limit per user; treat learner text as untrusted (prompt-injection safe system prompt).
- **Demo mode** when no API key is set: return clearly labelled sample responses and show a banner saying the AI coach isn't connected.
- AI scores are guidance only, never presented as verified professional competence.

## 10. Portfolio and career preparation
- Learners add completed practical work to a portfolio (Scrum: retro plan, facilitation agenda, improvement proposal, scenario reflections; QA: test plan, test cases, defect reports, exploratory notes, API exercises).
- Every item is watermarked/labelled **"Simulated learning project – not paid work experience"**.
- Export portfolio as PDF and as a shareable private link (learner controls visibility).
- Career tools: transferable-skills statement builder, CV guidance with honest before/after examples, interview question bank, mock interviews.
- **Certificate of Completion** (PDF): learner name, pathway, modules completed, assessments passed with dates, unique verification ID, and the statement "This is not an accredited qualification." Never use the word "certified".

## 11. Admin area
- Manage pathways, modules, lessons, prerequisites (draft → review → published)
- Question banks, rubrics, pass marks
- Content versioning with review dates; learners mid-lesson keep their progress when content changes
- Review queue for flagged content and AI answers
- Reporting: learner progress, most-failed questions, common gaps (aggregate, not just individual)
- User and role management (Learner, Admin; design so Content Editor/Assessor can be added later)
- Audit log of admin changes

## 12. Design and accessibility
- Calm, modern, professional light theme; mobile-first
- Meet **WCAG 2.2 AA**: contrast, full keyboard use, visible focus, skip links, form labels, error messages linked to fields, respects reduced-motion
- Readable typography (16px+ base, comfortable line length)
- Transcripts/captions for any audio or video
- Imagery: use illustrations or clearly marked placeholders with alt text representing adults from varied ages and backgrounds; don't use unlicensed stock photos
- No childish gamification (no cartoon badges, confetti, leaderboards). Simple progress bars and milestone messages are fine
- Avoid jargon; when a technical term is needed, link it to the glossary

## 13. Data protection (UK GDPR)
- Privacy notice and clear consent for optional data (e.g. accessibility needs, previous employment)
- Collect the minimum data needed
- Learners can download their data and delete their account
- Admins see learner data only as needed for their role
- Synthetic data only in all sandboxes
- No learner code or queries run against production systems

## 14. Integrations
If something needs credentials (email for password reset, AI provider, file storage), say exactly what is needed and provide a labelled demo mode:
- Email: in demo mode, show reset links in the server log / a dev mailbox page
- AI: demo responses as above
Never pretend an integration is live.

## 15. MVP scope
- Registration, login, password reset, learner/admin roles
- Onboarding + diagnostic + recommendation
- Foundations course (5 lessons)
- Scrum Master Module 1 and QA Tester Module 1, each with **at least 3 complete lessons** and a **25+ question bank**
- One practical assignment per pathway with rubric scoring
- ShopEasy Test Lab with seeded defects (SQL and API sandboxes can be basic)
- Learner dashboard, saved progress, notes/bookmarks
- Portfolio save + PDF export
- Basic admin interface
- Unbuilt modules shown as "Coming soon"
- Site search across lessons and glossary

## 16. Acceptance criteria (write Playwright tests for each)
A learner can:
1. Register, verify login, and complete onboarding
2. Receive a pathway recommendation with an explanation
3. Complete a lesson, leave mid-way, and resume at the same point
4. Take a module assessment and get correct scores and explanations
5. Fail an assessment, see remediation links, and retry with different questions
6. Submit a practical assignment and see rubric feedback, with "competency demonstrated" shown only if minimum criteria are met
7. Log out, log back in, and see accurate progress and history
8. Add work to their portfolio and export it as PDF
9. Download their data and delete their account

An admin can:
10. Edit and publish a lesson and a question bank, and the change appears for learners
11. Change a pass mark and see it applied to new attempts

Security:
12. A learner cannot reach any admin page or admin API (test direct URL and API calls)
13. A learner cannot view another learner's data

Accessibility:
14. Run an automated accessibility check (e.g. axe) on key pages with no serious violations
15. Key journeys work at 375px width and by keyboard only

## 17. Deliverables
- Working source code with README (setup, run, test, seed)
- `.env.example`
- Seed script with demo content and demo accounts:
  - Learner: `learner@demo.local` / documented password
  - Admin: `admin@demo.local` / documented password
- Test results for the acceptance criteria
- An honest list of limitations, shortcuts, mocked features and recommended next steps

