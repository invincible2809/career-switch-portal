---
slug: checkout-testing
module: testing-foundations
title: Test the ShopEasy checkout
form: QA_CHECKOUT_TESTING
rubric: checkout-testing
---
ShopEasy is about to release changes to its checkout. You've been given the **checkout specification** and a **test session log** from a colleague (both below). Your job is to design test cases and report the defects in the log.

## Two techniques you'll need
You'll learn these in depth in QA Module 4. Here's enough to get started.

- **Equivalence partitioning (EP):** split the possible inputs into groups the software should treat the same way, and test one value from each group. For the quantity (1 to 10), the groups are *too low* (0 or less), *valid* (1 to 10), *too high* (11 or more) and *not a whole number* (such as 2.5) – so you might test 5, -2, 15 and 2.5.
- **Boundary value analysis (BVA):** mistakes often happen at the edges of a range, such as writing "more than" instead of "or more". Two-value BVA tests each boundary and its closest neighbour on the other side. For the quantity (1 to 10), that's **0, 1, 10 and 11**.

## What to produce

**Part A – Test cases.** Write at least **six** test cases for the checkout specification. Use boundary value analysis for the three numeric rules – item quantity, the £20.00 SAVE10 minimum and the £50.00 free delivery threshold – and equivalence partitioning or other ideas for the rest. For each test case, give a title, what it tests, the technique, the test data, the steps and the expected result (taken from the specification).

**Part B – Defect reports.** Read the test session log. Some entries show the checkout working as specified; some show defects. Write at least **three** defect reports. For each, say which log entry shows it, and give a clear title, the environment, steps to reproduce, the expected result (from the specification), the actual result (from the log), a severity and a priority.

You won't see which log entries are defects until you've submitted.

## Tips
- *Severity* is how bad the impact is; *priority* is how soon it should be fixed. They often match, but not always.
- Expected results come from the specification, not from what you'd personally like.
- A defect report should let a developer reproduce the problem without asking you anything.

*When the ShopEasy Test Lab opens, you'll also be able to run your test cases there.*
