"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, ShoppingBag, Heart, MapPin, Settings, LogOut, ChevronRight, Wallet, Truck, Star, Video,
} from "lucide-react";

const TOP_LINKS = [
  { href: "/account",               label: "Overview",         icon: LayoutDashboard, exact: true },
  { href: "/account/orders",        label: "My Orders",        icon: ShoppingBag,     exact: false },
  { href: "/account/video-bookings", label: "Video Bookings",  icon: Video,           exact: false },
  { href: "/account/reviews",       label: "My Reviews",       icon: Star,            exact: false },
  { href: "/account/wallet",        label: "My Wallet",        icon: Wallet,          exact: false },
  { href: "/track-order",           label: "Track Order",      icon: Truck,           exact: false },
];

const SETTINGS_LINKS = [
  { label: "Profile Information", href: "/account/profile" },
  { label: "Manage Addresses",    href: "/account/addresses" },
  { label: "Wishlist",            href: "/account/wishlist" },
];

const ALL_MOBILE = [
  { href: "/account",               label: "Overview",  icon: LayoutDashboard, exact: true },
  { href: "/account/orders",        label: "Orders",    icon: ShoppingBag,     exact: false },
  { href: "/account/video-bookings", label: "Video",    icon: Video,           exact: false },
  { href: "/account/reviews",       label: "Reviews",   icon: Star,            exact: false },
  { href: "/account/wallet",        label: "Wallet",    icon: Wallet,          exact: false },
  { href: "/account/profile",       label: "Profile",   icon: Settings,        exact: false },
  { href: "/account/addresses",     label: "Addresses", icon: MapPin,          exact: false },
  { href: "/account/wishlist",      label: "Wishlist",  icon: Heart,           exact: false },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="flex flex-col h-full">
      <div className="flex-1 py-3 space-y-0.5">

        {/* Top-level direct links */}
        {TOP_LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <div key={href} className="px-3">
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-body font-semibold transition-all"
                style={{
                  background: active ? "var(--color-primary-50)" : "transparent",
                  color: active ? "var(--color-primary)" : "var(--color-text-primary)",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--color-cream)"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; } }}
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
                />
                <span className="flex-1">{label}</span>
                <ChevronRight
                  className="h-4 w-4"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-text-disabled)" }}
                />
              </Link>
            </div>
          );
        })}

        {/* Divider */}
        <div className="mx-4 my-2 h-px" style={{ background: "var(--color-parchment)" }} />

        {/* Account Settings section */}
        <div className="px-3">
          {/* Section header */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Settings
              className="h-[18px] w-[18px] shrink-0"
              style={{ color: "var(--color-primary)" }}
            />
            <span
              className="text-[11px] font-body font-bold uppercase tracking-[0.14em]"
              style={{ color: "var(--color-text-primary)" }}
            >
              Account Settings
            </span>
          </div>

          {/* Sub-items */}
          <div className="space-y-0.5 pl-4">
            {SETTINGS_LINKS.map(({ label, href }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex items-center pl-6 pr-4 py-2.5 rounded-xl text-sm font-body transition-all"
                  style={{
                    background: active ? "var(--color-primary-50)" : "transparent",
                    color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--color-cream)"; e.currentTarget.style.color = "var(--color-text-primary)"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; } }}
                >
                  {mounted && active && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                      style={{ background: "var(--color-primary)" }}
                    />
                  )}
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="p-3 border-t" style={{ borderColor: "var(--color-parchment)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-medium transition-all"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF0F0"; e.currentTarget.style.color = "var(--color-error)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <div
      className="flex overflow-x-auto gap-1.5 px-4 py-3 border-b scrollbar-hide"
      style={{ background: "white", borderColor: "var(--color-parchment)" }}
    >
      {ALL_MOBILE.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-body font-semibold border transition-all"
            style={{
              background: active ? "var(--color-primary)" : "white",
              color: active ? "white" : "var(--color-text-secondary)",
              borderColor: active ? "var(--color-primary)" : "var(--color-parchment)",
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
