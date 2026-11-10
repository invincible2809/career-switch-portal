---
slug: levels-types-and-risk
module: testing-foundations
order: 3
title: Test levels, test types and risk
estimatedMinutes: 20
objectives:
  - Describe the main test levels and what each one focuses on
  - Tell apart functional and non-functional testing, and confirmation and regression testing
  - Use likelihood and impact to decide what to test first
knowledgeCheck: qa-l3-check
glossary:
  - term: Test level
    definition: A group of testing activities organised around one stage of development, such as component, integration, system or acceptance testing.
  - term: Test type
    definition: A group of testing activities with a particular focus, such as functional or non-functional testing.
  - term: Component testing
    definition: Testing one small part of the software on its own. Also called unit testing.
  - term: Integration testing
    definition: Testing how parts of the software, or separate systems, work together.
  - term: System testing
    definition: Testing the whole system to check it does what it should, end to end.
  - term: Acceptance testing
    definition: Testing whether the software meets users' and the business's needs and is ready to be used. User acceptance testing (UAT) is one kind.
  - term: Functional testing
    definition: Testing what the software does, such as whether a discount is applied correctly.
  - term: Non-functional testing
    definition: Testing how well the software does it, such as speed, security, accessibility or ease of use.
  - term: Confirmation testing
    definition: Testing again after a fix to confirm the defect has gone. Often called retesting.
  - term: Risk
    definition: Something that might go wrong in the future. Its level depends on how likely it is and how bad the impact would be.
---

## Learning objective {#objective}
By the end of this lesson you will be able to:

- describe the main test levels and what each one focuses on
- tell apart functional and non-functional testing, and confirmation and regression testing
- use likelihood and impact to decide what to test first

This lesson takes about 20 minutes.

## Explanation {#explanation}
### Test levels
A **[[test level]]** is a stage of testing with its own focus. From small to big:

| Level | What's tested | Often done by |
|---|---|---|
| **[[Component testing]]** (unit testing) | One small part on its own – for example, the function that works out delivery cost | Developers, often automated |
| **[[Integration testing]]** | Parts working together – for example, the basket talking to the stock database, or ShopEasy talking to the payment company | Developers and testers |
| **[[System testing]]** | The whole system, end to end – for example, browsing, adding to basket, paying and getting a confirmation email | Testers |
| **[[Acceptance testing]]** | Whether it meets users' and the business's needs and is ready to use | Users, business people, testers |

User acceptance testing (UAT) is a kind of acceptance testing done by real users or their representatives – a common first job for people moving into testing.

### Test types
A **[[test type]]** describes the *focus* of a test. Any type can happen at any level.

- **[[Functional testing]]** checks *what* the software does: is the 10% discount applied correctly?
- **[[Non-functional testing]]** checks *how well* it does it: is checkout fast enough on a slow phone? Is it secure? Can someone using only a keyboard complete it?

### Testing after a change
Two kinds of testing happen whenever something changes:

- **[[Confirmation testing]]** (retesting) – checking that a specific defect has really been fixed
- **[[Regression testing]]** – checking that the change hasn't broken anything that used to work

They answer different questions, and both are needed.

### Risk-based thinking
There's never time to test everything equally (remember: exhaustive testing is impossible). Testers use **[[risk]]** to decide where to spend effort. For each area, ask:

- **Likelihood:** how likely is it to go wrong? (Is it new, complicated or often changed?)
- **Impact:** how bad would it be? (Would customers lose money, data or trust?)

High likelihood and high impact gets tested first and most deeply.

## New terms {#glossary}
These terms are used in this lesson. You can find them all in the glossary at any time.

## At ShopEasy {#workplace-example}
ShopEasy is changing how delivery charges are worked out. Here's the testing at each level:

- **Component:** a developer writes automated tests for the delivery function: £49.99 → £3.95, £50.00 → free.
- **Integration:** the team checks the basket page gets the right charge from the delivery function, and that the order saved in the database includes it.
- **System:** Asha, the tester, places full orders on the test site with different baskets and checks the confirmation email.
- **Acceptance:** two people from customer support try it with the kinds of order customers usually place, and confirm it matches the published delivery policy.

After a defect is fixed, Asha **retests** the exact case that failed, then runs a **regression** check of the checkout to make sure nothing else broke.

## Worked example {#worked-example}
Asha has one day to test a release with four changes. She rates each for likelihood and impact (low, medium or high).

| Change | Likelihood | Impact | Test order |
|---|---|---|---|
| New payment provider | High – brand new | High – customers can't pay | **1st** |
| Discount rule change | Medium – changed often before | High – wrong prices | **2nd** |
| New footer links | Low – simple | Low – minor annoyance | 4th |
| Faster product images | Medium – new technique | Medium – slow pages lose sales | 3rd |

She spends most of the morning on payments (functional *and* non-functional – is it secure? does it cope with many orders?), then discounts, then images. Footer links get a quick check at the end. In her summary, she lists what got less testing, so the team can decide whether that's an acceptable risk.

## Guided practice {#guided-practice}
Which test level is each of these?

- two people from finance check the new refund screen matches how they actually process refunds
- a developer checks the function that rounds prices to two decimal places

:::hint
One is about real users confirming it meets their needs; the other is about a single small part.
:::

:::hint
The finance check is acceptance testing. The rounding function check is component (unit) testing.
:::

A defect in the postcode box has been fixed. What two kinds of testing should follow?

:::hint
One checks the fix itself; the other checks nothing else broke.
:::

## Your turn {#challenge}
Imagine ShopEasy is about to add "Pay later in 3 instalments".

In your notes, list three things you'd want to test. For each, write whether it's functional or non-functional, and rate its likelihood and impact (low, medium or high). Which would you test first, and why?

## Check your understanding {#knowledge-check}
Answer these questions to check your understanding. They don't count towards your progress, and you'll see an explanation for every option.

## Feedback and next step {#next-step}
Well done – you've finished the lessons in Testing foundations. You can describe the test levels and types, and use risk to decide where testing matters most.

**Next:** take the **Testing foundations module assessment**. Once you pass, the practical assignment unlocks: you'll design test cases for the ShopEasy checkout and write defect reports.
