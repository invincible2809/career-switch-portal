// Transferable skills mapping (SPEC §2). Plain, honest examples tied to the learner's background.
export const INDUSTRIES = [
  { id: "customer-service", label: "Customer service or call centre" },
  { id: "retail", label: "Retail" },
  { id: "hospitality", label: "Hospitality" },
  { id: "healthcare", label: "Healthcare or care work" },
  { id: "logistics", label: "Logistics, warehouse or transport" },
  { id: "operations", label: "Operations or facilities" },
  { id: "finance-admin", label: "Finance or administration" },
  { id: "teaching", label: "Teaching or training" },
  { id: "other", label: "Something else" },
] as const;

export type IndustryId = (typeof INDUSTRIES)[number]["id"];

export interface TransferableSkill {
  skill: string;
  example: string;
  helpsWith: ("SCRUM_MASTER" | "QA_TESTER")[];
}

export const SKILLS_BY_INDUSTRY: Record<IndustryId, TransferableSkill[]> = {
  "customer-service": [
    { skill: "Communication", example: "You explain things clearly to people who are frustrated or confused.", helpsWith: ["SCRUM_MASTER", "QA_TESTER"] },
    { skill: "Stakeholder management", example: "You balance what a customer wants with what the company can offer.", helpsWith: ["SCRUM_MASTER"] },
    { skill: "Spotting user problems", example: "You hear the same complaints again and again and know where the product lets people down.", helpsWith: ["QA_TESTER"] },
  ],
  retail: [
    { skill: "Spotting user problems", example: "You see where customers get stuck at the till or on the shop floor.", helpsWith: ["QA_TESTER"] },
    { skill: "Working under pressure", example: "You keep things running calmly on the busiest days.", helpsWith: ["SCRUM_MASTER"] },
    { skill: "Attention to detail", example: "You check stock counts, prices and refunds carefully.", helpsWith: ["QA_TESTER"] },
  ],
  hospitality: [
    { skill: "Coordination", example: "You keep the kitchen, front of house and bookings working together.", helpsWith: ["SCRUM_MASTER"] },
    { skill: "Calm problem-solving", example: "You sort out problems on the spot without blaming anyone.", helpsWith: ["SCRUM_MASTER", "QA_TESTER"] },
    { skill: "Following standards", example: "You follow food safety and service checklists every shift.", helpsWith: ["QA_TESTER"] },
  ],
  healthcare: [
    { skill: "Careful record-keeping", example: "You write accurate notes that other people rely on.", helpsWith: ["QA_TESTER"] },
    { skill: "Following and improving procedures", example: "You follow safety procedures and notice when one doesn't work.", helpsWith: ["QA_TESTER", "SCRUM_MASTER"] },
    { skill: "Teamwork across roles", example: "You hand over clearly between shifts and professions.", helpsWith: ["SCRUM_MASTER"] },
  ],
  logistics: [
    { skill: "Process improvement", example: "You notice where a delivery route or picking process wastes time.", helpsWith: ["SCRUM_MASTER"] },
    { skill: "Prioritisation", example: "You decide which orders go first when everything is urgent.", helpsWith: ["SCRUM_MASTER"] },
    { skill: "Checking accuracy", example: "You match what's on the system with what's actually on the shelf.", helpsWith: ["QA_TESTER"] },
  ],
  operations: [
    { skill: "Process improvement", example: "You change how work flows so it's faster and safer.", helpsWith: ["SCRUM_MASTER"] },
    { skill: "Prioritisation", example: "You decide what matters most when resources are short.", helpsWith: ["SCRUM_MASTER"] },
    { skill: "Coordination", example: "You get different teams to work towards the same goal.", helpsWith: ["SCRUM_MASTER"] },
  ],
  "finance-admin": [
    { skill: "Attention to detail", example: "You catch small mistakes in figures and forms before they cause problems.", helpsWith: ["QA_TESTER"] },
    { skill: "Documentation", example: "You keep clear records that other people can follow.", helpsWith: ["QA_TESTER", "SCRUM_MASTER"] },
    { skill: "Analytical thinking", example: "You look for the reason behind a number that doesn't add up.", helpsWith: ["QA_TESTER"] },
  ],
  teaching: [
    { skill: "Facilitation", example: "You run sessions where everyone gets a chance to take part.", helpsWith: ["SCRUM_MASTER"] },
    { skill: "Coaching", example: "You help people work things out for themselves rather than giving answers.", helpsWith: ["SCRUM_MASTER"] },
    { skill: "Explaining complex ideas", example: "You break hard topics into simple steps.", helpsWith: ["SCRUM_MASTER", "QA_TESTER"] },
  ],
  other: [
    { skill: "Learning new systems", example: "You've picked up new tools and ways of working before.", helpsWith: ["SCRUM_MASTER", "QA_TESTER"] },
    { skill: "Communication", example: "You share information clearly with colleagues.", helpsWith: ["SCRUM_MASTER", "QA_TESTER"] },
  ],
};
