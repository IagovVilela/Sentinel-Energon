import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = [
  "/login",
  "/api/auth/login",
  "/api/health",
  "/status",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  const allowed = (process.env.ALLOWED_IPS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowed.length > 0) {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!allowed.includes(ip)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const session = request.cookies.get("energon_session");
  if (!session?.value && !pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
