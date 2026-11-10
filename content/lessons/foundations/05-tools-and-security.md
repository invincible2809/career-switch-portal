---
slug: tools-and-security
module: foundations
order: 5
title: Work tracking, collaboration tools and staying secure
estimatedMinutes: 17
objectives:
  - Explain how teams track work on a board and in tickets
  - Describe the main collaboration tools in a software team
  - Spot the signs of phishing and describe safe habits for passwords and data
knowledgeCheck: foundations-l5-check
glossary:
  - term: Board
    definition: A visual way of tracking work, with columns such as To do, In progress and Done, and a card for each piece of work.
  - term: Ticket
    definition: A record of one piece of work, such as a task, a user story or a bug, usually in a tool like Jira.
  - term: Phishing
    definition: A fake message that tries to trick you into clicking a link, opening an attachment or giving away details such as a password.
  - term: Multi-factor authentication
    definition: Logging in with something extra as well as a password, such as a code from an app on your phone. Also called MFA or two-step verification.
  - term: Personal data
    definition: Any information about a living person who can be identified, such as their name, email address or order history.
  - term: Test data
    definition: The information needed to run tests, such as accounts, products and orders. It's best to use made-up data so that real people's personal data isn't exposed.
---

## Learning objective {#objective}
By the end of this lesson you will be able to:

- explain how teams track work on a board and in tickets
- describe the main collaboration tools in a software team
- spot the signs of phishing and describe safe habits for passwords and data

This lesson takes about 17 minutes.

## Explanation {#explanation}
### Tracking work
Most software teams track their work on a **[[board]]**. Each piece of work is a card or **[[ticket]]**, and it moves across columns as it progresses – for example **To do → In progress → In review (a colleague checks the work) → Done**.

A ticket usually records a title, a description (often a user story with acceptance criteria), who is working on it, its priority, and comments. Bugs are tracked as tickets too.

Jira is the best-known tool for this; others include Azure DevOps, Trello and Linear. *Common workplace practice (optional):* boards, tickets and tools like Jira aren't part of Scrum itself – the Scrum Guide doesn't say how to track work – but most Scrum teams use them.

### Collaboration tools
You'll also meet:

- **chat** (such as Slack or Microsoft Teams) for quick questions
- **video calls** for meetings and pairing up on a problem
- **a wiki or shared documents** (such as Confluence) for things the team needs to keep, like how to set up test data
- **shared calendars** for the team's regular meetings

A good habit: decisions made in chat or on a call should be written down somewhere the whole team can find them – often in the ticket.

### Staying secure
Software teams handle valuable information, so everyone is responsible for security.

**[[Phishing]]** messages pretend to be from someone you trust. Warning signs:

- pressure to act quickly ("your account will be closed today")
- a sender address or link that doesn't quite match the real company
- requests for passwords or payment details
- unexpected attachments

If in doubt, don't click. Go to the website yourself or check with the sender another way, and report it to your IT or security team.

**Passwords:** use a long, different password for every account – three random words is a good start. A **password manager** remembers them for you. Turn on **[[multi-factor authentication]]** wherever you can.

**Handling data:** [[personal data]] about customers is protected by law (in the UK, by UK GDPR and the Data Protection Act 2018). Only look at what you need for your work, don't copy it into chat or screenshots, and use made-up **[[test data]]** when testing. Lock your screen when you step away.

## New terms {#glossary}
These terms are used in this lesson. You can find them all in the glossary at any time.

## At ShopEasy {#workplace-example}
ShopEasy's team uses a board with five columns: **To do, In progress, In review, Testing, Done**.

The "Save for later" story moves across it during the Sprint. When the tester finds that saved items disappear after logging out, they open a **bug ticket** linked to the story, with clear steps to reproduce it. The developer fixes it, and both tickets move to Done once the tests pass.

Last month, several people at ShopEasy got an email that looked like it came from the payment company: *"Urgent: confirm your admin login within 2 hours or payments will stop."* The link went to a look-alike website. One tester spotted that the sender's address ended in a slightly different domain, didn't click, and reported it to the security team, who warned everyone.

## Worked example {#worked-example}
A tester finds a bug: a customer's full name and address appear on the order confirmation page of a *different* customer.

Here's how they handle it safely:

1. **Write a clear ticket.** Title: "Order confirmation shows another customer's address". Steps, expected result and actual result.
2. **Use test data in the evidence.** They reproduce it with two made-up test accounts and take screenshots of those – not of the real customer's details.
3. **Don't share personal data in chat.** In the team chat they write "Possible data leak on order confirmation – details in ticket SE-412", instead of pasting the screenshot.
4. **Flag it as urgent.** Showing one customer's details to another is a serious problem – a possible data breach – so they tell their lead and the security contact straight away.

The bug gets fixed quickly, and no extra personal data is spread around while doing so.

## Guided practice {#guided-practice}
You receive this email:

> *From: IT Support <it-helpdesk@shopeasy-support.example>*\
> *Your mailbox is full. Log in within 1 hour at the link below or you will lose your emails.*

List the warning signs before you open the hints.

:::hint
Look at the sender's address, the deadline and what it asks you to do.
:::

:::hint
ShopEasy's real emails come from "shopeasy.example", so "shopeasy-support.example" is a look-alike; there's pressure to act within an hour; and it asks you to log in through a link. Report it rather than clicking.
:::

A developer asks you to send them a real customer's order history so they can test a fix. What's a safer option?

:::hint
Think about the made-up data testers use.
:::

:::hint
Ask for, or create, made-up test data that recreates the problem – or a copy with the personal details removed. Don't send a real customer's data.
:::

## Your turn {#challenge}
In your notes, write down:

1. three columns you'd use on a board for organising something in your own life (for example a house move)
2. one account of yours that doesn't have multi-factor authentication turned on yet – and, if you're comfortable, turn it on

## Check your understanding {#knowledge-check}
Answer these questions to check your understanding. They don't count towards your progress, and you'll see an explanation for every option.

## Feedback and next step {#next-step}
Well done – you've finished the last IT Foundations lesson. You now know how software is built, how teams plan and test, how requirements are written, how websites work behind the scenes, and how teams track work safely.

**Next:** take the **IT Foundations module assessment** to check your understanding. Then move on to Module 1 of your pathway.
