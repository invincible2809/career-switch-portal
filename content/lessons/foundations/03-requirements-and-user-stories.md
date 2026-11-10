---
slug: requirements-and-user-stories
module: foundations
order: 3
title: Requirements, user stories and acceptance criteria
estimatedMinutes: 18
objectives:
  - Explain what a requirement is and why vague requirements cause problems
  - Write a user story in the "As a…, I want…, so that…" format
  - Write acceptance criteria in the Given / When / Then format
knowledgeCheck: foundations-l3-check
glossary:
  - term: User story
    definition: A short description of something a user needs, written from their point of view, usually "As a …, I want …, so that …".
  - term: Acceptance criteria
    definition: The conditions a piece of work must meet to be accepted as done for a particular user story.
  - term: Given When Then
    definition: A way of writing acceptance criteria as a starting situation (Given), an action (When) and an expected result (Then).
  - term: Edge case
    definition: An unusual situation at the limits of what the software should handle, such as an empty basket or the last item in stock.
---

## Learning objective {#objective}
By the end of this lesson you will be able to:

- explain what a requirement is and why vague requirements cause problems
- write a user story in the "As a…, I want…, so that…" format
- write acceptance criteria in the Given / When / Then format

This lesson takes about 18 minutes.

## Explanation {#explanation}
A [[requirement]] is a statement of what the software must do, or how well it must do it. The clearer it is, the better. Clear requirements help everyone – the developers know what to build and the testers know what to check.

Vague requirements cause trouble. "The checkout should be fast" means different things to different people. How fast? On which devices? With how many items in the basket?

### User stories
Many teams write requirements as **[[user story|user stories]]**. A user story describes a need from the user's point of view:

> **As a** *(type of user)*, **I want** *(something)*, **so that** *(the reason it matters)*.

For example: *As a returning customer, I want my delivery address to be remembered, so that I can check out more quickly.*

The "so that" part is important. It tells the team *why*, which helps them make sensible decisions. A user story is a starting point for a conversation, not a complete specification.

### Acceptance criteria
A story on its own is too short to build or test from. So each story has **[[acceptance criteria]]**: the conditions it must meet to be accepted as done.

A popular way to write them is **[[Given When Then]]**:

- **Given** – the starting situation
- **When** – the action or event (usually something the user does)
- **Then** – what should happen

> **Given** I am logged in and have a saved address\
> **When** I go to the checkout\
> **Then** my saved address is already filled in

*Common workplace practice (optional):* user stories and Given / When / Then aren't part of the Scrum Guide, but many Scrum teams use them to describe Product Backlog items.

Good acceptance criteria are specific and can be checked: you can say clearly whether each one has passed or failed. They also cover the unhappy paths – what happens when something goes wrong – and [[edge case|edge cases]].

## New terms {#glossary}
These terms are used in this lesson. You can find them all in the glossary at any time.

## At ShopEasy {#workplace-example}
The Product Owner at ShopEasy adds this to the Product Backlog:

> *As a shopper, I want to apply a discount code at checkout, so that I pay the reduced price.*

While refining the Product Backlog, the Product Owner and two of the Developers – one who will write the code and one who will test it – talk it through. The tester asks questions nobody had thought of: What if the code has expired? Can two codes be used together? Is the code case-sensitive?

Together they agree acceptance criteria, including:

> **Given** my basket total is £40 and I have the code SAVE10 (10% off)\
> **When** I apply the code at checkout\
> **Then** the total shows £36.00

> **Given** the code SPRING has expired\
> **When** I apply it at checkout\
> **Then** I see the message "This code has expired" and the total doesn't change

That conversation took 20 minutes. It saved days of rework later.

## Worked example {#worked-example}
Here's a vague requirement turned into something testable.

**Vague:** "Customers should be able to return items."

**Step 1 – write the user story.** Who needs this, and why?
*As a customer, I want to start a return online, so that I don't have to phone the support team.*

**Step 2 – ask questions.** How long do customers have? Which items can't be returned? What happens after they start a return?

**Step 3 – write acceptance criteria**, including an unhappy path:

> **Given** I received my order 10 days ago\
> **When** I choose "Return an item"\
> **Then** I can pick the items and a reason, and I get a returns label by email

> **Given** I received my order 40 days ago (the limit is 30 days)\
> **When** I choose "Return an item"\
> **Then** I see "Returns are only possible within 30 days" and a link to contact support

Each one can now be tested with a clear pass or fail.

## Guided practice {#guided-practice}
Which part of this user story is missing?

*As a shopper, I want to see delivery dates before I pay.*

:::hint
Look for the three parts: As a…, I want…, so that…
:::

:::hint
It's missing the "so that" – the reason. For example: "…so that I know whether it will arrive in time."
:::

Now look at this acceptance criterion. What's wrong with it?

> **Given** I'm on the basket page **When** I change the quantity **Then** it works properly

:::hint
Could two people disagree about whether this passed?
:::

:::hint
"Works properly" can't be checked. A better Then: "the line total and the basket total update straight away".
:::

## Your turn {#challenge}
Pick one: a **wish list** feature, a **"notify me when back in stock"** button, or **choosing a delivery day**.

In your notes, write:

1. one user story in the "As a…, I want…, so that…" format
2. two acceptance criteria in Given / When / Then – one for the normal case and one for something going wrong

## Check your understanding {#knowledge-check}
Answer these questions to check your understanding. They don't count towards your progress, and you'll see an explanation for every option.

## Feedback and next step {#next-step}
Well done. You can now turn a vague request into a user story with clear acceptance criteria – a skill used by product owners, business analysts, testers and Scrum teams alike.

**Next:** Lesson 4 explains what actually happens inside a website when a customer clicks a button.
