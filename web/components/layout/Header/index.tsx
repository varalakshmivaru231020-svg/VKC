"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search, Heart, ShoppingBag, User, Menu, X,
  ChevronDown, ChevronRight, Instagram, Facebook, Youtube, LogOut,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useCartStore, useWishlistStore } from "@/lib/store/cart";
import { useUIStore } from "@/lib/store/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  children: NavCategory[];
}

// ── Static fallback nav ────────────────────────────────────────────────────────

const FALLBACK_COLLECTIONS = [
  { label: "Kanjivaram",    href: "/category/kanjivaram",  desc: "Royal silk from Tamil Nadu" },
  { label: "Banarasi",      href: "/category/banarasi",    desc: "Opulent brocades from Varanasi" },
  { label: "Patola",        href: "/category/patola",      desc: "Double ikat from Gujarat" },
  { label: "Chanderi",      href: "/category/chanderi",    desc: "Gossamer weaves from MP" },
  { label: "Tussar Silk",   href: "/category/tussar-silk", desc: "Wild silk with texture" },
  { label: "Cotton Sarees", href: "/category/cotton",      desc: "Breathable everyday grace" },
];

const SHOP_CHILDREN = [
  { label: "All Sarees",  href: "/shop",                   desc: "Browse the full catalogue" },
  { label: "Wedding",     href: "/shop?occasion=wedding",  desc: "Timeless bridal elegance" },
  { label: "Festival",    href: "/shop?occasion=festival", desc: "Celebrate every occasion" },
  { label: "Party Wear",  href: "/shop?occasion=party",    desc: "Make every entrance count" },
  { label: "Daily Wear",  href: "/shop?occasion=daily",    desc: "Effortless everyday looks" },
  { label: "Sale",        href: "/shop?sale=true",         desc: "Great deals on fine weaves" },
];

const socialLinks = [
  { Icon: Instagram, href: "#", label: "Instagram" },
  { Icon: Facebook,  href: "#", label: "Facebook" },
  { Icon: Youtube,   href: "#", label: "YouTube" },
];

// ── Animation variants ─────────────────────────────────────────────────────────

const dropdownV = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12, ease: "easeIn" } },
};

const itemV = {
  hidden:  { opacity: 0, x: -6 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.15, ease: "easeOut" } }),
};

const drawerV = {
  hidden:  { x: "100%" },
  visible: { x: 0,      transition: { type: "spring", damping: 28, stiffness: 280 } },
  exit:    { x: "100%", transition: { duration: 0.22, ease: "easeIn" } },
};

const overlayV = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};

// ── Nav link text style (shared) ──────────────────────────────────────────────

const NAV_LINK_CLS =
  "flex items-center gap-1 px-4 h-11 text-[13px] font-medium font-body transition-all duration-150 relative whitespace-nowrap select-none";

// ── MegaMenu (dropdown for a single top-level DB category) ───────────────────

