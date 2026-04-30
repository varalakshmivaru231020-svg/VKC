"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Tag, BarChart3, Settings, Palette, Image,
  LogOut, Menu, X, Ticket, Bell, Search,
  ChevronRight, Store, Truck, BookOpen, FileText,
  Layers, Wallet, Megaphone, Globe, Heart,
} from "lucide-react";

const navGroups = [
  {
    title: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/shipments", label: "Shipments", icon: Truck },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/hero-slides", label: "Hero Slides", icon: Store },
      { href: "/admin/banners", label: "Banners", icon: Image },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
      { href: "/admin/popup", label: "Popup", icon: Megaphone },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/blogs", label: "Blogs", icon: BookOpen },
      { href: "/admin/pages", label: "CMS Pages", icon: FileText },
    ],
  },
  {
    title: "Customer Data",
    items: [
      { href: "/admin/cart-history", label: "Cart History", icon: ShoppingCart },
      { href: "/admin/wishlist-history", label: "Wishlist History", icon: Heart },
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
      { href: "/admin/design", label: "Design & Branding", icon: Palette },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavItem({ href, label, icon: Icon, exact }: { href: string; label: string; icon: any; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group"
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
      <Icon className="h-4.5 w-4.5 shrink-0" style={{ color: active ? "var(--color-primary)" : "inherit" }} />
      <span className="font-body">{label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname  = usePathname();
  const router    = useRouter();
  const { data: session } = useSession();
  const userName  = session?.user?.name ?? "Admin";
  const initials  = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const currentPage = navGroups
    .flatMap((g) => g.items)
    .find((n) => n.exact ? pathname === n.href : pathname.startsWith(n.href) && n.href !== "/admin");

  return (
    <div className="flex min-h-screen" style={{ background: "#F3F4F6" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
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
              <p className="text-sm font-semibold font-body truncate" style={{ color: "#111827" }}>Vijaylakshmi</p>
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
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5 font-body"
                style={{ color: "#9CA3AF" }}>
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.href} {...item} />
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
        {/* Top bar */}
        <header className="sticky top-0 z-10 h-16 px-6 flex items-center justify-between gap-4 shrink-0"
          style={{ background: "white", borderBottom: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-gray-500" />
            </button>
            {/* Breadcrumb */}
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
            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-body"
              style={{ borderColor: "#E5E7EB", color: "#9CA3AF", background: "#F9FAFB" }}>
              <Search className="h-4 w-4 shrink-0" />
              <span className="text-sm">Search…</span>
            </div>

            {/* Notifications */}
            <button className="relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100">
              <Bell className="h-4.5 w-4.5" style={{ color: "#6B7280" }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--color-error)" }} />
            </button>

            {/* Avatar */}
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold font-body shrink-0 cursor-default"
              style={{ background: "var(--color-primary)", color: "white" }}
              title={userName}
            >
              {initials}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
