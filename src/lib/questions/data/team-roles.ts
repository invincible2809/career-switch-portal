// Authored content for the "who-does-what" generator (Foundations lesson 1).
// Original wording for this course. Role names in a general tech team, not Scrum accountabilities.
export interface TeamRole {
  role: string;
  summary: string; // used in "why this is wrong" text
  duties: string[];
}

export const TEAM_ROLES: TeamRole[] = [
  {
    role: "Product manager",
    summary: "decides what the product should do next and why, based on customer and business needs",
    duties: [
      "decides which new feature would help ShopEasy customers most this quarter",
      "talks to customers and the business to understand what they need from the shop",
      "explains why a new 'save for later' button is worth building",
    ],
  },
  {
    role: "Designer",
    summary: "plans how screens look and how people move through them",
    duties: [
      "sketches how the new checkout screen should look on a phone",
      "watches customers try the basket page to see where they get confused",
      "chooses where the 'Pay now' button should sit so people can find it",
    ],
  },
  {
    role: "Developer",
    summary: "writes and changes the code that makes the product work",
    duties: [
      "writes the code that adds a discount code box to the checkout",
      "fixes the code that rounds basket totals incorrectly",
      "changes how the website saves a customer's address",
    ],
  },
  {
    role: "Tester",
    summary: "checks that the product works as expected and reports problems clearly",
    duties: [
      "tries entering a postcode with a space and without one to see if both are accepted",
      "writes a clear report explaining that the basket total is 1p wrong",
      "checks that a fixed bug really is fixed and nothing else broke",
    ],
  },
  {
    role: "Business analyst",
    summary: "turns needs into clear, written requirements the team can build and test",
    duties: [
      "writes down exactly what should happen when a discount code has expired",
      "turns a manager's request into clear acceptance criteria",
      "maps the current returns process to find steps that could be simpler",
    ],
  },
  {
    role: "Operations engineer",
    summary: "keeps the live system running, secure and backed up",
    duties: [
      "makes sure the shop's servers stay running during a big sale",
      "sets up alerts so the team knows quickly when the website is down",
      "checks that customer data is backed up every night",
    ],
  },
];
