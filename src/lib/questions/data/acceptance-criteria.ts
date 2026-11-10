// Authored ShopEasy acceptance criteria for the "given-when-then" generator (Foundations lesson 3).
export interface Criterion {
  given: string;
  when: string;
  then: string;
}

export const CRITERIA: Criterion[] = [
  { given: "my basket total is £40 and I have the code SAVE10", when: "I apply the code at checkout", then: "the total shows £36.00" },
  { given: "the code SPRING has expired", when: "I apply it at checkout", then: "I see 'This code has expired' and the total doesn't change" },
  { given: "I am logged in and have a saved address", when: "I go to the checkout", then: "my saved address is already filled in" },
  { given: "a kettle has 1 left in stock", when: "I add 2 kettles to my basket", then: "I see 'Only 1 left' and the quantity is set to 1" },
  { given: "my basket is empty", when: "I open the basket page", then: "I see 'Your basket is empty' and a link to keep shopping" },
  { given: "I received my order 40 days ago", when: "I choose 'Return an item'", then: "I see 'Returns are only possible within 30 days'" },
  { given: "my basket total is £49.99", when: "I go to the checkout", then: "a £3.95 delivery charge is added" },
  { given: "I have saved a mug for later", when: "I log out and log back in", then: "the mug is still in my saved items" },
];

export type Part = "GIVEN" | "WHEN" | "THEN";

export const PART_INFO: Record<Part, { word: string; role: string }> = {
  GIVEN: { word: "Given", role: "the starting situation, before the user does anything" },
  WHEN: { word: "When", role: "the action the user takes" },
  THEN: { word: "Then", role: "the result that should happen, which is what gets checked" },
};
