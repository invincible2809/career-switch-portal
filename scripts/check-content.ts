// pnpm content:check – validates everything under content/ without touching the database.
import fs from "node:fs";
import YAML from "yaml";
import { loadContent } from "../src/lib/content/load";
import { interviewFileSchema, roleplayFileSchema } from "../src/lib/coach/schemas";

try {
  const c = loadContent();
  interviewFileSchema.parse(YAML.parse(fs.readFileSync("content/coach/interview.yaml", "utf8")));
  roleplayFileSchema.parse(YAML.parse(fs.readFileSync("content/coach/roleplays.yaml", "utf8")));
  const questions = c.banks.reduce((n, b) => n + b.questions.length, 0);
  console.log(
    `Content OK: ${c.pathways.pathways.length} pathways, ${c.lessons.length} lessons, ${c.banks.length} question banks (${questions} questions), ${c.glossary.terms.length} shared glossary terms.`,
  );
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
