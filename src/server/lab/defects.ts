import "server-only";
import type { LabArea } from "@/lib/lab/spec";

// The answer key for the ShopEasy Test Lab (SPEC §5). Server-only: it is never sent to the
// browser, and the full list is shown only after the learner submits the QA assignment.
export interface LabDefect {
  key: string;
  area: LabArea;
  title: string;
  /** Each group must have at least one match in the report's title, expected and actual results. */
  keyTerms: string[][];
}

export const LAB_DEFECTS: LabDefect[] = [
  { key: "login-password-case", area: "login", title: "The password is accepted in the wrong letter case (e.g. BASKET123).", keyTerms: [["case", "capital", "upper", "lower", "basket123"], ["password"]] },
  { key: "login-unhelpful-error", area: "login", title: 'A failed login shows "Error 0x1F" instead of a helpful message.', keyTerms: [["0x1f", "error code", "unhelpful", "unclear"], ["message", "incorrect", "error"]] },
  { key: "login-no-lockout", area: "login", title: "The account never locks after 3 failed attempts.", keyTerms: [["lock", "locked", "lockout"], ["3", "three", "attempts", "tries"]] },
  { key: "basket-qty-zero", area: "basket", title: "A quantity of 0 is accepted.", keyTerms: [["quantity 0", "quantity of 0", "zero", "to 0", " 0 "], ["accept", "allowed", "reject", "should not", "shouldn't", "minimum", "at least 1"]] },
  { key: "basket-qty-negative", area: "basket", title: "A negative quantity is accepted, giving a negative total.", keyTerms: [["negative", "minus", "-1", "-2", "-5", "below zero"], ["accept", "allowed", "reject", "total", "should not", "shouldn't"]] },
  { key: "basket-rounding", area: "basket", title: "3 tea towels cost £5.01 instead of £5.00 (each unit is rounded up).", keyTerms: [["5.01", "1p", "rounding", "rounded", "penny"], ["5.00", "£5", "tea towel", "3 for"]] },
  { key: "checkout-discount-twice", area: "checkout", title: "SAVE10 can be applied more than once.", keyTerms: [["twice", "two discounts", "again", "more than once", "double", "multiple"], ["save10", "discount", "code"]] },
  { key: "checkout-delivery-boundary", area: "checkout", title: "Delivery is charged on an order of exactly £50.00.", keyTerms: [["£50", "50.00"], ["free", "no delivery", "3.95", "charged"]] },
  { key: "checkout-postcode-case", area: "checkout", title: "A valid postcode in small letters is rejected.", keyTerms: [["small", "lower", "lowercase", "lower case"], ["postcode"]] },
  { key: "a11y-postcode-label", area: "accessibility", title: "The postcode box has no visible label – only placeholder text, which disappears when you start typing.", keyTerms: [["label", "placeholder", "visible", "screen reader", "announce", "name"], ["postcode"]] },
];
