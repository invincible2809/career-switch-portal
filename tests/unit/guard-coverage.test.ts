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

// ---------- Phase 5: full inventory ----------
const PUBLIC_PAGES = new Set([
  "src/app/page.tsx", // home – redirects signed-in users
  "src/app/privacy/page.tsx",
  "src/app/glossary/page.tsx",
  "src/app/glossary/[term]/page.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
  "src/app/(auth)/forgot-password/page.tsx",
  "src/app/(auth)/reset-password/[token]/page.tsx",
  "src/app/dev/mailbox/page.tsx", // only in demo mode, off in production (checked below)
  "src/app/verify/[id]/page.tsx", // public certificate check by unguessable ID
  "src/app/portfolio/shared/[token]/page.tsx", // learner-controlled share link
]);

describe("security inventory", () => {
  it("every page outside the named public pages checks who is signed in", () => {
    const pages = files("src/app", /^page\.tsx$/).map((p) => p.split(path.sep).join("/"));
    expect(pages.length).toBeGreaterThan(40);
    for (const p of pages) {
      if (PUBLIC_PAGES.has(p)) continue;
      expect(fs.readFileSync(p, "utf8"), p).toMatch(/await require(User|Learner|Admin)\(/);
    }
  });

  it("public pages with secrets in the URL validate them before use", () => {
    expect(fs.readFileSync("src/app/verify/[id]/page.tsx", "utf8")).toMatch(/\/\^CSP-/);
    expect(fs.readFileSync("src/server/portfolio.ts", "utf8")).toMatch(/A-Za-z0-9_-\]\{20,100\}/);
    expect(fs.readFileSync("src/app/dev/mailbox/page.tsx", "utf8")).toMatch(/demoMailboxEnabled\(\)/);
    expect(fs.readFileSync("src/server/mail.ts", "utf8")).toMatch(/NODE_ENV !== "production" \|\| process\.env\.ALLOW_DEMO_MAILBOX === "true"/);
  });

  it("every API route handler checks the session (or is Auth.js itself)", () => {
    const routes = files("src/app/api", /^route\.ts$/).filter((r) => !r.includes(`${path.sep}auth${path.sep}`));
    expect(routes.length).toBeGreaterThan(10);
    for (const r of routes) {
      const src = fs.readFileSync(r, "utf8");
      const handlers = (src.match(/export async function (GET|POST|PUT|PATCH|DELETE)/g) ?? []).length;
      const guards = (src.match(/await (getCurrentUser|adminApiGuard)\(|labApi\(/g) ?? []).length;
      expect(guards, r).toBeGreaterThanOrEqual(handlers);
    }
  });

  it("every server action in any 'use server' file checks the user first", () => {
    const actionFiles = files("src", /\.tsx?$/).filter((f) => fs.readFileSync(f, "utf8").startsWith('"use server"') && !f.includes("(auth)"));
    expect(actionFiles.length).toBeGreaterThan(8);
    for (const f of actionFiles) {
      const bodies = fs.readFileSync(f, "utf8").split(/\nexport async function /).slice(1);
      for (const body of bodies) expect(body.split("\n").slice(0, 3).join("\n"), `${f}: ${body.split("(")[0]}`).toMatch(/await require(User|Learner|Admin)\(/);
    }
  });

  it("the proxy blocks cross-site writes to the API and sets a nonce-based CSP", () => {
    const src = fs.readFileSync("src/proxy.ts", "utf8");
    expect(src).toMatch(/isCrossSite\(request\)/);
    expect(src).toMatch(/'nonce-\$\{nonce\}' 'strict-dynamic'/);
    expect(src).toMatch(/frame-ancestors 'none'/);
  });
});
