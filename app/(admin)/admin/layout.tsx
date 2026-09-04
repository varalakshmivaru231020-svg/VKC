"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Tag, BarChart3, Settings, Palette, Image,
  LogOut, Menu, X, Ticket, Bell, Search,
  ChevronRight, Store, Truck, BookOpen, FileText,
  Megaphone, Globe, Star, Heart,
  ChevronDown, ChevronUp, Layers, Shield, Boxes,
  Video, Facebook,
  MessageSquareQuote,
} from "lucide-react";

// ── Sidebar counts hook ───────────────────────────────────────────────────────
interface SidebarCounts {
  pendingOrders?: number;
  customers?: number;
  pendingVideoBookings?: number;
}

function useSidebarCounts() {
  const [counts, setCounts] = useState<SidebarCounts>({});

  useEffect(() => {
    let cancelled = false;
    async function fetchCounts() {
      try {
        const res = await fetch("/api/admin/sidebar-counts");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCounts(data);
        }
      } catch { /* silent */ }
    }
    fetchCounts();
    // Refresh every 60s
    const interval = setInterval(fetchCounts, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return counts;
}

// ── Sub-item type ─────────────────────────────────────────────────────────────
interface NavSubItem { href: string; label: string }
interface NavItemDef {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  children?: NavSubItem[];
  countKey?: keyof SidebarCounts;       // maps to a count field
  badgeVariant?: "default" | "warning"; // warning = pending items
}
interface NavGroupDef { title: string; items: NavItemDef[] }

// Hrefs accessible to STAFF role
const STAFF_ALLOWED = new Set([
  "/admin/orders", "/admin/shipments", "/admin/customers", "/admin/reviews",
]);

const navGroups: NavGroupDef[] = [
  {
    title: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      {
        href: "/admin/orders",
        label: "Orders",
        icon: ShoppingCart,
        countKey: "pendingOrders",
        badgeVariant: "warning",
        children: [
          { href: "/admin/orders",                    label: "All Orders" },
          { href: "/admin/orders?status=PENDING",     label: "Pending" },
          { href: "/admin/orders?status=CONFIRMED",   label: "Confirmed" },
          { href: "/admin/orders?status=PROCESSING",  label: "Processing" },
          { href: "/admin/orders?status=SHIPPED",     label: "Shipped" },
          { href: "/admin/orders?status=DELIVERED",   label: "Delivered" },
          { href: "/admin/orders?status=CANCELLED",   label: "Cancelled" },
          { href: "/admin/orders?status=RETURN_REQUESTED", label: "Returns" },
        ],
      },
      { href: "/admin/shipments", label: "Shipments",  icon: Truck },
      { href: "/admin/customers", label: "Customers",  icon: Users,  countKey: "customers" },
      { href: "/admin/reviews",   label: "Reviews",    icon: Star },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/products",   label: "Products",   icon: Package },
    ],
  },
  {
    title: "Inventory",
    items: [
      { href: "/admin/stock", label: "Stock Update", icon: Boxes },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/coupons",          label: "Coupons",          icon: Ticket },
      { href: "/admin/banners",          label: "Banners",          icon: Image },
      { href: "/admin/hero-slides",      label: "Hero Slides",      icon: Store },
      { href: "/admin/popup",            label: "Popup",            icon: Megaphone },
      { href: "/admin/cart-history",     label: "Cart History",     icon: ShoppingCart },
      { href: "/admin/wishlist-history", label: "Wishlist History", icon: Heart },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/blogs",           label: "Blogs",           icon: BookOpen },
      { href: "/admin/testimonials",    label: "Testimonials",    icon: MessageSquareQuote },
      { href: "/admin/gallery",         label: "Gallery",         icon: Image },
      { href: "/admin/videos",          label: "Videos",          icon: Video },
      { href: "/admin/facebook-videos", label: "Facebook Videos", icon: Facebook },
      { href: "/admin/pages",           label: "CMS Pages",       icon: FileText },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/admin/roles",   label: "Roles & Permissions", icon: Shield },
      { href: "/admin/design",  label: "Design & Branding",   icon: Palette },
      { href: "/admin/settings",label: "Settings",            icon: Settings },
    ],
  },
];

// ── Count Badge ───────────────────────────────────────────────────────────────
function CountBadge({ count, variant = "default" }: { count?: number; variant?: "default" | "warning" }) {
  if (!count || count <= 0) return null;
  const display = count > 999 ? "999+" : String(count);
  const colors = variant === "warning"
    ? { bg: "#FEF3C7", text: "#92400E" }
    : { bg: "#F3F4F6", text: "#6B7280" };
  return (
    <span
      className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold font-body leading-none"
      style={{ background: colors.bg, color: colors.text }}
    >
      {display}
    </span>
  );
}

// ── NavItem (supports collapsible sub-menu) ───────────────────────────────────
function NavItem({ href, label, icon: Icon, exact, children, countKey, badgeVariant, counts }: NavItemDef & { counts: SidebarCounts }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href) && href !== "/admin";
  const hasChildren = !!children?.length;
  const [open, setOpen] = useState(() => pathname.startsWith(href) && href !== "/admin");
  const badgeCount = countKey ? counts[countKey] : undefined;

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={href}
          className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group"
          style={{
            background: active ? "#F3F4F6" : "transparent",
            color: active ? "#111827" : "#6B7280",
          }}
          onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; (e.currentTarget as HTMLElement).style.color = "#374151"; } }}
          onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; } }}
        >
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
              style={{ background: "var(--color-primary)" }} />
          )}
          <Icon className="h-4 w-4 shrink-0" style={{ color: active ? "var(--color-primary)" : "inherit" }} />
          <span className="flex-1 font-body">{label}</span>
          <CountBadge count={badgeCount} variant={badgeVariant} />
        </Link>
        {hasChildren && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 shrink-0"
            style={{ color: "#9CA3AF" }}
          >
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className="ml-7 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: "#E5E7EB" }}>
          {children!.map((sub) => {
            const subActive = pathname + (typeof window !== "undefined" ? window.location.search : "") === sub.href
              || (sub.href === "/admin/orders" && pathname === "/admin/orders" && !window?.location?.search?.includes("status"));
            return (
              <Link
                key={sub.href}
                href={sub.href}
                className="block px-2 py-1.5 rounded-md text-xs font-body font-medium transition-colors"
                style={{
                  color: subActive ? "var(--color-primary)" : "#6B7280",
                  background: subActive ? "var(--color-primary-50, #fdf4f4)" : "transparent",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#374151"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = subActive ? "var(--color-primary)" : "#6B7280"; }}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname  = usePathname();
  const { data: session } = useSession();
  const userName  = session?.user?.name ?? "Admin";
  const initials  = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const isStaff   = (session?.user as any)?.role === "STAFF";
  const counts    = useSidebarCounts();

  // For STAFF: only show Operations group with allowed items
  const visibleGroups = isStaff
    ? navGroups
        .map((g) => ({ ...g, items: g.items.filter((i) => STAFF_ALLOWED.has(i.href)) }))
        .filter((g) => g.items.length > 0)
    : navGroups;

  const currentPage = visibleGroups
    .flatMap((g) => g.items)
    .find((n) => n.exact ? pathname === n.href : pathname.startsWith(n.href) && n.href !== "/admin");

  return (
    <div className="flex min-h-screen" style={{ background: "#F3F4F6" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "white", borderRight: "1px solid #E5E7EB" }}
      >
        {/* Logo */}
        <div className="px-5 h-16 flex items-center justify-between border-b shrink-0" style={{ borderColor: "#E5E7EB" }}>
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--color-primary)" }}>
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold font-body truncate" style={{ color: "#111827" }}>vkcgoldikshu</p>
              <p className="text-[10px] font-body" style={{ color: "#9CA3AF" }}>Admin Panel</p>
            </div>
          </Link>
          <button className="lg:hidden h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5 font-body"
                style={{ color: "#9CA3AF" }}>
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.href} {...item} counts={counts} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t space-y-0.5 shrink-0" style={{ borderColor: "#E5E7EB" }}>
          <Link href="/" target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <Store className="h-4 w-4 shrink-0" /> View Store
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all text-gray-400 hover:text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4 shrink-0" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 h-16 px-6 flex items-center justify-between gap-4 shrink-0"
          style={{ background: "white", borderBottom: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-1.5 text-sm font-body">
              <span style={{ color: "#9CA3AF" }}>Admin</span>
              {currentPage && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" style={{ color: "#D1D5DB" }} />
                  <span className="font-medium" style={{ color: "#111827" }}>{currentPage.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-body"
              style={{ borderColor: "#E5E7EB", color: "#9CA3AF", background: "#F9FAFB" }}>
              <Search className="h-4 w-4 shrink-0" />
              <span className="text-sm">Search…</span>
            </div>
            <button className="relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100">
              <Bell className="h-4 w-4" style={{ color: "#6B7280" }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--color-error)" }} />
            </button>
            <UserMenu userName={userName} initials={initials} email={session?.user?.email ?? ""} />
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function UserMenu({ userName, initials, email }: { userName: string; initials: string; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold font-body shrink-0 transition-transform hover:scale-105"
        style={{ background: "var(--color-primary)", color: "white" }}
        title={userName}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 overflow-hidden"
          style={{ background: "white", borderColor: "#E5E7EB" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
            <p className="text-sm font-semibold font-body truncate" style={{ color: "#111827" }}>{userName}</p>
            {email && <p className="text-xs font-body truncate" style={{ color: "#6B7280" }}>{email}</p>}
          </div>
          <Link href="/admin/settings" onClick={() => setOpen(false)} role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-body hover:bg-gray-50 transition-colors" style={{ color: "#374151" }}>
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <Link href="/" target="_blank" onClick={() => setOpen(false)} role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-body hover:bg-gray-50 transition-colors" style={{ color: "#374151" }}>
            <Store className="h-4 w-4" /> View store
          </Link>
          <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/admin/login" }); }} role="menuitem"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body transition-colors hover:bg-red-50 border-t"
            style={{ color: "#DC2626", borderColor: "#E5E7EB" }}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
