import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { matchLabReports } from "@/lib/lab/match";
import { LAB_DEFECTS } from "@/server/lab/defects";
import { ALLOWED_ENDPOINTS, isAllowed } from "@/lib/lab/api-allowlist";
import { buildDatasetSql, sameResult, SQL_EXERCISES } from "@/lib/lab/sql-dataset";
import { testExecution } from "@/lib/assignments/checks";
import type { QaTestLab } from "@/lib/assignments/forms";

const rep = (area: string, title: string, expected: string, actual: string, extra = {}) => ({
  area, title, expected, actual, steps: "Go to the basket and update", severity: "High", priority: "High", ...extra,
});

describe("matchLabReports", () => {
  it("finds clear reports, flags partial ones, duplicates and non-matches", () => {
    const r = matchLabReports(
      [
        rep("basket", "Quantity of 0 accepted", "Quantity 0 should be rejected", "It was accepted"),
        rep("checkout", "Delivery charged at £50.00", "Delivery should be free at £50.00", "£3.95 was charged"),
        rep("checkout", "Delivery at exactly £50", "Free delivery", "Charged", { severity: "" }),
        rep("login", "Logo is blue", "Green logo", "Blue logo"),
        rep("basket", "Basket allows zero", "Should not allow quantity 0", "zero accepted"),
      ],
      LAB_DEFECTS,
    );
    expect(r.matches.map((m) => m.result)).toEqual(["found", "found", "duplicate", "not matched", "duplicate"]);
    expect(r.found).toBe(2);
  });
  it("only matches defects in the chosen area", () => {
    const r = matchLabReports([rep("login", "Quantity of 0 accepted", "Quantity 0 should be rejected", "accepted")], LAB_DEFECTS);
    expect(r.matches[0].result).toBe("not matched");
  });
});

describe("testExecution", () => {
  const tc = (status: QaTestLab["testCases"][number]["status"], actual = "") =>
    ({ title: "t", field: "quantity", technique: "BVA", testData: "1", steps: "steps", expected: "ok", status, actual }) as QaTestLab["testCases"][number];
  it("needs every submitted case run, with actual results for failures", () => {
    expect(testExecution({ testCases: [...Array(5)].map(() => tc("PASS")).concat(tc("FAIL", "Accepted 0")), defects: [] }).score).toBe(3);
    expect(testExecution({ testCases: [...Array(6)].map(() => tc("PASS")).concat(tc("NOT_RUN")), defects: [] }).score).toBe(2);
    expect(testExecution({ testCases: [...Array(5)].map(() => tc("PASS")).concat(tc("FAIL")), defects: [] }).score).toBe(1);
  });
});

describe("API sandbox allow-list", () => {
  it("allows only listed methods and paths on the mock API", () => {
    expect(isAllowed("GET", "/api/lab/shop/products")).toBe(true);
    expect(isAllowed("GET", "/api/lab/shop/products/mug")).toBe(true);
    expect(isAllowed("POST", "/api/lab/shop/basket/items")).toBe(true);
    expect(isAllowed("DELETE", "/api/lab/shop/products")).toBe(false);
    expect(isAllowed("GET", "/api/admin/users")).toBe(false);
    expect(isAllowed("GET", "/api/me/export")).toBe(false);
    expect(isAllowed("GET", "https://example.com/api/lab/shop/products")).toBe(false);
    expect(isAllowed("GET", "//example.com/api/lab/shop/products")).toBe(false);
    expect(isAllowed("GET", "/api/lab/shop/products/../../admin/users")).toBe(false);
  });
  it("every endpoint has a route handler file", async () => {
    const fs = await import("node:fs");
    for (const e of ALLOWED_ENDPOINTS) {
      const file = `src/app/api/lab/shop${e.path.replace(":id", "[id]")}/route.ts`;
      expect(fs.readFileSync(file, "utf8"), file).toContain(`export async function ${e.method}`);
    }
  });
});

describe("SQL sandbox dataset and exercises", async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(buildDatasetSql());
  const rows = (sql: string) => db.exec(sql).at(-1)?.values ?? [];

  it("builds the same data every time", () => {
    expect(buildDatasetSql()).toBe(buildDatasetSql());
    expect(rows("SELECT COUNT(*) FROM customers")[0][0]).toBe(20);
  });
  it("has the planted data-quality issues", () => {
    expect(rows("SELECT COUNT(*) FROM order_items WHERE quantity = 0")[0][0]).toBe(2);
    expect(rows("SELECT COUNT(*) FROM orders WHERE postcode = lower(postcode)")[0][0]).toBe(2);
  });
  it.each(SQL_EXERCISES)("exercise $id has a non-empty answer", (ex) => {
    expect(rows(ex.solution).length).toBeGreaterThan(0);
  });
  it("accepts an equivalent query and rejects a wrong one", () => {
    const ex = SQL_EXERCISES.find((e) => e.id === "never-ordered")!;
    const expected = rows(ex.solution);
    expect(sameResult(rows("SELECT name FROM products WHERE id NOT IN (SELECT product_id FROM order_items)"), expected, false)).toBe(true);
    expect(sameResult(rows("SELECT name FROM products"), expected, false)).toBe(false);
  });
});
