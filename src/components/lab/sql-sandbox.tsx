"use client";

import { useEffect, useRef, useState } from "react";
import type { Database, SqlJsStatic } from "sql.js";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/field";
import { buildDatasetSql, sameResult, SQL_EXERCISES, type Rows } from "@/lib/lab/sql-dataset";

interface ResultSet {
  columns: string[];
  values: Rows;
}

/** SQLite running entirely in the browser on synthetic data (CLAUDE.md rule 3). Nothing is sent to the server. */
export function SqlSandbox() {
  const sqlRef = useRef<SqlJsStatic | null>(null);
  const dbRef = useRef<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("SELECT * FROM products;");
  const [results, setResults] = useState<ResultSet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Loading the database…");
  const [exercise, setExercise] = useState(SQL_EXERCISES[0].id);
  const [check, setCheck] = useState<{ ok: boolean; text: string } | null>(null);

  const fresh = (SQL: SqlJsStatic) => {
    dbRef.current?.close();
    const db = new SQL.Database();
    db.run(buildDatasetSql());
    dbRef.current = db;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({ locateFile: () => "/sql/sql-wasm-browser.wasm" });
      if (cancelled) return;
      sqlRef.current = SQL;
      fresh(SQL);
      setReady(true);
      setStatus("Database ready: customers, products, orders and order_items.");
    })().catch(() => setStatus("Sorry, the SQL sandbox couldn't load in this browser."));
    return () => {
      cancelled = true;
      dbRef.current?.close();
    };
  }, []);

  const run = (sql: string): ResultSet[] => (dbRef.current!.exec(sql) as ResultSet[]);

  const onRun = () => {
    setCheck(null);
    try {
      const r = run(query);
      setResults(r);
      setError(null);
      setStatus(r.length ? `${r[r.length - 1].values.length} row(s) returned.` : "Done – no rows returned.");
    } catch (e) {
      setResults(null);
      setError((e as Error).message);
      setStatus("The query has an error.");
    }
  };

  const onReset = () => {
    if (!sqlRef.current) return;
    fresh(sqlRef.current);
    setResults(null);
    setError(null);
    setCheck(null);
    setStatus("The database has been reset to its starting data.");
  };

  const onCheck = () => {
    const ex = SQL_EXERCISES.find((x) => x.id === exercise)!;
    try {
      const mine = run(query).at(-1)?.values ?? [];
      const expected = run(ex.solution).at(-1)?.values ?? [];
      setCheck(
        sameResult(mine, expected, ex.ordered)
          ? { ok: true, text: "That's right – your query returns the expected rows." }
          : { ok: false, text: `Not quite – your query returned ${mine.length} row(s); the expected answer has ${expected.length}. If the numbers match, check the columns and values. Hint: ${ex.hint}` },
      );
    } catch (e) {
      setCheck({ ok: false, text: `Your query has an error: ${(e as Error).message}` });
    }
  };

  const current = SQL_EXERCISES.find((x) => x.id === exercise)!;
  const last = results?.at(-1);

  return (
    <div className="space-y-4">
      <p role="status" className="text-sm text-muted">
        {status}
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor="sql-exercise" className="block font-semibold">
            Exercise
          </label>
          <Select id="sql-exercise" value={exercise} onChange={(e) => (setExercise(e.target.value), setCheck(null))}>
            {SQL_EXERCISES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p>
        <strong>Task:</strong> {current.task}
      </p>
      <details>
        <summary className="cursor-pointer font-semibold text-primary">Show a hint</summary>
        <p className="mt-1">{current.hint}</p>
      </details>
      <div>
        <label htmlFor="sql-query" className="block font-semibold">
          Your SQL
        </label>
        <Textarea id="sql-query" value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-28 font-mono text-sm" spellCheck={false} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onRun} disabled={!ready}>
          Run query
        </Button>
        <Button type="button" variant="secondary" onClick={onCheck} disabled={!ready}>
          Check my answer
        </Button>
        <Button type="button" variant="ghost" onClick={onReset} disabled={!ready}>
          Reset the database
        </Button>
      </div>
      {check ? (
        <Alert tone={check.ok ? "success" : "warning"} role="alert">
          {check.text}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" role="alert">
          <strong>Error:</strong> {error}
        </Alert>
      ) : null}
      {last ? (
        <div className="max-h-96 overflow-auto rounded-md border border-border" tabIndex={0} role="region" aria-label="Query results">
          <table className="w-full border-collapse bg-surface text-left text-sm" data-testid="sql-results">
            <caption className="sr-only">Query results</caption>
            <thead>
              <tr>
                {last.columns.map((c) => (
                  <th key={c} scope="col" className="border border-border p-2">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {last.values.map((row, i) => (
                <tr key={i}>
                  {row.map((v, j) => (
                    <td key={j} className="border border-border p-2">
                      {v === null ? "NULL" : String(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
