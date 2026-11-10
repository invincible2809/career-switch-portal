import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/server/guards";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: { default: "Career Switch Portal", template: "%s – Career Switch Portal" },
  description: "Self-paced learning for adults moving into Scrum Master or QA Tester roles.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const prefs = user?.accessibility;
  return (
    <html
      lang="en-GB"
      data-text-scale={prefs?.textScale ?? "DEFAULT"}
      data-font={prefs?.dyslexiaFont ? "dyslexia" : "default"}
      data-reduced-motion={prefs?.reducedMotion ? "true" : "false"}
    >
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-4 focus:py-2"
        >
          Skip to main content
        </a>
        <SiteHeader user={user ? { name: user.displayName, role: user.role } : null} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 py-8 focus:outline-none">
          {children}
        </main>
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted">
            <span>Career Switch Portal – a learning course, not an accredited qualification.</span>
            <Link href="/privacy">Privacy notice</Link>
            <Link href="/glossary">Glossary</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
