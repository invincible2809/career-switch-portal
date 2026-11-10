import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border bg-surface p-5 shadow-sm", className)} {...props} />;
}

export function Alert({
  tone = "info",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: "info" | "success" | "warning" | "danger" }) {
  const tones = {
    info: "border-primary bg-primary-soft",
    success: "border-success bg-success-soft",
    warning: "border-warning bg-warning-soft",
    danger: "border-danger bg-danger-soft",
  };
  return <div className={cn("rounded-md border-l-4 p-4", tones[tone], className)} {...props} />;
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "warning" | "primary" }) {
  const tones = {
    neutral: "bg-surface-muted text-text",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    primary: "bg-primary-soft text-primary",
  };
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold", tones[tone], className)} {...props} />;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function PageHeader({ title, intro, children }: { title: string; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 space-y-2">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {intro ? <div className="max-w-prose text-muted">{intro}</div> : null}
      {children}
    </div>
  );
}
