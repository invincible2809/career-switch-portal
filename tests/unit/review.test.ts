import { describe, expect, it } from "vitest";
import { nextReview, startReview } from "@/lib/assessment/review";

const DAY = 86_400_000;
const now = new Date("2026-03-01T09:00:00Z");
const days = (d: Date) => Math.round((d.getTime() - now.getTime()) / DAY);

describe("spaced review", () => {
  it("starts at 1 day", () => {
    expect(days(startReview(now).dueAt)).toBe(1);
  });
  it("moves through 3, 7 and 21 days, then retires", () => {
    let s = startReview(now);
    const seen: number[] = [];
    for (let i = 0; i < 3; i++) {
      s = nextReview(s, true, now);
      seen.push(days(s.dueAt));
    }
    expect(seen).toEqual([3, 7, 21]);
    expect(nextReview(s, true, now).retired).toBe(true);
  });
  it("goes back to 1 day after a wrong answer", () => {
    const s = nextReview({ stage: 2 }, false, now);
    expect(s.stage).toBe(0);
    expect(days(s.dueAt)).toBe(1);
  });
});
