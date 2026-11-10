import "server-only";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { interviewFileSchema, roleplayFileSchema, type InterviewQuestion, type RolePlay } from "@/lib/coach/schemas";

let cache: { interview: InterviewQuestion[]; roleplays: RolePlay[] } | null = null;

/** Coach scripts live in content/coach/*.yaml so they can be reviewed in git like lessons. */
export function coachContent() {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const dir = path.join(process.cwd(), "content", "coach");
  const interview = interviewFileSchema.parse(YAML.parse(fs.readFileSync(path.join(dir, "interview.yaml"), "utf8"))).questions;
  const roleplays = roleplayFileSchema.parse(YAML.parse(fs.readFileSync(path.join(dir, "roleplays.yaml"), "utf8"))).roleplays;
  cache = { interview, roleplays };
  return cache;
}
