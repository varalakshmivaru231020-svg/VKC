"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Heart, ShoppingBag, User } from "lucide-react";
import { useCartStore, useWishlistStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/",                  label: "Home",     Icon: Home },
  { href: "/shop",              label: "Shop",     Icon: Store },
  { href: "/account/wishlist",  label: "Wishlist", Icon: Heart,        showWishlistCount: true },
  { href: "/cart",              label: "Cart",     Icon: ShoppingBag,  showCartCount: true },
  { href: "/account",           label: "Account",  Icon: User },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.variantIds.length);

  // Hide on admin & auth pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/admin-login") || pathname.startsWith("/login")) {
    return null;
  }

  return (
    <>
      {/* Spacer so page content isn't hidden behind the nav */}
      <div className="lg:hidden h-16" aria-hidden />

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 border-t shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
        style={{ background: "white", borderColor: "var(--color-parchment)" }}
        aria-label="Primary"
      >
        {TABS.map(({ href, label, Icon, ...meta }) => {
          const active = isActive(pathname, href);
          const count =
            ("showCartCount" in meta && meta.showCartCount && cartCount) ||
            ("showWishlistCount" in meta && meta.showWishlistCount && wishlistCount) ||
            0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 h-16 transition-colors active:bg-cream",
              )}
              style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon
                  className={cn("h-5 w-5", active && "fill-current")}
                  style={{ fill: active && (label === "Wishlist" || label === "Home") ? "currentColor" : undefined }}
                />
                {count > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
                    style={{ background: "var(--color-primary)", color: "white" }}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-body font-medium">{label}</span>
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full"
                  style={{ background: "var(--color-primary)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
