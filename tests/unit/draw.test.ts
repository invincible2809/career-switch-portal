import { describe, expect, it } from "vitest";
import { cooldownRemaining, drawQuestions } from "@/lib/assessment/draw";
import { createRng } from "@/lib/random";

const pool = Array.from({ length: 25 }, (_, i) => ({ id: `id${i}`, key: `q${i}`, objective: `obj${i % 3}` }));

describe("drawQuestions", () => {
  it("draws the requested number of distinct questions", () => {
    const d = drawQuestions(pool, new Map(), 10, createRng(1));
    expect(d).toHaveLength(10);
    expect(new Set(d.map((q) => q.key)).size).toBe(10);
  });

  it("gives a second attempt completely different questions when the bank allows it", () => {
    const first = drawQuestions(pool, new Map(), 10, createRng(2));
    const seen = new Map(first.map((q) => [q.key, 1000]));
    const second = drawQuestions(pool, seen, 10, createRng(3));
    expect(second.filter((q) => seen.has(q.key))).toHaveLength(0);
  });

  it("reuses the questions seen longest ago once fresh ones run out", () => {
    const seen = new Map(pool.map((q, i) => [q.key, i])); // q0 seen longest ago
    const d = drawQuestions(pool, seen, 3, createRng(4));
    expect(d.map((q) => q.key).sort()).toEqual(["q0", "q1", "q2"]);
  });

  it("spreads questions across objectives", () => {
    const d = drawQuestions(pool, new Map(), 9, createRng(5));
    const counts = d.reduce<Record<string, number>>((acc, q) => ({ ...acc, [q.objective]: (acc[q.objective] ?? 0) + 1 }), {});
    expect(Object.values(counts)).toEqual([3, 3, 3]);
  });

  it("is reproducible from a seed", () => {
    expect(drawQuestions(pool, new Map(), 10, createRng(9)).map((q) => q.key)).toEqual(
      drawQuestions(pool, new Map(), 10, createRng(9)).map((q) => q.key),
    );
  });

  it("returns the whole pool when it is smaller than the draw", () => {
    expect(drawQuestions(pool.slice(0, 4), new Map(), 10, createRng(1))).toHaveLength(4);
  });
});

describe("cooldownRemaining", () => {
  const now = new Date("2026-01-01T12:00:00Z");
  it("is zero with no cooldown or no previous attempt", () => {
    expect(cooldownRemaining(null, 30, now)).toBe(0);
    expect(cooldownRemaining(new Date("2026-01-01T11:59:00Z"), 0, now)).toBe(0);
  });
  it("counts down whole minutes", () => {
    expect(cooldownRemaining(new Date("2026-01-01T11:50:00Z"), 30, now)).toBe(20);
    expect(cooldownRemaining(new Date("2026-01-01T11:00:00Z"), 30, now)).toBe(0);
  });
});
