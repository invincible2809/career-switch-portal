import Link from "next/link";

const links = [
  { href: "/settings", label: "Profile and pathway" },
  { href: "/settings/accessibility", label: "Display and accessibility" },
  { href: "/settings/data", label: "Your data" },
];

export function SettingsNav({ current }: { current: string }) {
  return (
    <nav aria-label="Settings" className="mb-6">
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={l.href === current ? "page" : undefined} className={l.href === current ? "font-bold" : ""}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
