// Rule-based guidance on the judgement criteria (PLAN §8.2). It is shown as "automated
// guidance" next to the rubric and NEVER counts towards competency – an assessor scores these.
import type { QaCheckout, QaTestLab, ScrumRetroPlan } from "./forms";

/** Whole-word (or whole-phrase) matches, so "dot" doesn't match "anecdote". `transparen*` style prefixes end in "*". */
const mentions = (text: string, words: string[]) =>
  words.filter((w) => new RegExp(`\\b${w.replace("*", "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${w.endsWith("*") ? "" : "\\b"}`).test(text));

const IDEA_LABELS: Record<string, string> = {
  "product owner": "the Product Owner's accountability",
  "sprint goal": "the Sprint Goal",
  "definition of done": "the Definition of Done",
  "too big": "item size",
  "too large": "item size",
  split: "splitting work",
  testing: "testing late",
  stakeholder: "stakeholders",
  "transparen*": "transparency",
  "daily scrum": "the Daily Scrum",
};

export function guidanceFor(criterionKey: string, formKind: string, payload: unknown): string[] | null {
  if (formKind === "SCRUM_RETRO_PLAN") {
    const p = payload as ScrumRetroPlan;
    const all = `${p.diagnosis} ${p.impediments.map((i) => `${i.impediment} ${i.nextStep} ${i.owner}`).join(" ")}`.toLowerCase();
    if (criterionKey === "diagnosis") {
      const d = p.diagnosis.toLowerCase();
      const ideas = [...new Set(mentions(d, Object.keys(IDEA_LABELS)).map((k) => IDEA_LABELS[k]))];
      const blame = mentions(d, ["lazy", "fault", "useless", "incompetent", "blame"]);
      return [
        ideas.length >= 3 ? `You link the problems to several ideas from the course (${ideas.join(", ")}).` : "Try linking each problem to a likely cause and to a Scrum idea, such as the Sprint Goal, the Definition of Done or the Product Owner's accountability.",
        p.diagnosis.split(/\s+/).length < 80 ? "Your diagnosis is short – explain how the causes affect each other and the Sprint Goal." : "Good length – check you've explained how the causes connect.",
        ...(blame.length ? ["Avoid language that blames individuals; focus on the system and ways of working."] : []),
      ];
    }
    if (criterionKey === "scrum-stance") {
      const risky = mentions(all, ["assign", "assigns", "tell the developers to", "tell them to", "i will decide", "instruct them", "make them work"]);
      const po = mentions(all, ["product owner", "lena"]).length > 0;
      const goal = mentions(all, ["sprint goal"]).length > 0;
      return [
        risky.length ? `Check the wording "${risky[0]}…" – a Scrum Master doesn't assign work or make product decisions.` : "No signs of the Scrum Master assigning work – good.",
        po && goal
          ? "You route decisions to the Product Owner and keep the Sprint Goal in view."
          : "Show who decides what: requests go to the Product Owner, the Sprint Goal guides the Sprint, and the Developers decide how to do the work.",
      ];
    }
    if (criterionKey === "facilitation") {
      const acts = p.retroRows.map((r) => `${r.activity} ${r.purpose}`.toLowerCase()).join(" ");
      const inclusive = mentions(acts, ["vote", "dot vote", "dot-vote", "silent", "each person", "everyone", "round robin", "in pairs", "sticky notes", "anonymous", "check-in", "check in"]);
      const owned = mentions(acts, ["owner", "owners", "actions", "action", "follow up", "follow-up", "commit"]);
      return [
        inclusive.length ? "Your activities give everyone a way to contribute." : "Add an activity that gives quieter people a voice, such as silent writing or a round where everyone speaks.",
        owned.length ? "The plan includes actions – make sure each has an owner and a follow-up." : "End with specific actions the team chooses, each with an owner, and say how you'll follow them up.",
      ];
    }
    return null;
  }
  if (formKind === "QA_TEST_LAB" || formKind === "QA_CHECKOUT_TESTING") {
    const defects = (payload as QaTestLab | QaCheckout).defects as { title: string; steps: string; expected: string; actual: string; severity: string; priority: string }[];
    if (defects.length === 0 && (criterionKey === "report-quality" || criterionKey === "severity-priority")) return ["Add at least one defect report to get guidance."];
    if (criterionKey === "report-quality") {
      const vagueTitles = defects.filter((d) => d.title.trim().split(/\s+/).length < 4).length;
      const shortSteps = defects.filter((d) => d.steps.trim().length < 30).length;
      const same = defects.filter((d) => d.expected.trim().toLowerCase() === d.actual.trim().toLowerCase()).length;
      return [
        vagueTitles ? `${vagueTitles} title${vagueTitles === 1 ? " is" : "s are"} very short – say what goes wrong and where.` : "Titles are specific enough to scan.",
        shortSteps ? `${shortSteps} report${shortSteps === 1 ? " has" : "s have"} very short steps – could a developer reproduce it without asking you?` : "Steps look detailed enough to reproduce.",
        ...(same ? ["Some expected and actual results are the same – the difference is what makes it a defect."] : []),
      ];
    }
    if (criterionKey === "severity-priority") {
      const all = new Set(defects.map((d) => `${d.severity}/${d.priority}`));
      return [
        defects.some((d) => !d.severity || !d.priority) ? "Give every report a severity and a priority." : "Every report has a severity and a priority.",
        all.size === 1 && defects.length > 2
          ? "All your reports have the same ratings – are they really equally serious and urgent? Think about impact on customers and money."
          : all.size > 1
            ? "Your ratings vary – check each reflects the impact on customers and the business."
            : "Check each rating reflects the impact on customers and the business.",
      ];
    }
  }
  return null;
}
