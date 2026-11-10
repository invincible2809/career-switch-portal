import { describe, expect, it } from "vitest";
import { generateQuestion, GENERATORS, validateGeneratorParams } from "@/lib/questions/generators";
import { TEAM_ROLES } from "@/lib/questions/data/team-roles";

const params: Record<string, unknown> = {
  "who-does-what": {},
  "bva-values": { fields: [{ label: "the basket quantity box", min: 1, max: 10 }] },
};

describe.each(Object.keys(GENERATORS))("generator %s", (name) => {
  it("is deterministic for a seed", () => {
    expect(generateQuestion(name, params[name], 42)).toEqual(generateQuestion(name, params[name], 42));
  });
  it("always has exactly one correct option and an explanation for every option (200 seeds)", () => {
    for (let seed = 0; seed < 200; seed++) {
      const q = generateQuestion(name, params[name], seed);
      expect(q.options.filter((o) => o.correct)).toHaveLength(1);
      expect(q.options.every((o) => o.explanation.length > 10)).toBe(true);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(q.options.length);
    }
  });
});

describe("who-does-what", () => {
  it("can fix the answer to one role", () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = generateQuestion("who-does-what", { role: "Tester" }, seed);
      expect(q.options.find((o) => o.correct)?.text).toBe("Tester");
      expect(TEAM_ROLES.find((r) => r.role === "Tester")!.duties.some((d) => q.stem.includes(d))).toBe(true);
    }
  });
  it("rejects unknown roles", () => {
    expect(validateGeneratorParams("who-does-what", { role: "Wizard" })).toMatch(/role must be one of/);
  });
});

describe("bva-values", () => {
  it("picks the boundaries and their closest invalid neighbours", () => {
    const q = generateQuestion("bva-values", { fields: [{ label: "age", min: 18, max: 65 }] }, 7);
    expect(q.options.find((o) => o.correct)?.text).toBe("17, 18, 65, 66");
    expect(q.scenario).toMatch(/18 to 65/);
  });
  it("validates its parameters", () => {
    expect(validateGeneratorParams("bva-values", { fields: [{ label: "x", min: 1, max: 2 }] })).toMatch(/at least 5/);
    expect(validateGeneratorParams("nope", {})).toMatch(/Unknown generator/);
  });
});
