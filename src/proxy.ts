import { NextResponse, type NextRequest } from "next/server";

// Runs before every request (Next.js 16 "proxy", formerly middleware).
// 1. Cross-site protection: API requests that change data must come from this site.
// 2. A strict Content Security Policy with a fresh nonce for every page.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isCrossSite(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host !== request.headers.get("host");
    } catch {
      return true;
    }
  }
  // No Origin header: fall back to the browser's Fetch Metadata, when sent.
  const site = request.headers.get("sec-fetch-site");
  return site === "cross-site";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    // Auth.js has its own CSRF protection for /api/auth.
    if (!SAFE_METHODS.has(request.method) && !pathname.startsWith("/api/auth/") && isCrossSite(request)) {
      return NextResponse.json({ error: "Cross-site requests are not allowed" }, { status: 403 });
    }
    return NextResponse.next();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    // 'wasm-unsafe-eval' lets the SQL sandbox run SQLite as WebAssembly; it doesn't allow eval() of JavaScript.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
    // The dev server injects CSS as inline <style> tags; production serves stylesheets from 'self'.
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    // Inline style attributes (e.g. progress bar widths) only – no inline <style> blocks.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|sql/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
