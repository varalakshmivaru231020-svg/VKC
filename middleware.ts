import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session  = req.auth;
  const loggedIn = !!session;
  const role     = (session?.user as any)?.role as string | undefined;

  // ── Admin API: same rule as the admin pages, but answer with JSON status
  //    codes instead of redirects so callers get a clear 401/403. Without
  //    this, every /api/admin/* write was reachable without logging in.
  if (pathname.startsWith("/api/admin")) {
    if (!loggedIn) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    return NextResponse.next();
  }

  // ── Admin routes (skip /admin/login itself) ──────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!loggedIn) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ── Account routes require login — show popup instead of login page ───────
  // Wishlist is exempt: it's stored client-side (no userId), so guests can use it freely.
  if (pathname.startsWith("/account") && pathname !== "/account/wishlist") {
    if (!loggedIn) {
      const url = new URL("/", req.url);
      url.searchParams.set("openLogin", "1");
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*"],
};
