"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search, Heart, ShoppingBag, User, Menu, X, ChevronDown,
  LogOut,
} from "lucide-react";
import { InstagramIcon, FacebookIcon, YouTubeIcon } from "@/components/ui/SocialIcons";
import { AnimatePresence, motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useCartStore, useWishlistStore } from "@/lib/store/cart";
import { useUIStore } from "@/lib/store/ui";

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}

// ── Static nav links — dynamic category items are spliced in between ──────────

const NAV_BEFORE = [{ label: "Home", href: "/" }];

const NAV_AFTER = [
  { label: "Shop",     href: "/shop" },
  { label: "About Us", href: "/about" },
  { label: "Gallery",  href: "/gallery" },
  { label: "Contact",  href: "/contact" },
];

// ── Animation variants ─────────────────────────────────────────────────────────

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
  "flex items-center gap-1 px-3 h-11 text-[13.5px] font-medium font-body transition-all duration-150 relative whitespace-nowrap select-none";

// ── Header ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  siteName?: string;
  logoUrl?: string | null;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  navCategories?: NavCategory[];
  whatsappNumber?: string;
}

export function Header({ siteName = "vkcgoldikshu", logoUrl, instagram, facebook, youtube, navCategories = [], whatsappNumber }: HeaderProps) {
  const socialLinks = [
    { Icon: InstagramIcon, href: instagram, label: "Instagram" },
    { Icon: FacebookIcon,  href: facebook,  label: "Facebook" },
    { Icon: YouTubeIcon,   href: youtube,   label: "YouTube" },
  ].filter((s): s is { Icon: typeof InstagramIcon; href: string; label: string } => Boolean(s.href));
  const pathname = usePathname();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted]       = useState(false);

  const { openCart, openLoginModal } = useUIStore();
  const cartCount     = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.variantIds.length);
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : (pathname === href || pathname.startsWith(href + "?") || pathname.startsWith(href + "/"));

  const iconBtnCls   = "relative h-10 w-10 flex items-center justify-center rounded-lg transition-all duration-150";
  const iconBtnStyle = { color: "var(--color-text-muted)" };
  const iconHover    = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.background = "var(--color-primary-50)"; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "transparent"; },
  };

  // One logo element, rendered on the left for desktop and centred on mobile.
  // Emblem + wordmark. The approved VKC emblem stays exactly as uploaded; the
  // wordmark (site name, "vkcgoldikshu") carries the brand name so the header,
  // products and domain read as one brand. The emblem is allowed to run a few
  // pixels taller than the bar — its own artwork padding absorbs that.
  const logo = (
    <Link href="/" className="group flex items-center gap-2.5 sm:gap-3" aria-label={siteName}>
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="transition-opacity duration-200 group-hover:opacity-80 object-contain h-[60px] lg:h-[94px] w-auto mix-blend-multiply shrink-0"
          style={{ maxWidth: 200 }}
        />
      )}
      <span className={logoUrl ? "hidden sm:block leading-none" : "leading-none"}
        style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "clamp(1.35rem, 1.9vw, 1.9rem)", letterSpacing: "-0.01em", color: "var(--color-text-primary)" }}>
        {siteName}
      </span>
    </Link>
  );

  return (
    <>
      <header
        className={cn("sticky top-0 z-50 w-full transition-all duration-300", scrolled ? "shadow-[0_2px_24px_rgba(0,0,0,0.08)]" : "")}
        style={{ background: scrolled ? "rgba(251,248,243,0.96)" : "var(--color-ivory)", backdropFilter: scrolled ? "blur(12px)" : "none" }}
      >
        {/* ── Single-row bar: logo · nav · actions ── */}
        <div className="border-b" style={{ borderColor: "var(--color-parchment)" }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 h-[68px] lg:h-[100px]">
              {/* Left — hamburger (mobile) / logo (desktop) */}
              <div className="flex items-center gap-1 lg:min-w-0">
                <button className={cn(iconBtnCls, "lg:hidden")} style={iconBtnStyle} {...iconHover}
                  onClick={() => setMobileOpen(true)} aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </button>
                <span className="hidden lg:block">{logo}</span>
              </div>

              {/* Center — logo (mobile) / nav (desktop), all in the same row */}
              <div className="flex-1 flex items-center justify-center min-w-0">
                <span className="lg:hidden">{logo}</span>
                <nav className="hidden lg:flex items-center justify-center">
                  {NAV_BEFORE.map((item) => (
                    <DesktopNavLink key={item.href} href={item.href} label={item.label} isActive={isActive(item.href)} />
                  ))}
                  {navCategories.map((cat) => (
                    <div key={cat.id} className="relative group">
                      <Link
                        href={`/category/${cat.slug}`}
                        className={NAV_LINK_CLS}
                        style={{ color: isActive(`/category/${cat.slug}`) ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                      >
                        {cat.name}
                        {cat.children.length > 0 && <ChevronDown className="h-3 w-3 shrink-0" />}
                      </Link>
                      {cat.children.length > 0 && (
                        <div className="absolute left-0 top-full pt-2 hidden group-hover:block min-w-[140px] w-max z-10">
                          <div className="rounded-lg overflow-hidden py-1" style={{ background: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}>
                            {cat.children.map((child) => (
                              <Link
                                key={child.id}
                                href={`/category/${child.slug}`}
                                className="block px-4 py-2.5 text-[14px] font-medium font-body whitespace-nowrap transition-colors duration-300"
                                style={{ color: isActive(`/category/${child.slug}`) ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.background = "var(--color-cream)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = isActive(`/category/${child.slug}`) ? "var(--color-primary)" : "var(--color-text-secondary)"; e.currentTarget.style.background = "transparent"; }}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {NAV_AFTER.map((item) => (
                    <DesktopNavLink key={item.href} href={item.href} label={item.label} isActive={isActive(item.href)} />
                  ))}
                </nav>
              </div>

              {/* Right — actions */}
              <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                <button onClick={() => setSearchOpen(true)} className={iconBtnCls} style={iconBtnStyle} {...iconHover} aria-label="Search">
                  <Search className="h-5 w-5" />
                </button>
                {/* Wishlist — hidden on mobile; works for guests, stored client-side */}
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
                    placeholder="Search jaggery, syrups, gift boxes…"
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
                    {["Jaggery Cubes", "Jaggery Powder", "Gift Boxes", "Syrups", "Energy Bites"].map((tag) => (
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
                  <>
                    <button onClick={() => { setMobileOpen(false); openLoginModal(); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all w-full text-left"
                      style={{ background: "var(--color-primary-50)", color: "var(--color-primary)", borderRadius: "8px" }}>
                      <User className="h-4 w-4 shrink-0" />
                      Sign In / Create Account
                    </button>
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
                )}
              </div>

              {/* Nav items — scrollable */}
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                {NAV_BEFORE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-3 rounded-lg text-[15px] font-body font-medium transition-all"
                    style={{
                      color: isActive(item.href) ? "var(--color-primary)" : "var(--color-text-primary)",
                      background: isActive(item.href) ? "var(--color-primary-50)" : "transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
                {navCategories.map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-3 rounded-lg text-[15px] font-body font-medium transition-all"
                      style={{
                        color: isActive(`/category/${cat.slug}`) ? "var(--color-primary)" : "var(--color-text-primary)",
                        background: isActive(`/category/${cat.slug}`) ? "var(--color-primary-50)" : "transparent",
                      }}
                    >
                      {cat.name}
                    </Link>
                    {cat.children.length > 0 && (
                      <div className="pl-4 space-y-0.5">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="block px-3 py-2 rounded-lg text-[13px] font-body transition-all"
                            style={{
                              color: isActive(`/category/${child.slug}`) ? "var(--color-primary)" : "var(--color-text-secondary)",
                              background: isActive(`/category/${child.slug}`) ? "var(--color-primary-50)" : "transparent",
                            }}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {NAV_AFTER.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-3 rounded-lg text-[15px] font-body font-medium transition-all"
                    style={{
                      color: isActive(item.href) ? "var(--color-primary)" : "var(--color-text-primary)",
                      background: isActive(item.href) ? "var(--color-primary-50)" : "transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
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
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                      className="h-8 w-8 flex items-center justify-center rounded-lg transition-transform duration-200 hover:scale-110"
                      style={{ background: "var(--color-cream)" }}>
                      <Icon className="h-4.5 w-4.5" />
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

// ── Desktop nav helper ────────────────────────────────────────────────────────

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
