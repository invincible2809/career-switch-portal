"use client";

import type { PublicQuestion } from "@/lib/assessment/snapshot";

/**
 * Accessible inputs for every question type. ORDER questions use a numbered <select> per item,
 * which works with a keyboard and screen readers (no drag and drop needed).
 * Field names: `${prefix}` for single choice, `${prefix}` (repeated) for multi, `${prefix}_pos_${optionId}` for order.
 */
export function QuestionInputs({
  q,
  prefix,
  disabled,
  onChange,
}: {
  q: PublicQuestion;
  prefix: string;
  disabled?: boolean;
  onChange?: () => void;
}) {
  if (q.type === "ORDER") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">Give each item a position. 1 = first.</p>
        {q.options.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-3">
            <label htmlFor={`${prefix}_pos_${o.id}`} className="sr-only">
              Position for {o.text}
            </label>
            <select
              id={`${prefix}_pos_${o.id}`}
              name={`${prefix}_pos_${o.id}`}
              defaultValue=""
              disabled={disabled}
              onChange={onChange}
              className="min-h-11 rounded-md border border-[#6b7a80] bg-surface px-2"
            >
              <option value="">–</option>
              {q.options.map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <span aria-hidden="true">{o.text}</span>
          </div>
        ))}
      </div>
    );
  }
  const multi = q.type === "MULTI";
  return (
    <div className="space-y-2">
      {multi ? <p className="text-sm text-muted">Choose all that apply.</p> : null}
      {q.options.map((o) => (
        <label key={o.id} className="flex items-start gap-3 rounded-md border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
          <input
            type={multi ? "checkbox" : "radio"}
            name={prefix}
            value={o.id}
            disabled={disabled}
            onChange={onChange}
            className="mt-1 h-5 w-5 shrink-0"
          />
          <span>{o.text}</span>
        </label>
      ))}
    </div>
  );
}

/** Reads a question's answer back out of FormData in the shape the scorer expects. */
export function readResponse(q: { type: PublicQuestion["type"]; options: { id: string }[] }, prefix: string, form: FormData): string[] {
  if (q.type === "ORDER") {
    const positions = q.options
      .map((o) => ({ id: o.id, pos: Number(form.get(`${prefix}_pos_${o.id}`)) }))
      .filter((p) => p.pos > 0);
    if (positions.length !== q.options.length) return [];
    return positions.sort((a, b) => a.pos - b.pos).map((p) => p.id);
  }
  return form.getAll(prefix).map(String);
}
