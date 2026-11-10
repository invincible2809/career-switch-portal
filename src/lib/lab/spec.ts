// The ShopEasy Test Lab specification shown to learners. Expected results come from here.
export const LAB_SPEC: { area: string; rules: string[] }[] = [
  {
    area: "Login",
    rules: [
      "The demo account is shopper@shopeasy.example with the password Basket123. Passwords are case-sensitive.",
      'Wrong details show the message "The email or password is incorrect."',
      "After 3 failed attempts in a row, the account is locked for 15 minutes and a message says so.",
    ],
  },
  {
    area: "Basket",
    rules: [
      "Item quantity: whole numbers from 1 to 10. Anything else is rejected with a clear message.",
      "Line totals and the basket total are correct to the penny. Multi-buy offers cost exactly the stated price: 3 tea towels cost £5.00. A single tea towel costs £1.67, so 4 cost £6.67 (£5.00 + £1.67).",
      "You can't add more of an item than is in stock. In the demo shop, stock levels go back to normal after each order.",
    ],
  },
  {
    area: "Checkout",
    rules: [
      "Discount code SAVE10: 10% off when the items in the basket add up to £20.00 or more (before delivery). If the basket later drops below £20.00, the discount is removed. Only one discount code can be used per order, and it can be applied only once.",
      "Delivery: free when the items add up to £50.00 or more after any discount; otherwise £3.95.",
      "Postcode: any valid UK postcode is accepted, in capital or small letters, with or without the space.",
    ],
  },
  {
    area: "Accessibility",
    rules: ["Every form field has a visible label that screen readers announce.", "Everything can be done with a keyboard."],
  },
];

export const LAB_AREAS = ["login", "basket", "checkout", "accessibility", "other"] as const;
export type LabArea = (typeof LAB_AREAS)[number];
