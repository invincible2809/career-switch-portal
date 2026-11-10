// pnpm content:check – validates everything under content/ without touching the database.
import { loadContent } from "../src/lib/content/load";

try {
  const c = loadContent();
  const questions = c.banks.reduce((n, b) => n + b.questions.length, 0);
  console.log(
    `Content OK: ${c.pathways.pathways.length} pathways, ${c.lessons.length} lessons, ${c.banks.length} question banks (${questions} questions), ${c.glossary.terms.length} shared glossary terms.`,
  );
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
