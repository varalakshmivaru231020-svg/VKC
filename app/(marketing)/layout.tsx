import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { QuickViewModal } from "@/components/product/QuickViewModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { LoginTrigger } from "@/components/auth/LoginTrigger";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { WhatsAppFloatButton } from "@/components/layout/WhatsAppFloatButton";
import { StoreSyncProvider } from "@/components/sync/StoreSyncProvider";
import { getThemeSettings } from "@/lib/theme/server";
import { getMaintenance } from "@/lib/settings/maintenance";
import { MaintenanceScreen } from "@/components/layout/MaintenanceScreen";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseFooterLinks(v: string | undefined): { label: string; href: string }[] | undefined {
  if (!v) return undefined;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : undefined; } catch { return undefined; }
}

interface CategoryRow { id: string; name: string; slug: string; parentId: string | null }

function buildNavCategories(categories: CategoryRow[], headerNavRaw: string | undefined) {
  const byId = new Map(categories.map((c) => [c.id, c]));

  let navIds: string[] = [];
  try { navIds = headerNavRaw ? JSON.parse(headerNavRaw) : []; } catch { navIds = []; }
  navIds = navIds.filter((id) => byId.has(id));

  // Only categories explicitly added in Admin → Settings → Header Nav appear
  // in the menu. With nothing selected the menu shows just the fixed links.
  if (navIds.length === 0) return [];

  const navIdSet = new Set(navIds);
  const topLevelIds = navIds.filter((id) => {
    const parentId = byId.get(id)!.parentId;
    return !parentId || !navIdSet.has(parentId);
  });

  return topLevelIds.map((id) => {
    const cat = byId.get(id)!;
    const children = navIds
      .filter((cid) => byId.get(cid)!.parentId === id)
      .map((cid) => { const c = byId.get(cid)!; return { id: c.id, name: c.name, slug: c.slug }; });
    return { id: cat.id, name: cat.name, slug: cat.slug, children };
  });
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [settings, siteSettings, categories] = await Promise.all([
    getThemeSettings(),
    db.siteSetting.findMany().then(rows => {
      const m: Record<string, string> = {};
      rows.forEach(r => { m[r.key] = r.value; });
      return m;
    }).catch(() => ({} as Record<string, string>)),
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { sortOrder: "asc" },
    }).catch(() => [] as CategoryRow[]),
  ]);

  const navCategories = buildNavCategories(categories, siteSettings["header_nav"]);

  // Maintenance mode covers the storefront only. /admin lives outside this
  // layout, so switching it on never locks the owner out of the toggle.
  const maintenance = await getMaintenance();
  if (maintenance.enabled) {
    return (
      <MaintenanceScreen
        title={maintenance.title}
        message={maintenance.message}
        siteName={siteSettings["store_name"] || settings["site.name"]}
        logoUrl={siteSettings["store_logo"] || null}
      />
    );
  }

  return (
    <div className="marketing-layout">
      <Header
        siteName={settings["site.name"]}
        logoUrl={siteSettings["store_logo"] || null}
        instagram={siteSettings["social_instagram"]}
        facebook={siteSettings["social_facebook"]}
        youtube={siteSettings["social_youtube"]}
        navCategories={navCategories}
        whatsappNumber={siteSettings["whatsapp_number"]}
      />
      <main><PageTransition>{children}</PageTransition></main>
      <Footer
        siteName={siteSettings["store_name"] || settings["site.name"]}
        tagline={siteSettings["tagline"] || settings["site.tagline"]}
        logoUrl={siteSettings["store_logo"] || null}
        phone={siteSettings["store_phone"]}
        email={siteSettings["store_email"]}
        address={siteSettings["store_address"]}
        whatsappNumber={siteSettings["whatsapp_number"]}
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
      <WhatsAppFloatButton phoneNumber={siteSettings["whatsapp_number"]} />
      <StoreSyncProvider />
    </div>
  );
}
