"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { labShopAction, type LabFormState } from "@/app/lab/actions";
import { Alert } from "@/components/ui/card";

/** A demo-shop form. Shows the shop's own response message, as a real shop would. */
export function LabForm({ op, children, className }: { op: string; children: React.ReactNode; className?: string }) {
  const { state, formProps } = useFormAction<LabFormState>(labShopAction);
  return (
    <form {...formProps} className={className}>
      <input type="hidden" name="op" value={op} />
      {children}
      <div aria-live="polite">
        {state.error ? (
          <Alert tone="danger" className="mt-2" key={state.at}>
            {state.error}
          </Alert>
        ) : state.ok ? (
          <Alert tone="success" className="mt-2" key={state.at}>
            {state.ok}
          </Alert>
        ) : null}
      </div>
    </form>
  );
}
