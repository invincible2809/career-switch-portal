---
slug: web-apps-databases-apis
module: foundations
order: 4
title: Web apps, databases and APIs explained simply
estimatedMinutes: 17
objectives:
  - Explain the difference between the front end, the back end and the database
  - Describe what happens in a request and a response
  - Explain what an API is and read a simple status code
knowledgeCheck: foundations-l4-check
glossary:
  - term: Front end
    definition: The part of a website or app that people see and use in their browser or on their phone.
  - term: Back end
    definition: The part of a system that runs on a server, applies the rules and talks to the database. Users don't see it directly.
  - term: Server
    definition: A computer that runs software for other computers to use, such as the computer that runs the ShopEasy website.
  - term: Database
    definition: An organised store of information that software can search and update, such as customers and orders.
  - term: Request
    definition: A message sent from one piece of software to another asking for something, such as a web page or a list of products.
  - term: Response
    definition: The reply to a request, which includes a status code and usually some data.
  - term: API
    definition: Short for Application Programming Interface. An agreed way for one piece of software to ask another for data or actions.
  - term: Status code
    definition: A three-digit number in a response that says how the request went, such as 200 (OK) or 404 (not found).
---

## Learning objective {#objective}
By the end of this lesson you will be able to:

- explain the difference between the front end, the back end and the database
- describe what happens in a request and a response
- explain what an API is and read a simple status code

This lesson takes about 17 minutes. No coding is needed.

## Explanation {#explanation}
A website like ShopEasy has three main layers. A restaurant is a useful comparison.

- **[[Front end]]** – what you see and use: pages, buttons, forms. It's the dining room and the menu.
- **[[Back end]]** – the software running on a **[[server]]** that applies the rules: checking stock, working out prices, taking payment. It's the kitchen.
- **[[Database]]** – where information is stored: customers, products, orders. It's the store cupboard and the order book.

### Requests and responses
The layers talk to each other with **[[request|requests]]** and **[[response|responses]]**.

When you click "Show my orders", your browser (the front end) sends a request to the back end: *please send the orders for this customer*. The back end checks you're logged in, asks the database for your orders, and sends back a response with the list. The front end then shows it on screen.

A request usually has:

- a **method** – what you want to do, for example **GET** (fetch something) or **POST** (send something new, like an order)
- an **address** – which thing you mean, for example `/orders`
- sometimes **data** – for example the items in a new order

### APIs
An **[[API]]** is an agreed way for one piece of software to ask another for data or actions. It's like the restaurant's order slip: the waiter doesn't need to know how the kitchen cooks, only how to write the order in a way the kitchen understands.

ShopEasy's own front end uses ShopEasy's API. ShopEasy also uses other companies' APIs – for example a payment company's API to take card payments, and a courier's API to book deliveries.

### Status codes
Every response comes with a **[[status code]]** saying how it went. You'll often see these:

| Code | Meaning in plain words |
|---|---|
| 200 | OK – it worked |
| 201 | Created – something new was saved, such as an order |
| 400 | Bad request – something in the request was wrong or missing |
| 401 | Not logged in – the request didn't include a valid login |
| 404 | Not found – that thing doesn't exist |
| 500 | Server error – something went wrong on the back end |

Codes starting with 2 mean it worked. Codes starting with 4 usually mean a problem with the request. Codes starting with 5 mean a problem on the server.

## New terms {#glossary}
These terms are used in this lesson. You can find them all in the glossary at any time.

## At ShopEasy {#workplace-example}
Here's what happens when a customer clicks **Pay now**:

1. The **front end** sends a POST request to ShopEasy's back end with the basket and delivery details.
2. The **back end** checks the items are still in stock in the **database**, and works out the total.
3. The back end sends a request to the payment company's **API** to take the payment. The payment API replies: approved.
4. The back end saves the new order in the database and replies to the front end with status **201 Created** and the order number.
5. The front end shows "Thank you – your order number is 40871".

If the payment had been declined, the back end would send a different response, and the front end should show a clear message instead.

## Worked example {#worked-example}
A tester notices that searching for "kettle" on ShopEasy shows "Sorry, something went wrong".

Here's how thinking in layers helps them describe the problem clearly:

1. **What does the front end show?** An error message instead of results.
2. **What request was sent?** Using the browser's built-in developer tools (a hidden panel most browsers open with F12), the tester sees a GET request to `/products?search=kettle`.
3. **What came back?** Status **500** – a server error.
4. **What does that tell us?** The request reached the back end, and something went wrong there. It isn't the tester's typing or their internet connection.
5. **Is it all searches?** Searching for "mug" returns **200** and shows results. So it's something about "kettle".

The tester's bug report now says exactly where to look: *search for "kettle" returns 500; other searches work*. That saves the developer a lot of time.

## Guided practice {#guided-practice}
Which layer is each of these in: front end, back end or database?

- the "Add to basket" button
- the list of every customer's past orders
- the rule that free delivery starts at £50

:::hint
Ask: can I see it on screen? Is it stored information? Or is it a rule being applied behind the scenes?
:::

:::hint
The button is front end. The list of past orders is stored in the database. The free-delivery rule is applied by the back end.
:::

A customer goes to a product page that has been deleted. Which status code would you expect?

:::hint
The thing they asked for doesn't exist any more. It's 404 – not found.
:::

## Your turn {#challenge}
Think of an app you use – banking, food delivery, a train ticket app.

In your notes, describe one thing you do in it (for example "check my balance") as:

1. what you see on the front end
2. the request you think the app sends
3. what the back end probably asks the database for
4. what comes back

You don't need to be right about the details. The aim is to start seeing software in layers.

## Check your understanding {#knowledge-check}
Answer these questions to check your understanding. They don't count towards your progress, and you'll see an explanation for every option.

## Feedback and next step {#next-step}
Well done. You can now picture what happens behind a button click, and read the most common status codes. Testers use this every day, and Scrum Masters use it to follow technical conversations.

**Next:** Lesson 5 covers the tools teams use to track work, and how to keep yourself and your customers safe online.
