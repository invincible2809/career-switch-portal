import "server-only";
import {
  boundaryCoverage,
  defectsIdentified,
  impedimentLogComplete,
  retroPlanStructure,
  testCasesComplete,
  type CheckResult,
} from "@/lib/assignments/checks";
import type { QaCheckout, ScrumRetroPlan } from "@/lib/assignments/forms";
import { SESSION_LOG } from "@/lib/assignments/qa-session-log";
import { QA_KNOWN_DEFECTS } from "./qa-known-defects";

/** Automated checks named by `autoCheck` in rubric files. */
export const AUTO_CHECKS: Record<string, (payload: unknown) => CheckResult> = {
  impedimentLogComplete: (p) => impedimentLogComplete(p as ScrumRetroPlan),
  retroPlanStructure: (p) => retroPlanStructure(p as ScrumRetroPlan),
  testCasesComplete: (p) => testCasesComplete(p as QaCheckout),
  boundaryCoverage: (p) => boundaryCoverage(p as QaCheckout),
  defectsIdentified: (p) => defectsIdentified(p as QaCheckout, QA_KNOWN_DEFECTS, SESSION_LOG.length),
};
