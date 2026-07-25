import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session  = req.auth;
  const loggedIn = !!session;
  const role     = (session?.user as any)?.role as string | undefined;

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
  if (pathname.startsWith("/account")) {
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
  matcher: ["/admin/:path*", "/account/:path*"],
};
