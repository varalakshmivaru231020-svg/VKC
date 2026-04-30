import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getThemeSettings } from "@/lib/theme/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SidebarNav, MobileTabBar } from "@/components/account/SidebarNav";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { LoginModal } from "@/components/auth/LoginModal";

export const dynamic = "force-dynamic";

function parseFooterLinks(v: string | undefined): { label: string; href: string }[] | undefined {
  if (!v) return undefined;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : undefined; } catch { return undefined; }
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [settings, session, topCategories, siteSettings] = await Promise.all([
    getThemeSettings(),
    auth(),
    db.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            children: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            },
          },
        },
      },
    }).catch(() => []),
    db.siteSetting.findMany().then(rows => {
      const m: Record<string, string> = {};
      rows.forEach(r => { m[r.key] = r.value; });
      return m;
    }).catch(() => ({} as Record<string, string>)),
  ]);

  const user = session?.user;

  const displayName  = user?.name && user.name !== user.phone ? user.name : null;
  const displayPhone = user?.phone ? user.phone.replace(/^\+91/, "") : null;
  const initials     = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
      <Header
        siteName={settings["site.name"]}
        logoUrl={siteSettings["store_logo"] || null}
        navCategories={topCategories}
      />

      {/* Full-screen two-column layout */}
      <div style={{ background: "var(--color-ivory)", minHeight: "calc(100vh - 112px)" }}>
      <div className="max-w-[1400px] mx-auto flex" style={{ minHeight: "calc(100vh - 112px)" }}>

        {/* ── Sidebar (desktop) ── */}
        <aside
          className="hidden lg:flex flex-col w-[260px] xl:w-[280px] shrink-0 border-r self-start sticky"
          style={{
            background: "white",
            borderColor: "var(--color-parchment)",
            top: "112px",
            height: "calc(100vh - 112px)",
            overflowY: "auto",
          }}
        >
          {/* User card */}
          <div
            className="relative overflow-hidden px-5 pt-7 pb-6"
            style={{ background: "var(--color-primary)" }}
          >
            {/* Decorative rings */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

            {/* Avatar */}
            <div
              className="relative w-14 h-14 rounded-full flex items-center justify-center mb-4 text-xl font-bold shrink-0"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "white",
                fontFamily: "var(--font-heading)",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              {initials}
            </div>

            <p
              className="text-[10px] font-body font-semibold uppercase tracking-[0.14em] mb-0.5"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Hello,
            </p>
            <p className="text-base font-semibold text-white truncate" style={{ fontFamily: "var(--font-heading)" }}>
              {displayName ?? "My Account"}
            </p>
            {displayPhone && (
              <p className="text-xs font-body mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                +91 {displayPhone}
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <SidebarNav />
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile tab bar */}
          <div className="lg:hidden">
            <MobileTabBar />
          </div>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      </div>

      <Footer
        siteName={siteSettings["store_name"] || settings["site.name"]}
        tagline={siteSettings["tagline"] || settings["site.tagline"]}
        logoUrl={siteSettings["store_logo"] || null}
        phone={siteSettings["store_phone"]}
        email={siteSettings["store_email"]}
        instagram={siteSettings["social_instagram"]}
        facebook={siteSettings["social_facebook"]}
        youtube={siteSettings["social_youtube"]}
        shopLinks={parseFooterLinks(siteSettings["footer_shop_links"])}
        helpLinks={parseFooterLinks(siteSettings["footer_help_links"])}
        accountLinks={parseFooterLinks(siteSettings["footer_account_links"])}
      />

      {/* Shared overlays — needed for cart/login in header */}
      <CartSidebar />
      <LoginModal />
    </>
  );
}
