import Link from "next/link";

const links = [
  { href: "/lab", label: "Test Lab home" },
  { href: "/lab/shop", label: "Demo shop" },
  { href: "/lab/test-cases", label: "Test cases" },
  { href: "/lab/defects", label: "Defect reports" },
  { href: "/lab/sql", label: "SQL sandbox" },
  { href: "/lab/api", label: "API sandbox" },
];

export function LabNav({ current }: { current: string }) {
  return (
    <nav aria-label="Test Lab" className="mb-6 rounded-lg border border-border bg-surface px-4 py-2">
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={l.href === current ? "page" : undefined} className={l.href === current ? "font-bold" : "font-semibold"}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