function MegaMenu({ category, onClose }: { category: NavCategory; onClose: () => void }) {
  const l2 = category.children;
  const hasMega = l2.some((c) => c.children.length > 0);

  if (!hasMega) {
    return (
      <div
        className="rounded-xl overflow-hidden py-2"
        style={{
          background: "white",
          border: "1px solid var(--color-parchment)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          minWidth: 220,
        }}
      >
        <div className="h-0.5 mx-3 mb-2 rounded-full" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-gold))" }} />
        {l2.map((child, i) => (
          <motion.div key={child.id} custom={i} variants={itemV} initial="hidden" animate="visible">
            <Link
              href={`/category/${child.slug}`}
              onClick={onClose}
              className="flex items-start gap-3 px-4 py-2.5 transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary-50)"; e.currentTarget.style.color = "var(--color-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
            >
              <div>
                <p className="text-sm font-semibold font-body leading-tight whitespace-nowrap">{child.name}</p>
                {child.description && <p className="text-xs font-body mt-0.5 leading-tight" style={{ color: "var(--color-text-muted)" }}>{child.description}</p>}
              </div>
            </Link>
          </motion.div>
        ))}
        <div className="mt-1 pt-1 mx-4 border-t" style={{ borderColor: "var(--color-parchment)" }}>
          <Link
            href={`/category/${category.slug}`}
            onClick={onClose}
            className="flex items-center gap-1 py-2 text-xs font-body font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            View All {category.name} <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  const cols = Math.min(l2.length, 5);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "white",
        border: "1px solid var(--color-parchment)",
        boxShadow: "0 16px 60px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
        minWidth: cols * 172 + 48,
        maxWidth: "80vw",
      }}
    >
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-gold), var(--color-primary))" }} />
      <div className="p-5">
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${cols}, minmax(160px, 1fr))` }}>
          {l2.map((l2cat, ci) => (
            <motion.div key={l2cat.id} custom={ci} variants={itemV} initial="hidden" animate="visible" className="space-y-2">
              <Link href={`/category/${l2cat.slug}`} onClick={onClose} className="block group">
                <p
                  className="text-[12px] font-semibold font-body uppercase tracking-wider pb-2 border-b group-hover:text-primary transition-colors"
                  style={{ color: "var(--color-text-primary)", borderColor: "var(--color-parchment)" }}
                >
                  {l2cat.name}
                </p>
              </Link>
              {l2cat.children.length > 0 && (
                <ul className="space-y-1">
                  {l2cat.children.map((l3) => (
                    <li key={l3.id}>
                      <Link
                        href={`/category/${l3.slug}`}
                        onClick={onClose}
                        className="text-sm font-body transition-colors"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)"; }}
                      >
                        {l3.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={`/category/${l2cat.slug}`}
                      onClick={onClose}
                      className="text-xs font-body font-medium flex items-center gap-0.5"
                      style={{ color: "var(--color-primary)" }}
                    >
                      View All <ChevronRight className="h-3 w-3" />
                    </Link>
                  </li>
                </ul>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--color-parchment)" }}>
          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>{category.name} Collection</p>
          <Link
            href={`/category/${category.slug}`}
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-body font-semibold hover:gap-1.5 transition-all"
            style={{ color: "var(--color-primary)" }}
          >
            Browse All {category.name} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Simple list dropdown ───────────────────────────────────────────────────────

function SimpleDropdown({
  items,
  onClose,
}: {
  items: Array<{ label?: string; name?: string; href?: string; slug?: string; desc?: string }>;
  onClose: () => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden py-2"
      style={{
        background: "white",
        border: "1px solid var(--color-parchment)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        minWidth: 220,
      }}
    >
      <div className="h-0.5 mx-3 mb-2 rounded-full" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-gold))" }} />
      {items.map((item, i) => {
        const label = item.label ?? item.name ?? "";
        const href  = item.href ?? (item.slug ? `/category/${item.slug}` : "#");
        return (
          <motion.div key={label} custom={i} variants={itemV} initial="hidden" animate="visible">
            <Link
              href={href}
              onClick={onClose}
              className="flex flex-col px-4 py-2.5 transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary-50)"; e.currentTarget.style.color = "var(--color-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
            >
              <span className="text-sm font-semibold font-body whitespace-nowrap">{label}</span>
              {item.desc && <span className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{item.desc}</span>}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Mobile accordion item ─────────────────────────────────────────────────────

function MobileNavItem({
  label, href, children, close,
}: {
  label: string; href: string;
  children?: Array<{ id?: string; label?: string; name?: string; href?: string; slug?: string; children?: any[] }>;
  close: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = href !== "#" && (pathname === href || pathname.startsWith(href + "/"));

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={href}
          onClick={children?.length ? undefined : close}
          className="flex-1 px-3 py-3 rounded-lg text-[15px] font-body font-medium transition-all"
          style={{ color: active ? "var(--color-primary)" : "var(--color-text-primary)", background: active ? "var(--color-primary-50)" : "transparent" }}
        >
          {label}
        </Link>
        {children?.length ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-10 w-10 flex items-center justify-center rounded-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ display: "inline-flex" }}>
              <ChevronRight className="h-4 w-4" />
            </motion.span>
          </button>
        ) : null}
      </div>
      {children?.length && open ? (
        <div className="pl-4 pb-1 space-y-0.5">
          {children.map((child) => {
            const childLabel = child.label ?? child.name ?? "";
            const childHref  = child.href ?? (child.slug ? `/category/${child.slug}` : "#");
            const l3         = (child as any).children as NavCategory[] | undefined;
            return (
              <div key={child.id ?? childLabel}>
                <Link
                  href={childHref}
                  onClick={close}
                  className="block px-3 py-2 rounded-lg text-sm font-body font-medium transition-all"
                  style={{ color: "var(--color-text-secondary)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.background = "var(--color-primary-50)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.background = "transparent"; }}
                >
                  {childLabel}
                </Link>
                {l3?.length ? (
                  <div className="pl-4 space-y-0.5">
                    {l3.map((l3item) => (
                      <Link
                        key={l3item.id}
                        href={`/category/${l3item.slug}`}
                        onClick={close}
                        className="block px-3 py-1.5 text-xs font-body rounded-lg transition-all"
                        style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
                      >
                        {l3item.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  siteName?: string;
  logoUrl?: string | null;
  navCategories?: NavCategory[];
}

export function Header({ siteName = "Vijaylakshmi", logoUrl, navCategories = [] }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mounted, setMounted]           = useState(false);
  const [visibleCount, setVisibleCount] = useState(navCategories.length);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const navRef     = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const { openCart, openLoginModal } = useUIStore();
  const cartCount     = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.variantIds.length);
  const useDynamic    = navCategories.length > 0;
  const { data: session } = useSession();
  const isLoggedIn    = mounted && !!session;
  const userInitial   = session?.user?.name?.trim()[0]?.toUpperCase() ?? null;

  // Scroll listener
  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawers on navigation
  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);

  // Overflow detection: how many categories fit before "More" is needed
  useEffect(() => {
    if (!useDynamic || !navRef.current || !measureRef.current) {
      setVisibleCount(navCategories.length);
      return;
    }

    const calculate = () => {
      if (!navRef.current || !measureRef.current) return;
      const nav      = navRef.current;
      const measurer = measureRef.current;
      const navW     = nav.offsetWidth;

      const getW = (sel: string): number =>
        (measurer.querySelector(sel) as HTMLElement | null)?.offsetWidth ?? 0;

      // Static items on each side
      const staticW =
        getW("[data-m='new-arrivals']") +
        getW("[data-m='shop']") +
        getW("[data-m='our-story']") +
        getW("[data-m='contact']");

      const moreW = getW("[data-m='more']");

      // Widths of each category item
      const catWidths = navCategories.map((_, i) =>
        getW(`[data-m='cat-${i}']`)
      );

      const totalCatW = catWidths.reduce((a, b) => a + b, 0);

      // If everything fits → show all
      if (staticW + totalCatW <= navW) {
        setVisibleCount(navCategories.length);
        return;
      }

      // Not all fit → reserve space for "More" button
      const available = navW - staticW - moreW;
      let used = 0, count = 0;
      for (let i = 0; i < catWidths.length; i++) {
        if (used + catWidths[i] <= available) {
          used += catWidths[i];
          count++;
        } else break;
      }
      setVisibleCount(count);
    };

    calculate();
    // Re-run after fonts load so measurements use actual rendered widths
    document.fonts?.ready.then(calculate);
    const ro = new ResizeObserver(calculate);
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [useDynamic, navCategories]);

  const openMenu     = useCallback((key: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpenDropdown(key); }, []);
  const scheduleClose = useCallback(() => { closeTimer.current = setTimeout(() => setOpenDropdown(null), 120); }, []);
  const cancelClose  = useCallback(() => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const isActive     = (href: string) => href !== "#" && (pathname === href || pathname.startsWith(href + "?") || pathname.startsWith(href + "/"));

  const iconBtnCls   = "relative h-10 w-10 flex items-center justify-center rounded-lg transition-all duration-150";
  const iconBtnStyle = { color: "var(--color-text-muted)" };
  const iconHover    = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.background = "var(--color-primary-50)"; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "transparent"; },
  };

  const visibleCats  = navCategories.slice(0, visibleCount);
  const overflowCats = navCategories.slice(visibleCount);

  return (
    <>
      <header
        className={cn("sticky top-0 z-50 w-full transition-all duration-300", scrolled ? "shadow-[0_2px_24px_rgba(0,0,0,0.08)]" : "")}
        style={{ background: scrolled ? "rgba(251,248,243,0.96)" : "var(--color-ivory)", backdropFilter: scrolled ? "blur(12px)" : "none" }}
      >
        {/* ── Top bar ── */}
        <div className="border-b" style={{ borderColor: "var(--color-parchment)" }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 items-center h-[88px]">
              {/* Left — menu (mobile) / social (desktop) */}
              <div className="flex items-center gap-1">
                {/* Hamburger — mobile only, left side */}
                <button className={cn(iconBtnCls, "lg:hidden")} style={iconBtnStyle} {...iconHover}
                  onClick={() => setMobileOpen(true)} aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </button>
                {/* Social links — desktop only */}
                {socialLinks.map(({ Icon, href, label }) => (
                  <a key={label} href={href} aria-label={label}
                    className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.background = "var(--color-primary-50)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "transparent"; }}>
                    <Icon className="h-4.5 w-4.5" />
                  </a>
                ))}
              </div>

              {/* Center — logo */}
              <div className="flex justify-center">
                <Link href="/" className="group flex flex-col items-center gap-0.5">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={siteName}
                      className="transition-opacity duration-200 group-hover:opacity-75 object-contain"
                      style={{ maxHeight: 72, maxWidth: 280 }}
                    />
                  ) : (
                    <span className="tracking-wide transition-opacity duration-200 group-hover:opacity-75 leading-none"
                      style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--weight-heading)", fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: "var(--color-primary)" }}>
                      {siteName}
                    </span>
                  )}
                  <span className="block h-px w-10 transition-all duration-300 group-hover:w-16"
                    style={{ background: "linear-gradient(90deg, transparent, var(--color-gold), transparent)" }} />
                </Link>
              </div>

              {/* Right — actions */}
              <div className="flex items-center justify-end gap-0.5">
                <button onClick={() => setSearchOpen(true)} className={iconBtnCls} style={iconBtnStyle} {...iconHover} aria-label="Search">
                  <Search className="h-5 w-5" />
                </button>
                {/* Wishlist — hidden on mobile */}
                {isLoggedIn ? (
                  <Link href="/account/wishlist" className={cn(iconBtnCls, "hidden sm:flex")} style={iconBtnStyle} {...iconHover} aria-label="Wishlist">
                    <Heart className="h-5 w-5" />
                    <AnimatePresence>
                      {mounted && wishlistCount > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full text-white text-[9px] font-bold"
                          style={{ background: "var(--color-primary)" }}>
                          {wishlistCount > 9 ? "9+" : wishlistCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                ) : (
                  <button onClick={() => openLoginModal()} className={cn(iconBtnCls, "hidden sm:flex")} style={iconBtnStyle} {...iconHover} aria-label="Wishlist">
                    <Heart className="h-5 w-5" />
                  </button>
                )}
                <button onClick={openCart} className={iconBtnCls} style={iconBtnStyle} {...iconHover} aria-label="Cart">
                  <ShoppingBag className="h-5 w-5" />
                  <AnimatePresence>
                    {mounted && cartCount > 0 && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full text-white text-[9px] font-bold"
                        style={{ background: "var(--color-primary)" }}>
                        {cartCount > 9 ? "9+" : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                {/* Account — hidden on mobile */}
                {isLoggedIn ? (
                  <Link href="/account" className={cn(iconBtnCls, "hidden sm:flex")} style={iconBtnStyle} {...iconHover} aria-label="My Account">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{ background: "var(--color-primary)", color: "white", fontFamily: "var(--font-heading)" }}
                    >
                      {userInitial ?? <User className="h-4 w-4" />}
                    </div>
                  </Link>
                ) : (
                  <button onClick={() => openLoginModal()} className={cn(iconBtnCls, "hidden sm:flex")} style={iconBtnStyle} {...iconHover} aria-label="Sign In">
                    <User className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop nav bar ── */}
        <div className="hidden lg:block border-b" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <nav ref={navRef} className="flex items-center justify-center h-11">

              {/* ── New Arrivals (always visible) ── */}
              <DesktopNavLink href="/new-arrivals" label="New Arrivals" isActive={isActive("/new-arrivals")} />

              {useDynamic ? (
                <>
                  {/* Visible categories */}
                  {visibleCats.map((cat) => (
                    <div key={cat.id} className="relative"
                      onMouseEnter={() => cat.children.length ? openMenu(cat.id) : cancelClose()}
                      onMouseLeave={scheduleClose}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className={NAV_LINK_CLS}
                        style={{ color: isActive(`/category/${cat.slug}`) ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isActive(`/category/${cat.slug}`) ? "var(--color-primary)" : "var(--color-text-secondary)"; }}
                      >
                        {cat.name}
                        {cat.children.length > 0 && (
                          <motion.span animate={{ rotate: openDropdown === cat.id ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "inline-flex" }}>
                            <ChevronDown className="h-3.5 w-3.5" />
                          </motion.span>
                        )}
                        {isActive(`/category/${cat.slug}`) && (
                          <motion.span layoutId="nav-underline" className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                            style={{ background: "var(--color-primary)" }} transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                        )}
                      </Link>
                      <AnimatePresence>
                        {cat.children.length > 0 && openDropdown === cat.id && (
                          <motion.div key={cat.id} variants={dropdownV} initial="hidden" animate="visible" exit="exit"
                            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
                            onMouseEnter={cancelClose} onMouseLeave={scheduleClose}
                            style={{ transformOrigin: "top center" }}>
                            <MegaMenu category={cat} onClose={() => setOpenDropdown(null)} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* ── More dropdown (overflow categories) ── */}
                  {overflowCats.length > 0 && (
                    <div className="relative"
                      onMouseEnter={() => openMenu("__more__")}
                      onMouseLeave={scheduleClose}>
                      <button
                        className={cn(NAV_LINK_CLS, "cursor-pointer")}
                        style={{ color: overflowCats.some(c => isActive(`/category/${c.slug}`)) ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
                        onMouseLeave={(e) => {
                          const hasActive = overflowCats.some(c => isActive(`/category/${c.slug}`));
                          (e.currentTarget as HTMLElement).style.color = hasActive ? "var(--color-primary)" : "var(--color-text-secondary)";
                        }}>
                        More
                        <motion.span animate={{ rotate: openDropdown === "__more__" ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "inline-flex" }}>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {openDropdown === "__more__" && (
                          <motion.div key="more" variants={dropdownV} initial="hidden" animate="visible" exit="exit"
                            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
                            onMouseEnter={cancelClose} onMouseLeave={scheduleClose}
                            style={{ transformOrigin: "top center" }}>
                            <SimpleDropdown
                              items={overflowCats.map(c => ({ name: c.name, slug: c.slug }))}
                              onClose={() => setOpenDropdown(null)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              ) : (
                /* ── Fallback: hardcoded Collections + Shop ── */
                <>
                  <DesktopNavDropdown
                    label="Collections" href="#"
                    isActive={false}
                    items={FALLBACK_COLLECTIONS}
                    openDropdown={openDropdown}
                    openMenu={openMenu} cancelClose={cancelClose} scheduleClose={scheduleClose}
                    onClose={() => setOpenDropdown(null)}
                  />
                </>
              )}

              {/* ── Shop (always visible) ── */}
              <DesktopNavLink href="/shop" label="Shop" isActive={isActive("/shop")} />

              {/* ── Our Story / Contact (always visible) ── */}
              <DesktopNavLink href="/about"   label="Our Story" isActive={isActive("/about")} />
              <DesktopNavLink href="/contact" label="Contact"   isActive={isActive("/contact")} />
            </nav>
          </div>
        </div>

        {/* ── Hidden measurement div (fixed off-screen so it never adds to scroll width) ── */}
        <div
          ref={measureRef}
          aria-hidden="true"
          style={{ position: "fixed", visibility: "hidden", display: "flex", top: 0, left: "-9999px", pointerEvents: "none", zIndex: -1 }}
        >
          <div data-m="new-arrivals" className={NAV_LINK_CLS}>New Arrivals</div>
          <div data-m="more"         className={NAV_LINK_CLS}>More <ChevronDown className="h-3.5 w-3.5" /></div>
          <div data-m="shop"         className={NAV_LINK_CLS}>Shop <ChevronDown className="h-3.5 w-3.5" /></div>
          <div data-m="our-story"    className={NAV_LINK_CLS}>Our Story</div>
          <div data-m="contact"      className={NAV_LINK_CLS}>Contact</div>
          {navCategories.map((cat, i) => (
            <div key={cat.id} data-m={`cat-${i}`} className={NAV_LINK_CLS}>
              {cat.name}
              {cat.children.length > 0 && <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          ))}
        </div>
      </header>

      {/* ── Search overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div key="search-bg" variants={overlayV} initial="hidden" animate="visible" exit="exit"
              className="fixed inset-0 z-[60]"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
              onClick={() => setSearchOpen(false)} />
            <motion.div key="search-panel"
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-4 inset-x-0 mx-auto z-[70] w-full max-w-2xl px-4">
              <div className="rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: "var(--color-ivory)", border: "1px solid var(--color-parchment)" }}
                onClick={(e) => e.stopPropagation()}>
                <form
                  className="flex items-center gap-2 px-4 py-3 border-b"
                  style={{ borderColor: "var(--color-parchment)" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.currentTarget.querySelector("input[name='q']") as HTMLInputElement);
                    const v = input?.value.trim();
                    if (v) window.location.href = `/shop?q=${encodeURIComponent(v)}`;
                  }}
                >
                  <Search className="h-5 w-5 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                  <input
                    autoFocus
                    name="q"
                    type="text"
                    placeholder="Search sarees, fabrics, occasions…"
                    className="flex-1 min-w-0 text-base font-body bg-transparent outline-none"
                    style={{ color: "var(--color-text-primary)" }}
                    onKeyDown={(e) => { if (e.key === "Escape") setSearchOpen(false); }}
                  />
                  <button
                    type="submit"
                    className="shrink-0 h-9 px-4 rounded-lg text-xs font-body font-semibold transition-colors"
                    style={{ background: "var(--color-primary)", color: "white" }}
                  >
                    Search
                  </button>
                  <button type="button" onClick={() => setSearchOpen(false)}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-opacity hover:opacity-60">
                    <X className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                  </button>
                </form>
                <div className="p-5">
                  <p className="text-xs font-body font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>Popular Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {["Kanjivaram Silk", "Banarasi", "Wedding Sarees", "Cotton Sarees", "Patola"].map((tag) => (
                      <Link key={tag} href={`/shop?q=${encodeURIComponent(tag)}`} onClick={() => setSearchOpen(false)}
                        className="px-3.5 py-2 text-sm font-body font-medium rounded-full border transition-all hover:scale-105"
                        style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)", background: "var(--color-cream)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-parchment)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="drawer-bg" variants={overlayV} initial="hidden" animate="visible" exit="exit"
              className="fixed inset-0 z-[60]" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
              onClick={() => setMobileOpen(false)} />
            <motion.div key="drawer" variants={drawerV} initial="hidden" animate="visible" exit="exit"
              className="fixed inset-y-0 right-0 z-[70] w-80 flex flex-col shadow-2xl"
              style={{ background: "var(--color-ivory)" }}>

              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--color-parchment)" }}>
                <span className="text-xl" style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontWeight: "var(--weight-heading)" }}>Menu</span>
                <button onClick={() => setMobileOpen(false)}
                  className="h-9 w-9 flex items-center justify-center rounded-full transition-colors hover:bg-primary-50"
                  style={{ color: "var(--color-text-muted)" }}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Account + Wishlist — always at top */}
              <div className="px-3 pt-3 pb-2 border-b shrink-0 space-y-1" style={{ borderColor: "var(--color-parchment)" }}>
                {isLoggedIn ? (
                  <>
                    <Link href="/account" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all"
                      style={{ color: "var(--color-text-primary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.background = "var(--color-primary-50)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; e.currentTarget.style.background = "transparent"; }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: "var(--color-primary)", color: "white" }}>
                        {userInitial ?? <User className="h-4 w-4" />}
                      </div>
                      My Account
                    </Link>
                    <Link href="/account/wishlist" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all"
                      style={{ color: "var(--color-text-primary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.background = "var(--color-primary-50)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; e.currentTarget.style.background = "transparent"; }}>
                      <Heart className="h-4 w-4 shrink-0" />
                      Wishlist
                      {mounted && wishlistCount > 0 && (
                        <span className="ml-auto h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: "var(--color-primary)" }}>{wishlistCount}</span>
                      )}
                    </Link>
                  </>
                ) : (
                  <button onClick={() => { setMobileOpen(false); openLoginModal(); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all w-full text-left"
                    style={{ background: "var(--color-primary-50)", color: "var(--color-primary)", borderRadius: "8px" }}>
                    <User className="h-4 w-4 shrink-0" />
                    Sign In / Create Account
                  </button>
                )}
              </div>

              {/* Nav items — scrollable */}
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                <MobileNavItem label="New Arrivals" href="/new-arrivals" close={() => setMobileOpen(false)} />
                {useDynamic
                  ? navCategories.map((cat, i) => (
                      <motion.div key={cat.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (i + 1) * 0.05, duration: 0.2, ease: "easeOut" }}>
                        <MobileNavItem label={cat.name} href={`/category/${cat.slug}`}
                          close={() => setMobileOpen(false)} children={cat.children} />
                      </motion.div>
                    ))
                  : FALLBACK_COLLECTIONS.map((c, i) => (
                      <motion.div key={c.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (i + 1) * 0.05, duration: 0.2, ease: "easeOut" }}>
                        <MobileNavItem label={c.label} href={c.href} close={() => setMobileOpen(false)} />
                      </motion.div>
                    ))}
                <MobileNavItem label="Shop" href="/shop" close={() => setMobileOpen(false)} />
                <MobileNavItem label="Our Story" href="/about"   close={() => setMobileOpen(false)} />
                <MobileNavItem label="Contact"   href="/contact" close={() => setMobileOpen(false)} />
              </nav>

              {/* Footer — sign out (if logged in) + social links */}
              <div className="px-5 py-4 border-t shrink-0 space-y-3" style={{ borderColor: "var(--color-parchment)" }}>
                {isLoggedIn && (
                  <button
                    onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-body font-semibold border transition-colors"
                    style={{ borderColor: "var(--color-error)", color: "var(--color-error)", background: "var(--color-error-bg)" }}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                  </button>
                )}
                <div className="flex items-center gap-3">
                  {socialLinks.map(({ Icon, href, label }) => (
                    <a key={label} href={href} aria-label={label}
                      className="h-8 w-8 flex items-center justify-center rounded-lg"
                      style={{ color: "var(--color-text-muted)", background: "var(--color-cream)" }}>
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Desktop nav helper components ─────────────────────────────────────────────

function DesktopNavLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link href={href} className={NAV_LINK_CLS}
      style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isActive ? "var(--color-primary)" : "var(--color-text-secondary)"; }}>
      {label}
      {isActive && (
        <motion.span layoutId="nav-underline" className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
          style={{ background: "var(--color-primary)" }} transition={{ type: "spring", stiffness: 380, damping: 30 }} />
      )}
    </Link>
  );
}

function DesktopNavDropdown({
  label, href, isActive, items, openDropdown, openMenu, cancelClose, scheduleClose, onClose,
}: {
  label: string; href: string; isActive: boolean;
  items: Array<{ label?: string; name?: string; href?: string; slug?: string; desc?: string }>;
  openDropdown: string | null;
  openMenu: (k: string) => void;
  cancelClose: () => void;
  scheduleClose: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative" onMouseEnter={() => openMenu(label)} onMouseLeave={scheduleClose}>
      <Link href={href} className={NAV_LINK_CLS}
        style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isActive ? "var(--color-primary)" : "var(--color-text-secondary)"; }}>
        {label}
        <motion.span animate={{ rotate: openDropdown === label ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "inline-flex" }}>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
        {isActive && (
          <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
            style={{ background: "var(--color-primary)" }} />
        )}
      </Link>
      <AnimatePresence>
        {openDropdown === label && (
          <motion.div key={label} variants={dropdownV} initial="hidden" animate="visible" exit="exit"
            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
            onMouseEnter={cancelClose} onMouseLeave={scheduleClose}
            style={{ transformOrigin: "top center" }}>
            <SimpleDropdown items={items} onClose={onClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
