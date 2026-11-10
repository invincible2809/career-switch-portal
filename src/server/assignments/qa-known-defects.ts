import "server-only";
import type { KnownDefect } from "@/lib/assignments/checks";

// The answer key for the QA checkout assignment. Server-only: never sent to the browser
// before the learner submits (SPEC §5).
export const QA_KNOWN_DEFECTS: KnownDefect[] = [
  { key: "qty-zero", logEntry: 1, summary: "Quantity 0 is accepted (lower boundary not enforced).", keyTerms: [["quantity 0", "quantity of 0", "zero", "0 items", "to 0"], ["reject", "message", "error", "not be accepted", "shouldn't", "should not", "at least 1", "minimum"]] },
  { key: "discount-twice", logEntry: 3, summary: "SAVE10 can be applied twice, giving 20% off.", keyTerms: [["twice", "two discounts", "again", "more than once", "double"], ["10%", "£27", "one code", "once", "only one"]] },
  { key: "delivery-boundary", logEntry: 5, summary: "Delivery is charged on an order of exactly £50.00.", keyTerms: [["£50", "50.00"], ["free", "no delivery", "3.95", "charged"]] },
  { key: "postcode-case", logEntry: 7, summary: "A valid postcode in small letters is rejected.", keyTerms: [["small", "lower", "lowercase", "lower case", "sw1a 1aa"], ["accept", "valid", "reject", "error"]] },
  { key: "postcode-label", logEntry: 9, summary: "The postcode box has no accessible name for screen readers.", keyTerms: [["screen reader", "label", "name", "announce"], ["postcode"]] },
];
