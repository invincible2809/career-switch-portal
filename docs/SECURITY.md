# Security review (Phase 5, 10 Nov 2026)

What protects the portal, how it's tested, and what's left to decide before real learners use it.

## Controls in place

| Area | What's done | How it's checked |
|---|---|---|
| Authentication | Auth.js credentials; argon2id (19 MiB, 2 iterations); dummy hash for unknown emails so login timing doesn't reveal accounts; 7-day JWT session that only carries the user id and a session version | `tests/e2e/ac01-02-register-onboarding.spec.ts` |
| Session revocation | Every request reloads the user and compares `sessionVersion`; password reset, role change and account deletion end existing sessions | `tests/e2e/ac12-13-security.spec.ts` ("a role change ends existing sessions") |
| Authorisation | One permission map (`src/lib/permissions.ts`); every admin page calls `requireAdmin()`, every admin API `adminApiGuard()`, every server action `requireUser/Learner/Admin()` first | `tests/unit/guard-coverage.test.ts` fails the build if any page, route handler or server action is missing a check (public pages are a named list) |
| Learner data isolation | Ownership is in every query's `where` clause (attempts, notes, submissions, Lab records, portfolio, certificates) | AC 13 e2e, including a tampered form trying to delete another learner's note |
| Cross-site request forgery | Server actions: Next.js's built-in origin check. API route handlers: `src/proxy.ts` refuses non-GET requests to `/api/*` whose Origin (or `Sec-Fetch-Site`) is another site. Session cookie is `SameSite=Lax` | `tests/e2e/security-headers.spec.ts` |
| Content Security Policy | Per-request nonce, `strict-dynamic`, no inline scripts, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`; `'wasm-unsafe-eval'` only for the SQL sandbox; inline style *attributes* allowed (`style-src-attr`) | `tests/e2e/security-headers.spec.ts` (no violations on key pages, run against a production build with `pnpm test:e2e:prod`) |
| Other headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`; HSTS in production | header assertions in the same spec |
| Input validation | Zod on every form, server action and route handler; length limits everywhere; lesson Markdown sanitised (`rehype-sanitize`, no raw HTML) | `tests/unit/markdown-permissions.test.ts`, form tests |
| Rate limits | Postgres buckets: login 10/15 min per email and 300/15 min per address; registration, password reset, coach, interview, flags, assignment submissions, Lab API | unit tests for helpers; manual review |
| Password reset | 32-byte random token, only a SHA-256 hash stored, 1-hour expiry, single use, same message whether or not the account exists | e2e |
| Sandboxes | SQL runs in the browser on synthetic data (no requests sent); the API sandbox can only call allow-listed mock endpoints on the portal itself, enforced in the browser and by the server (session + cross-site check); the demo shop's answer key is server-only | `tests/e2e/lab.spec.ts`, `tests/unit/lab-tools.test.ts` |
| Share links and certificates | Portfolio share tokens are 24 random bytes, stored hashed, revocable, not indexed; certificate verification IDs use a 32-character alphabet (about 60 bits) and the page is read-only | `tests/e2e/phase4.spec.ts` |
| Demo-only features | `/dev/mailbox` exists only when SMTP isn't configured and is off in production unless `ALLOW_DEMO_MAILBOX=true` | guard-coverage test |
| Dependencies | `pnpm audit --prod`: no known vulnerabilities after upgrading nodemailer to 10.5 | run before each release |
| No AI provider | Nothing learners type is sent to any outside service | design (PLAN §8.2) |

## Known risks and decisions for the owner

1. **Registration reveals whether an email is registered** ("An account with this email already exists"). Kept for now by decision (10 Nov 2026) because real email isn't connected. Fix when email is live: always say "check your email" and email the existing account holder instead.
2. **Per-address rate limits trust the first `X-Forwarded-For` value.** Behind a correctly configured proxy that's fine; exposed directly, it can be spoofed to dodge the per-address limit (the per-email login limit still applies). Configure when hosting is chosen.
3. **No multi-factor authentication** for admins or learners, and **no admin login alerts**. Recommended before real use, especially for admin accounts.
4. **No account lockout notification:** repeated failed logins are throttled, not reported to the account holder.
5. **Demo accounts:** `learner@demo.local` and `admin@demo.local` are created by `pnpm db:seed` with passwords from `.env`. Don't seed demo accounts into a real environment, or change their passwords and remove them before launch.
6. **JWT sessions last 7 days** (re-checked against the database on every request, so they can be ended centrally). Shorten if needed.
7. **`style-src-attr 'unsafe-inline'`** allows inline style attributes (used for progress bar widths). Low risk; could be removed by switching those to CSS classes.
8. **Content written by admins is trusted** to the extent that it's Markdown rendered through a sanitiser; there's no separate content-editor role yet (the permission map is ready for one).
9. **Not tested here:** running behind a real HTTPS proxy, real SMTP, and Docker Compose (the build environment had no Docker daemon).
