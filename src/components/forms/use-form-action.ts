"use client";

import { useActionState, useRef, useTransition } from "react";

/**
 * Like useActionState, but the form keeps what the person typed when the action returns an
 * error. (React clears a form after a `<form action>` finishes, which would make people retype
 * everything after a validation message.) Optionally clears the form after a success.
 */
export function useFormAction<S extends { ok?: string; error?: string; fieldErrors?: Record<string, string> }>(
  action: (prev: S, formData: FormData) => Promise<S>,
  initial = {} as S,
  options: { resetOnSuccess?: boolean } = {},
) {
  const [state, dispatch] = useActionState<S, FormData>(async (prev: S, fd: FormData): Promise<S> => {
    const next = await action(prev, fd);
    if (options.resetOnSuccess && next.ok && !next.error && !next.fieldErrors) formRef.current?.reset();
    return next;
  }, initial as Awaited<S>);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const formProps = {
    ref: formRef,
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(() => dispatch(fd));
    },
  };
  return { state, formProps, pending };
}
