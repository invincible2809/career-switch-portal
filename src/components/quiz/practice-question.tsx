"use client";

import { useRef, useState, useTransition } from "react";
import type { PublicQuestion } from "@/lib/assessment/snapshot";
import { QuestionInputs, readResponse } from "./question-inputs";
import { Button } from "@/components/ui/button";
import type { PracticeFeedback } from "@/app/learn/[lesson]/actions";

/** One practice question with instant feedback for every option. Used by knowledge checks and quick review. */
export function PracticeQuestion({
  q,
  seed,
  number,
  total,
  check,
  lessonLink,
}: {
  q: PublicQuestion;
  seed: number;
  number: number;
  total: number;
  check: (questionId: string, seed: number, response: string[]) => Promise<PracticeFeedback | null>;
  lessonLink?: { href: string; label: string };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const prefix = `pq_${q.questionId}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const response = readResponse(q, prefix, new FormData(e.currentTarget));
    if (response.length === 0) {
      setError(q.type === "ORDER" ? "Give every item a different position first." : "Choose an answer first.");
      return;
    }
    setError(null);
    start(async () => {
      const r = await check(q.questionId, seed, response);
      if (!r) setError("Sorry, that answer couldn't be checked. Please try again.");
      setFeedback(r);
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <fieldset disabled={!!feedback} className="space-y-3">
        <legend className="font-semibold">
          <span className="block text-sm text-muted">
            Question {number} of {total}
          </span>
          {q.scenario ? <span className="block font-normal">{q.scenario}</span> : null}
          {q.stem}
        </legend>
        <QuestionInputs q={q} prefix={prefix} />
      </fieldset>
      {error ? (
        <p role="alert" className="font-semibold text-danger">
          {error}
        </p>
      ) : null}
      {!feedback ? (
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Checking…" : "Check answer"}
        </Button>
      ) : (
        <div role="status" className="space-y-2">
          <p className={feedback.correct ? "font-bold text-success" : "font-bold text-warning"}>
            {feedback.correct ? "That's right." : "Not quite – here's why."}
          </p>
          {q.type === "ORDER" ? (
            <p>
              The correct order is:{" "}
              {feedback.correctOrder.map((id) => feedback.options.find((o) => o.id === id)?.text).join(" → ")}
            </p>
          ) : null}
          <ul className="space-y-1">
            {feedback.options.map((o) => (
              <li key={o.id}>
                <strong>
                  {o.text}
                  {q.type !== "ORDER" ? (o.correct ? " – correct" : " – incorrect") : ""}:
                </strong>{" "}
                {o.explanation}
              </li>
            ))}
          </ul>
          {!feedback.correct ? (
            <p className="text-sm text-muted">
              We&apos;ll bring this question back in your quick review in a day or so.
              {lessonLink ? (
                <>
                  {" "}
                  <a href={lessonLink.href}>{lessonLink.label}</a>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      )}
    </form>
  );
}
