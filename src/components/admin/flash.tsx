import { Alert } from "@/components/ui/card";

export function Flash({ msg, err }: { msg?: string; err?: string }) {
  if (!msg && !err) return null;
  return (
    <Alert tone={err ? "danger" : "success"} role={err ? "alert" : "status"} className="mb-4">
      {err ?? msg}
    </Alert>
  );
}

export type FlashParams = Promise<{ msg?: string; err?: string }>;
