// Certificate of Completion rules (PLAN §1.2 point 3): Foundations plus the pathway's available
// modules, with every lesson finished, every module assessment passed and competency shown in
// every practical assignment. "Coming soon" modules don't count.
export interface ModuleStatus {
  title: string;
  lessons: { total: number; completed: number };
  assessments: { title: string; passedAt: Date | null }[];
  assignments: { title: string; demonstratedAt: Date | null; assessedBy?: string }[];
}

export interface Eligibility {
  eligible: boolean;
  missing: string[];
}

export function certificateEligibility(modules: readonly ModuleStatus[]): Eligibility {
  const missing: string[] = [];
  if (modules.length === 0) missing.push("There are no available modules in this pathway yet.");
  for (const m of modules) {
    if (m.lessons.total === 0 || m.lessons.completed < m.lessons.total)
      missing.push(`Finish all lessons in ${m.title} (${m.lessons.completed} of ${m.lessons.total} done)`);
    for (const a of m.assessments) if (!a.passedAt) missing.push(`Pass ${a.title}`);
    for (const a of m.assignments) if (!a.demonstratedAt) missing.push(`Show competency in "${a.title}"`);
  }
  return { eligible: missing.length === 0, missing };
}

export const CERTIFICATE_STATEMENT = "This is not an accredited qualification.";

export interface CertificateSnapshot {
  name: string;
  pathway: string;
  modules: string[];
  assessments: { title: string; passedAt: string }[];
  competencies: { title: string; demonstratedAt: string; assessedBy?: string }[];
  issuedAt: string;
}

/** The text that appears on the certificate, for the page, the PDF and the wording checks. */
export function certificateLines(s: CertificateSnapshot): string[] {
  const d = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return [
    "Certificate of Completion",
    `This is to confirm that ${s.name} has completed the ${s.pathway} pathway on Career Switch Portal.`,
    `Modules completed: ${s.modules.join("; ")}`,
    ...s.assessments.map((a) => `Assessment passed: ${a.title} – ${d(a.passedAt)}`),
    ...s.competencies.map((c) => `Practical assignment (simulated project) met the course standard: ${c.title} – ${d(c.demonstratedAt)} (${competencySource(c.assessedBy)})`),
    `Issued ${d(s.issuedAt)}`,
    CERTIFICATE_STATEMENT,
  ];
}

export function competencySource(assessedBy?: string) {
  return assessedBy === "ASSESSOR" ? "reviewed by an assessor" : "automated checks, not reviewed by a person";
}

export function verificationId(random: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I
  const pick = () => alphabet[Math.floor(random() * alphabet.length)];
  return `CSP-${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}`;
}
