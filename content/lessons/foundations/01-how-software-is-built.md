---
slug: how-software-is-built
module: foundations
order: 1
title: How software is built, and who does what
estimatedMinutes: 15
objectives:
  - Describe the main stages a software change goes through, from idea to release
  - Name the main roles in a software team and what each one does
  - Explain the key terms feature, bug, release and stakeholder
knowledgeCheck: foundations-l1-check
glossary:
  - term: Feature
    definition: Something a product lets people do, such as "save an item for later".
  - term: Release
    definition: Making a new version of the software available to real users.
  - term: Bug
    definition: A fault in software that makes it behave differently from what was expected. Testers often call it a defect.
  - term: Developer
    definition: Someone who writes and changes the code that makes software work.
  - term: Tester
    definition: Someone who checks that software works as expected and reports problems clearly.
  - term: Requirement
    definition: A clear, written statement of what the software must do.
  - term: Product manager
    definition: Someone who decides what a product should do next, and why, based on customer and business needs.
  - term: Designer
    definition: Someone who plans how screens look and how people move through them.
  - term: Business analyst
    definition: Someone who turns needs into clear, written requirements the team can build and test.
  - term: Operations engineer
    definition: Someone who keeps the live system running, secure and backed up.
  - term: Stakeholder
    definition: Anyone who cares about or is affected by the product, such as customers, managers or the support team.
---

## Learning objective {#objective}
By the end of this lesson you will be able to:

- describe the main stages a software change goes through, from idea to release
- name the main roles in a software team and say what each one does
- explain four key terms: feature, bug, release and stakeholder

This lesson takes about 15 minutes. You can stop at any point and pick up where you left off.

## Explanation {#explanation}
Software is rarely built by one person. A team works together to turn an idea into something people can use.

Most changes go through the same broad stages:

1. **Idea** – someone spots a problem or an opportunity. For example, customers keep asking for a way to save items.
2. **Understand the need** – the team finds out who has the problem and what would help. They write it down clearly.
3. **Design** – they plan how it will look and work.
4. **Build** – [[developer|developers]] write the code.
5. **Test** – [[tester|testers]] and the rest of the team check it works, and that nothing else broke.
6. **Release** – the new version goes live for real users. This is called a [[release]].
7. **Learn and look after it** – the team watches how people use it, fixes problems and decides what to do next.

In real teams these stages overlap. Testing often starts while things are still being built, and the team repeats the cycle many times in small steps rather than once in one big go. You'll learn why in Lesson 2.

The roles you'll meet most often are:

- **[[Product manager]]** – decides what the product should do next and why
- **[[Designer]]** – plans how screens look and how people move through them
- **[[Developer]]** – writes and changes the code
- **[[Tester]]** – checks the product works as expected and reports problems clearly
- **[[Business analyst]]** – turns needs into clear, written [[requirement|requirements]]
- **[[Operations engineer]]** – keeps the live system running, secure and backed up
- **Scrum Master or delivery lead** – helps the team improve how it works and deal with anything blocking progress. They don't assign tasks or manage the team. You'll meet this role in Lesson 2.

Job titles vary between companies. In small companies one person may do several of these jobs.

## New terms {#glossary}
These terms are used in this lesson. You can find them all in the glossary at any time.

## At ShopEasy {#workplace-example}
[[ShopEasy]] is a fictional online shop. We'll use it in every lesson.

ShopEasy's support team keeps hearing the same thing from customers: "I wanted to buy it later, but I couldn't find it again." The product manager decides a **"Save for later"** button is worth building.

- The **business analyst** writes down exactly what should happen when someone saves an item, and what should happen if it sells out.
- The **designer** sketches where the button goes on a phone screen.
- The **developers** build it.
- The **tester** checks it works – including awkward cases, like saving the same item twice.
- The **operations engineer** makes sure the release goes smoothly and the website stays up.

Customers, the support team and managers are all [[stakeholder|stakeholders]] – people who care about or are affected by the change.

Each person brings a different view. That's why the team talks to each other throughout, not only at hand-over points.

## Worked example {#worked-example}
Let's follow one small problem through the stages.

**The problem:** a customer reports that their basket total was 1p more than it should have been.

1. **Idea / problem spotted** – the support team passes the complaint on.
2. **Understand the need** – the tester tries to make it happen again. They find it happens with the "3 for £5" offer: each item works out at £1.6666…, the code rounds each one up to £1.67, and the basket shows £5.01 instead of £5.00. They write a clear [[bug]] report.
3. **Design** – no new screen is needed, so this stage is very short.
4. **Build** – a developer finds that the code rounds each price before adding them up, and fixes it.
5. **Test** – the tester checks the "3 for £5" basket again, and also checks other baskets to make sure the fix didn't break anything.
6. **Release** – the fix goes live.
7. **Learn and look after it** – the support team confirms the complaints have stopped.

Notice that even a tiny fix touches several roles.

## Guided practice {#guided-practice}
ShopEasy wants customers to be able to choose a delivery day.

Who would you expect to decide whether this [[feature]] is worth building before anyone starts work?

:::hint
Think about which role decides what the product should do next and why.
:::

:::hint
It's the product manager. They weigh up customer needs and business value before the team commits time to it.
:::

Now think: who would write down what should happen if a customer picks a day when the warehouse is closed?

:::hint
This is about turning a need into a clear, written requirement.
:::

:::hint
It's the business analyst. They write down rules like this so developers and testers know what should happen.
:::

## Your turn {#challenge}
Think about a job you have done, or an organisation you know well.

Write two or three sentences in your notes describing a change that was made there – a new process, form or system. For each stage (idea, understand the need, design, build, test, release, learn), jot down who did that work, even if their job title was different.

There's no single right answer. The aim is to notice that the same stages happen in many kinds of work.

## Check your understanding {#knowledge-check}
Answer these questions to check your understanding. They don't count towards your progress, and you'll see an explanation for every option.

## Feedback and next step {#next-step}
Well done for finishing this lesson. You've seen that software changes move through stages, and that several roles work together at each step.

If anything felt unclear, look again at the **Explanation** section or write a question in your notes so you can come back to it.

**Next:** Lesson 2 looks at how teams plan and test their work in small steps, and introduces Agile and Scrum.
