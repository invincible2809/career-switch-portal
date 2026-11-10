// Static safety net for CLAUDE.md rule 1: every admin page, admin API route and admin server
// action must check the role on the server itself (not only in the layout).
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function files(dir: string, match: RegExp): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p, match) : match.test(e.name) ? [p] : [];
  });
}

describe("server-side role checks", () => {
  it("every admin page calls requireAdmin", () => {
    const pages = files("src/app/admin", /^page\.tsx$/);
    expect(pages.length).toBeGreaterThan(5);
    for (const p of pages) expect(fs.readFileSync(p, "utf8"), p).toMatch(/await requireAdmin\(/);
  });

  it("every admin API route calls adminApiGuard in every handler", () => {
    const routes = files("src/app/api/admin", /^route\.ts$/);
    expect(routes.length).toBeGreaterThan(0);
    for (const r of routes) {
      const src = fs.readFileSync(r, "utf8");
      const handlers = src.match(/export async function (GET|POST|PUT|PATCH|DELETE)/g) ?? [];
      const guards = src.match(/await adminApiGuard\(/g) ?? [];
      expect(guards.length, r).toBe(handlers.length);
    }
  });

  it("every exported admin server action calls requireAdmin first", () => {
    const src = fs.readFileSync("src/app/admin/actions.ts", "utf8");
    const bodies = src.split(/\nexport async function /).slice(1);
    expect(bodies.length).toBeGreaterThan(5);
    for (const body of bodies) {
      const firstLines = body.split("\n").slice(0, 3).join("\n");
      expect(firstLines, body.split("(")[0]).toMatch(/await requireAdmin\(/);
    }
  });

  it("every learner server action checks who is signed in", () => {
    const actionFiles = files("src/app", /^actions\.ts$/).filter((f) => !f.includes(`${path.sep}admin${path.sep}`) && !f.includes("(auth)"));
    for (const f of actionFiles) {
      const bodies = fs.readFileSync(f, "utf8").split(/\nexport async function /).slice(1);
      for (const body of bodies) expect(body.split("\n").slice(0, 3).join("\n"), `${f}: ${body.split("(")[0]}`).toMatch(/await require(User|Learner)\(/);
    }
  });
});
