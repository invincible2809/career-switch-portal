import Link from "next/link";
import { requireAdmin } from "@/server/guards";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/curriculum", label: "Curriculum" },
  { href: "/admin/question-banks", label: "Question banks" },
  { href: "/admin/assessments", label: "Assessments" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-log", label: "Audit log" },
];

// The layout check is a first line of defence; every admin page and action also checks the role itself.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <nav aria-label="Admin" className="rounded-lg border border-border bg-surface px-4 py-2">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="inline-block py-1 font-semibold">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
