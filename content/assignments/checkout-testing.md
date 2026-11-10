---
slug: checkout-testing
module: testing-foundations
title: Test the ShopEasy checkout in the Test Lab
form: QA_TEST_LAB
rubric: checkout-testing
---
*This is a simulated learning project – ShopEasy and its Test Lab are made up.*

ShopEasy is about to release changes to its checkout. A test version is running in the **[ShopEasy Test Lab](/lab)**. Your job is to design test cases from the specification (below), run them in the Lab's demo shop, and report the defects you find.

## Two techniques you'll need
You'll learn these in depth in a later module (Test design techniques). Here's enough to get started.

- **[[Equivalence partitioning]] (EP):** split the possible inputs into groups the software should treat the same way, and test one value from each group. For the quantity (1 to 10), the groups are *too low* (0 or less), *valid* (1 to 10), *too high* (11 or more) and *not a whole number* (such as 2.5) – so you might test 5, -2, 15 and 2.5.
- **[[Boundary value analysis]] (BVA):** mistakes often happen at the edges of a range, such as writing "more than" instead of "or more". Two-value BVA tests each boundary and its closest neighbour on the other side. For the quantity (1 to 10), that's **0, 1, 10 and 11**.

## What to do

1. **Write at least six [[test case|test cases]]** in [Test cases](/lab/test-cases). Use boundary value analysis for the three numeric rules – item quantity, the £20.00 SAVE10 minimum and the £50.00 free delivery threshold – and equivalence partitioning or other ideas for the rest (for example login and postcodes). Take expected results from the specification.
2. **Run every test case in the [demo shop](/lab/shop)** and record the result – pass, fail or blocked (you couldn't run the test, for example because another defect got in the way) – with the [[actual result]] for anything that didn't pass.
3. **Write at least three [[defect report|defect reports]]** in [Defect reports](/lab/defects): a clear title, the area, the [[test environment|environment]], steps to reproduce, the [[expected result]] (from the specification), the actual result, a [[severity]] and a [[priority]].
4. **Come back here and submit.** Choose which test cases and reports to include, and say what each test case tests.

The demo shop has several deliberate defects. You'll see the full list only after you've submitted.

## Tips
- *Severity* is how bad the impact is; *priority* is how soon it should be fixed. They often match, but not always.
- A defect report should let a developer reproduce the problem without asking you anything.
- Use **Reset the demo shop** on the Test Lab home page if you want a clean start.
