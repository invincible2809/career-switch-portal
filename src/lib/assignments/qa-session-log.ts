// The written ShopEasy checkout specification and test session log used by the QA Module 1
// assignment (PLAN §8 option 1). Learners see all of this; which entries are defects is
// kept on the server (src/server/assignments/qa-known-defects.ts) until they submit.
export const CHECKOUT_SPEC = [
  "Item quantity: whole numbers from 1 to 10. Anything else is rejected with a clear message.",
  "Discount code SAVE10: 10% off orders of £20.00 or more. Only one discount code can be used per order, and it can be applied only once.",
  "Delivery: free on orders of £50.00 or more; otherwise £3.95.",
  "Postcode: any valid UK postcode is accepted, in capital or small letters, with or without the space.",
  "Every form field has a visible label that screen readers announce.",
];

export interface LogEntry {
  n: number;
  action: string;
  observed: string;
}

export const SESSION_LOG: LogEntry[] = [
  { n: 1, action: "Set the quantity of a mug (£8.00) to 0 and pressed Update.", observed: "The basket showed 0 × mug, line total £0.00. No message was shown." },
  { n: 2, action: "Changed the quantity of a mug from 10 to 11 and pressed Update.", observed: 'The message "You can buy up to 10 of this item" appeared and the quantity stayed at 10.' },
  { n: 3, action: "With a £30.00 basket, entered SAVE10 and pressed Apply, then pressed Apply again.", observed: "The total went to £27.00, then to £24.00. Two discounts were listed." },
  { n: 4, action: "Checked out with a basket total of £49.99.", observed: "Delivery of £3.95 was added. Order total £53.94." },
  { n: 5, action: "Checked out with a basket total of exactly £50.00.", observed: "Delivery of £3.95 was added. Order total £53.95." },
  { n: 6, action: "Entered SAVE10 with a basket total of £19.99.", observed: 'The message "SAVE10 needs a minimum spend of £20" appeared. The total stayed £19.99.' },
  { n: 7, action: 'Entered the postcode "sw1a 1aa" in small letters.', observed: 'The message "Enter a valid postcode" appeared and the order could not continue.' },
  { n: 8, action: 'Entered the postcode "SW1A1AA" without a space.', observed: "The postcode was accepted and shown as SW1A 1AA." },
  { n: 9, action: "Used a screen reader on the delivery address form.", observed: 'The postcode box was announced only as "edit text", with no name.' },
];
