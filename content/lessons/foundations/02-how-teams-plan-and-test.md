---
slug: how-teams-plan-and-test
module: foundations
order: 2
title: How teams plan and test their work
estimatedMinutes: 18
objectives:
  - Describe the software development and testing lifecycles
  - Explain the difference between working in one big plan and working in small steps
  - Name the four Agile values
  - Name the parts of Scrum (its accountabilities, events and artifacts)
knowledgeCheck: foundations-l2-check
glossary:
  - term: Lifecycle
    definition: The stages a piece of work goes through from start to finish.
  - term: Waterfall
    definition: A way of working where each stage is finished before the next one starts, usually with one release at the end.
  - term: Iteration
    definition: One short cycle of planning, building, testing and reviewing, repeated many times.
  - term: Agile
    definition: A set of values and principles for building software in small steps, learning from feedback as you go.
  - term: Scrum
    definition: A lightweight framework that helps teams work in short cycles called Sprints. Described in the Scrum Guide.
  - term: Sprint
    definition: In Scrum, a fixed period of one month or less in which the team creates a useful, finished piece of work.
  - term: Product Backlog
    definition: In Scrum, the ordered list of everything that might be needed to improve the product.
  - term: Developers (in Scrum)
    definition: In Scrum, everyone in the Scrum Team who creates the work, including testers – not only people who write code.
  - term: Increment
    definition: In Scrum, a usable step towards the Product Goal that meets the team's Definition of Done.
---

## Learning objective {#objective}
By the end of this lesson you will be able to:

- describe the software development and testing lifecycles
- explain the difference between working in one big plan and working in small steps
- name the four Agile values
- name the parts of Scrum: its accountabilities, events and artifacts

This lesson takes about 18 minutes.

## Explanation {#explanation}
In Lesson 1 you saw the stages a change goes through: idea, understand the need, design, build, test, release, and learn. Together these are called the **software development [[lifecycle]]**.

Testing has a lifecycle of its own. Testers **plan** the testing, **analyse** what needs testing, **design** the tests, **prepare** test data and anything else needed, **run** the tests, **track and report** progress and what they found, and finally **wrap up**, noting lessons for next time. Testers often call this the *test process*. This runs alongside development, not only at the end.

### One big plan, or small steps?
There are two broad ways to organise the work.

- **[[Waterfall]]:** each stage is finished before the next starts. All the planning happens first, then all the building, then all the testing, with one big release at the end. It can suit work where the needs are fixed and well understood – but problems are often found late, when they are expensive to fix.
- **Small steps (iterative):** the team goes round the whole cycle many times, a little at a time. Each [[iteration]] produces something that can be shown to users. The team learns from feedback and adjusts.

Most software teams today work in small steps.

### Agile
**[[Agile]]** describes a way of thinking about software work. In 2001 a group of developers wrote the *Manifesto for Agile Software Development*. It says they had come to value:

- **Individuals and interactions** over processes and tools
- **Working software** over comprehensive documentation
- **Customer collaboration** over contract negotiation
- **Responding to change** over following a plan

The Manifesto adds that the items on the right still matter – the items on the left just matter more. Agile isn't a set of rules or a job title. It's a mindset that many methods build on.

### Scrum, briefly
**[[Scrum]]** is one of the most widely used ways of working in small steps. It is described in the *Scrum Guide* (2020). The work happens in **[[Sprint|Sprints]]** of one month or less. Here are the pieces you'll meet – the Scrum Master pathway covers them in depth.

- **Three accountabilities** in one Scrum Team: the **Product Owner** (orders the work to get the most value), the **Developers** (everyone who creates the work, including testers) and the **Scrum Master** (helps the team and organisation use Scrum well, and is accountable for the team's effectiveness – not a project manager who hands out tasks).
- **Five events:** the Sprint itself, Sprint Planning, the Daily Scrum, the Sprint Review and the Sprint Retrospective.
- **Three artifacts:** the **[[Product Backlog]]**, the Sprint Backlog and the **[[Increment]]**. Each has a commitment that keeps the team focused: the Product Goal, the Sprint Goal and the Definition of Done (the shared standard that says when work is finished).

Notice that in Scrum "[[Developers (in Scrum)|Developers]]" means everyone doing the work – a tester in a Scrum Team is one of the Developers.

## New terms {#glossary}
These terms are used in this lesson. You can find them all in the glossary at any time.

## At ShopEasy {#workplace-example}
ShopEasy used to work in one big plan. Two years ago they spent nine months building a new checkout and released it all at once. On launch day customers couldn't use discount codes on phones – and nobody had tested that combination. Fixing it took weeks.

Now ShopEasy uses Scrum with two-week Sprints.

- The **Product Owner** keeps the Product Backlog in order, with the most valuable work at the top. "Let customers save items for later" is near the top.
- In **Sprint Planning**, the whole Scrum Team agrees what they can achieve in the next two weeks and why it matters.
- Every day, the Developers meet for a 15-minute **Daily Scrum** to check progress towards the Sprint Goal and adjust their plan.
- At the **Sprint Review**, they show the working "Save for later" button to the support team and some managers. Together they talk about the feedback and agree what to do next, and the Product Owner updates the Product Backlog.
- At the **Sprint Retrospective**, the team talks about how they worked and picks something to improve next time.

Testing happens inside every Sprint, so problems like the discount code bug are found in days, not months.

## Worked example {#worked-example}
ShopEasy wants to add gift wrapping. Let's compare the two approaches.

**One big plan:** the team writes a full specification for gift wrapping, gift messages, gift receipts and wrapping styles. Six months later everything is released together. The team then discovers customers mostly wanted gift receipts – the wrapping styles are hardly used.

**Small steps:**

1. **Sprint 1:** the simplest version – a "This is a gift" tick box that hides prices on the delivery note. It's tested and released.
2. The team watches what happens. Lots of people tick the box, and the support team says customers keep asking for a gift message.
3. **Sprint 2:** add a short gift message. Tested and released.
4. **Sprint 3:** the Product Owner looks at the feedback and decides wrapping styles can wait. Something more valuable goes to the top of the Product Backlog instead.

Small steps meant the team learned what customers actually wanted before spending months on it.

## Guided practice {#guided-practice}
Sort these into **Scrum accountabilities**, **Scrum events** and **Scrum artifacts**:

Sprint Review · Product Owner · Increment · Daily Scrum · Developers · Product Backlog

:::hint
There are two of each. Accountabilities are about people. Events are things that happen at set times. Artifacts are things the team works on and can look at.
:::

:::hint
Accountabilities: Product Owner and Developers. Events: Sprint Review and Daily Scrum. Artifacts: Increment and Product Backlog.
:::

Now think: why might a tester prefer to work in small steps rather than one big plan?

:::hint
Think about when problems get found, and how much has been built on top of them by then.
:::

## Your turn {#challenge}
Think of a project you've seen at work or at home – moving house, organising an event, changing a process.

In your notes, write two or three sentences on how it would have gone in **one big plan**, and how it could have gone in **small steps**. Where would feedback have helped?

## Check your understanding {#knowledge-check}
Answer these questions to check your understanding. They don't count towards your progress, and you'll see an explanation for every option.

## Feedback and next step {#next-step}
Well done. You've seen why most teams work in small steps, what Agile values, and the basic shape of Scrum.

If the Scrum terms feel like a lot, that's normal – you'll meet them again many times. They are all in the glossary.

**Next:** Lesson 3 looks at how teams write down what they need to build, using user stories and acceptance criteria.
