import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";

interface Props {
  user: { name: string; role: "LEARNER" | "ADMIN" } | null;
}

const learnerLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pathways", label: "Pathways" },
  { href: "/lab", label: "Test Lab" },
  { href: "/review", label: "Quick review" },
  { href: "/notes", label: "Notes" },
  { href: "/glossary", label: "Glossary" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader({ user }: Props) {
  const links = user
    ? [...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []), ...learnerLinks]
    : [
        { href: "/login", label: "Log in" },
        { href: "/register", label: "Create account" },
      ];
  const navList = (
    <ul className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="inline-block py-2 font-semibold no-underline hover:underline">
            {l.label}
          </Link>
        </li>
      ))}
      {user ? (
        <li>
          <form action={logoutAction}>
            <button type="submit" className="py-2 font-semibold text-primary hover:underline">
              Log out
            </button>
          </form>
        </li>
      ) : null}
    </ul>
  );
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href={user ? "/dashboard" : "/"} className="text-lg font-bold text-text no-underline">
          Career Switch Portal
        </Link>
        <nav aria-label="Main" className="hidden sm:block">
          {navList}
        </nav>
        <details className="sm:hidden">
          <summary className="cursor-pointer rounded-md border border-border px-3 py-2 font-semibold">Menu</summary>
          <nav aria-label="Main (mobile)" className="mt-2">
            {navList}
          </nav>
        </details>
      </div>
    </header>
  );
}
