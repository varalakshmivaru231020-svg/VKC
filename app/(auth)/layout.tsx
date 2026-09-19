import { AuthModalShell } from "@/components/auth/AuthModalShell";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Logo and name from Admin → Settings, as the storefront header uses them.
  const rows = await db.siteSetting
    .findMany({ where: { key: { in: ["store_logo", "store_name", "site.name"] } } })
    .catch(() => [] as { key: string; value: string }[]);
  const get = (k: string) => rows.find((r) => r.key === k)?.value?.trim() || undefined;

  return (
    <AuthModalShell siteName={get("site.name") ?? get("store_name") ?? "vkcgoldikshu"} logoUrl={get("store_logo") ?? null}>
      {children}
    </AuthModalShell>
  );
}
