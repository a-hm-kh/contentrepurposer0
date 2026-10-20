import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge proxy — kept dependency-free so it can run on the edge runtime.
 * (Role gating happens in `app/admin/layout.tsx`, where the database is available.)
 *
 * Responsibility: baseline security headers on every HTML response.
 */

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "on",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
