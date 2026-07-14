"use client";

import Link from "next/link";
import { Heart, LogIn } from "lucide-react";
import { useUIStore } from "@/lib/store/ui";

/** Shown in place of the authenticated account sidebar when the visitor isn't
 *  logged in — currently only /account/wishlist is reachable as a guest. */
export function GuestSidebar() {
  const { openLoginModal } = useUIStore();

  return (
    <nav className="flex flex-col h-full">
      <div
        className="relative overflow-hidden px-5 pt-7 pb-6"
        style={{ background: "var(--color-primary)" }}
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

        <div
          className="relative w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.3)" }}
        >
          <LogIn className="h-6 w-6 text-white" />
        </div>

        <p className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          You're browsing as a guest
        </p>
        <p className="text-xs font-body mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          Sign in to see orders, wallet & more.
        </p>
        <button
          onClick={() => openLoginModal()}
          className="mt-4 w-full h-10 rounded-lg text-sm font-body font-semibold transition-opacity hover:opacity-90"
          style={{ background: "white", color: "var(--color-primary)" }}
        >
          Sign In
        </button>
      </div>

      <div className="flex-1 py-3 px-3">
        <Link
          href="/account/wishlist"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-body font-semibold"
          style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}
        >
          <Heart className="h-[18px] w-[18px] shrink-0" />
          Wishlist
        </Link>
      </div>
    </nav>
  );
}
