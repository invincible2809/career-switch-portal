// Builds a first draft of a transferable-skills statement from onboarding answers.
// The learner edits it; it never invents experience.
import { SKILLS_BY_INDUSTRY, INDUSTRIES, type IndustryId } from "../onboarding/skills-map";

export function draftStatement(opts: { pathway: "SCRUM_MASTER" | "QA_TESTER"; industry: IndustryId | null; previousRoles: string[] }): string {
  const role = opts.pathway === "SCRUM_MASTER" ? "a Scrum Master" : "a QA Tester";
  const industryLabel = opts.industry ? INDUSTRIES.find((i) => i.id === opts.industry)?.label.toLowerCase() : null;
  const skills = (opts.industry ? SKILLS_BY_INDUSTRY[opts.industry] : SKILLS_BY_INDUSTRY.other)
    .filter((s) => s.helpsWith.includes(opts.pathway))
    .slice(0, 3);
  const from = opts.previousRoles.length ? `my work in roles such as ${opts.previousRoles.slice(0, 2).join(" and ")}` : industryLabel ? `my work in ${industryLabel}` : "my previous work";
  const lines = [
    `I'm working towards a role as ${role}. From ${from}, I bring:`,
    ...skills.map((s) => `- ${s.skill}: [add a real example – for instance, ${s.example.charAt(0).toLowerCase()}${s.example.slice(1)}]`),
    "",
    "I've been building on this through self-directed study, including simulated practice projects with a fictional online shop. [Say what you practised and what you learned.]",
  ];
  return lines.join("\n");
}
