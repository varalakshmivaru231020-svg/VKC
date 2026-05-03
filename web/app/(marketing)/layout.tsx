import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { QuickViewModal } from "@/components/product/QuickViewModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { LoginTrigger } from "@/components/auth/LoginTrigger";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { getThemeSettings } from "@/lib/theme/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseFooterLinks(v: string | undefined): { label: string; href: string }[] | undefined {
  if (!v) return undefined;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : undefined; } catch { return undefined; }
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [settings, allActiveCategories, siteSettings] = await Promise.all([
    getThemeSettings(),
    db.category.findMany({
      where: { isActive: true },
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
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }).catch(() => []),
    db.siteSetting.findMany().then(rows => {
      const m: Record<string, string> = {};
      rows.forEach(r => { m[r.key] = r.value; });
      return m;
    }).catch(() => ({} as Record<string, string>)),
  ]);

  // Determine header nav from admin setting or fall back to all root categories
  const navOrder: string[] = (() => {
    try { return siteSettings["header_nav"] ? JSON.parse(siteSettings["header_nav"]) : []; }
    catch { return []; }
  })();

  const topCategories = navOrder.length > 0
    ? (navOrder.map(id => allActiveCategories.find(c => c.id === id)).filter(Boolean) as typeof allActiveCategories)
    : allActiveCategories.filter(c => !c.parentId);

  return (
    <div className="marketing-layout">
      <AnnouncementBar />
      <Header
        siteName={settings["site.name"]}
        logoUrl={siteSettings["store_logo"] || null}
        navCategories={topCategories}
      />
      <main>{children}</main>
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
      <CartSidebar />
      <QuickViewModal />
      <LoginModal />
      <Suspense><LoginTrigger /></Suspense>
      <MobileBottomNav />
    </div>
  );
}
