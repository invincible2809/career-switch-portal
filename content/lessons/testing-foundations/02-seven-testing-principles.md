---
slug: seven-testing-principles
module: testing-foundations
order: 2
title: The seven testing principles
estimatedMinutes: 18
objectives:
  - Explain each of the seven testing principles in plain words
  - Apply the principles to decide how to approach testing a change
knowledgeCheck: qa-l2-check
glossary:
  - term: Exhaustive testing
    definition: Testing every possible combination of inputs and conditions. Impossible for all but the simplest software.
  - term: Defect clustering
    definition: The pattern where most defects are found in a small number of areas of the software.
  - term: Regression testing
    definition: Testing to check that a change hasn't broken something that used to work.
---

## Learning objective {#objective}
By the end of this lesson you will be able to:

- explain each of the seven testing principles in plain words
- apply the principles to decide how to approach testing a change

This lesson takes about 18 minutes.

## Explanation {#explanation}
Over many years, testers have noticed patterns that hold true on almost every project. ISTQB Foundation Level describes them as seven principles.

**1. Testing shows the presence, not the absence, of defects.**
Testing can show that defects exist. It can't prove there are none left. "We tested it and found nothing" means the risk is lower, not zero.

**2. Exhaustive testing is impossible.**
**[[Exhaustive testing]]** – trying every possible input and combination – isn't possible, except for trivial cases. Testers choose tests carefully, using techniques, risk and priorities.

**3. Early testing saves time and money.**
A defect found in a requirement costs a conversation to fix. The same defect found after release can cost days, money and customer trust. Testers get involved as early as possible.

**4. Defects cluster together.**
A small number of areas usually contain most of the defects – often complicated or frequently changed parts. This is called **[[defect clustering]]**. Where testers find one defect, they look for more nearby.

**5. Tests wear out.**
If the same tests are run again and again, they eventually stop finding new defects. Tests need to be reviewed and new ones added. Repeating tests still has value – for example in **[[regression testing]]** – but it won't find new kinds of defect.

**6. Testing is context dependent.**
There's no single right way to test. A bank's payment system, a hospital app and a small shop's website need different approaches.

**7. Absence-of-defects fallacy.**
Software with no defects can still be useless if it doesn't meet users' needs. Testing should check that the right thing was built, not only that it was built right.

## New terms {#glossary}
These terms are used in this lesson. You can find them all in the glossary at any time.

## At ShopEasy {#workplace-example}
Here's how the principles show up at ShopEasy:

- **Early testing:** Asha, a tester, reads the user story for gift cards before Sprint Planning and asks "Can a gift card be used to buy another gift card?" Nobody had thought about it – a five-minute conversation saves rework later.
- **Defect clustering:** over the last year, most of ShopEasy's defects were in the discount code and checkout areas. When the checkout changes, Asha tests it more deeply than, say, the "About us" page.
- **Tests wear out:** the team has run the same 20 checkout tests for months, and they haven't found a defect in a long time. Asha adds new ones for recent changes, such as paying with a gift card.
- **Absence-of-defects fallacy:** the new returns page passed every test – but customers still phoned support because they couldn't find it. It worked perfectly, but didn't meet their need.

## Worked example {#worked-example}
ShopEasy is adding a "Choose a delivery day" option. Asha has half a day to test it. How do the principles shape her plan?

1. **Exhaustive testing is impossible** – she can't try every date, postcode and basket combination. She picks representative examples: today, tomorrow, a Sunday, a bank holiday, a date far in the future.
2. **Defect clustering** – the checkout has had many defects before, so she spends extra time on how the delivery day affects the order total and confirmation email.
3. **Context dependent** – it's a shop, not a safety-critical system, so a lighter, exploratory approach is reasonable alongside the agreed acceptance criteria.
4. **Absence-of-defects fallacy** – she also asks two people from support to try it: can a real customer understand the choices?
5. **Presence, not absence** – in her summary, she writes what she tested and what she didn't, and the remaining risks, rather than "it's bug-free".

## Guided practice {#guided-practice}
Which principle does each statement go against?

- "We've run our tests on every release for two years. They always pass, so the software must be fine."
- "Let's test every possible discount code before release."

:::hint
One is about running the same tests for a long time; the other is about trying everything.
:::

:::hint
The first goes against "tests wear out" (and "testing shows presence, not absence"). The second goes against "exhaustive testing is impossible".
:::

A manager says: "Testers should only start when the developers have finished." Which principle would you point to?

:::hint
Think about when defects are cheapest to find.
:::

## Your turn {#challenge}
Pick one principle that surprised you.

In your notes, write two or three sentences explaining it to a friend who has never worked in IT, using an example from everyday life – cooking, driving, checking a bill.

## Check your understanding {#knowledge-check}
Answer these questions to check your understanding. They don't count towards your progress, and you'll see an explanation for every option.

## Feedback and next step {#next-step}
Well done. The seven principles explain why testers choose tests carefully, start early and focus where the risk is.

**Next:** Lesson 3 covers test levels, test types and how risk helps decide what to test first.
