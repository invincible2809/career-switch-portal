---
slug: why-testing-matters
module: testing-foundations
order: 1
title: Why testing matters
estimatedMinutes: 16
objectives:
  - Explain why software is tested and what testing can and can't do
  - Explain the difference between quality assurance and testing
  - Tell apart an error, a defect and a failure
knowledgeCheck: qa-l1-check
glossary:
  - term: Testing
    definition: Activities that check the quality of software and reduce the risk of problems in use - for example by finding defects.
  - term: Quality assurance
    definition: Making sure the way work is done leads to good quality. It focuses on the process and on preventing problems, and everyone is responsible for it.
  - term: Quality control
    definition: Checking the product itself to find problems. Testing is a major form of quality control.
  - term: Error
    definition: A human mistake, such as misunderstanding a requirement or typing the wrong value.
  - term: Defect
    definition: A flaw in the software or a document that can cause it to behave wrongly. Also called a bug or a fault.
  - term: Failure
    definition: When software does something different from what it should while it is being used.
  - term: Root cause
    definition: The underlying reason a defect was introduced, such as an unclear requirement.
  - term: Debugging
    definition: Finding and fixing the cause of a failure. Usually done by developers, after testing has shown the failure.
---

## Learning objective {#objective}
By the end of this lesson you will be able to:

- explain why software is tested and what testing can and can't do
- explain the difference between quality assurance and testing
- tell apart an error, a defect and a failure

Terms in this module are aligned with ISTQB Foundation Level. This course isn't an ISTQB qualification. This lesson takes about 16 minutes.

## Explanation {#explanation}
### Why test?
Software is built by people, and people make mistakes. **[[Testing]]** checks the quality of software and reduces the risk of problems reaching customers. Testing can:

- find defects before customers do
- check that the software does what was agreed – and what users actually need
- give the team and stakeholders information to make decisions, such as "is this ready to release?"
- help prevent defects – for example, a tester reviewing a requirement can spot gaps before anything is built

What testing can't do is prove the software has no defects. It reduces risk; it doesn't remove it.

### Quality assurance and testing
People often use "QA" and "testing" to mean the same thing, but they're different:

- **[[Quality assurance]]** is about the *process*: making sure the way work is done leads to good quality. It aims to prevent problems, and the whole team is responsible for it – for example by agreeing a Definition of Done or holding code reviews.
- **[[Quality control]]** is about the *product*: checking it to find problems. **Testing is a major form of quality control.**

Many job adverts say "QA Tester". In practice, a tester does mostly testing, and also helps the team improve its process.

### Error, defect, failure
These three words describe a chain:

1. a person makes an **[[error]]** (a mistake) – for example, a developer misreads "£50 or more" as "more than £50"
2. that error leaves a **[[defect]]** (also called a bug or fault) in the code: `if total > 50` instead of `if total >= 50`
3. when the software runs in a certain situation, the defect causes a **[[failure]]**: a customer with exactly £50.00 in their basket is charged for delivery

A defect only causes a failure in certain situations – this one only shows up when the basket is exactly £50.00. Some defects never cause a failure at all. Failures can also come from other things, such as a server running out of space.

Finding the **[[root cause]]** – here, perhaps a requirement that was easy to misread – helps prevent similar defects. **[[Debugging]]** (finding and fixing the defect) is usually done by developers after testing has shown the failure.

## New terms {#glossary}
These terms are used in this lesson. You can find them all in the glossary at any time.

## At ShopEasy {#workplace-example}
Last year, ShopEasy released a change to its discount codes without much testing. For two days, the code SAVE10 took 10% off *every item in the basket separately*, and rounding made some orders 1p cheaper than they should have been. Nobody noticed until the finance team found the numbers didn't add up.

The cost wasn't just the money. Support had to answer complaints, developers had to stop what they were doing, and the finance team spent days checking orders.

Afterwards, the team made two changes:

- **a quality assurance change:** the team changed its process, so every discount rule is now reviewed with the Product Owner before any code is written
- **a quality control change:** every change to prices or discounts is tested with a set of examples, including amounts like £19.99 and £20.00

## Worked example {#worked-example}
A customer reports: "I set the quantity of a mug to 0 and the basket let me check out with a £0.00 mug."

Let's separate the chain:

| Word | In this example |
|---|---|
| Error | The developer missed the lower limit – "between 1 and 10" was buried in a long paragraph, and only the upper limit was coded |
| Defect | The code only checks `quantity <= 10`, with no lower limit |
| Failure | A customer could set the quantity to 0 and check out with a £0.00 item |

The tester writes a clear report of the failure. The developer debugs it and fixes the defect. At the Retrospective, the team discusses the root cause: limits were easy to miss in the requirement, so they agree to write both ends of every range in acceptance criteria.

## Guided practice {#guided-practice}
Is each of these quality assurance or quality control?

- reviewing the team's Definition of Done to add accessibility checks
- testing the new checkout on three phone sizes

:::hint
Is it about improving the *process* or checking the *product*?
:::

:::hint
Reviewing the Definition of Done is quality assurance – it improves the process. Testing the checkout on phones is quality control – it checks the product.
:::

A developer types the wrong VAT rate into the code. A customer is then charged the wrong amount. Which part is the error, which the defect and which the failure?

:::hint
The error is the human mistake. The defect is what's left in the code. The failure is what the customer experiences.
:::

## Your turn {#challenge}
Think of a mistake you've seen in a form, a bill, a letter or an app.

In your notes, describe it as an error, a defect and a failure. Then write one thing that could have prevented it (quality assurance) and one check that could have caught it (quality control).

## Check your understanding {#knowledge-check}
Answer these questions to check your understanding. They don't count towards your progress, and you'll see an explanation for every option.

## Feedback and next step {#next-step}
Well done. You can now explain why testing matters, how it differs from quality assurance, and how a human error becomes a failure that customers see.

**Next:** Lesson 2 covers the seven testing principles – ideas that guide how testers think.
