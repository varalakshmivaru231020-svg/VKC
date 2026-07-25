import Link from "next/link";
import { db } from "@/lib/db";
import { Search, Users, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers — Admin" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const page = parseInt(searchParams.page ?? "1");
  const limit = 25;
  const q = searchParams.q ?? "";

  const where: any = { role: "CUSTOMER" };
  if (q) {
    const custNum = q.toUpperCase().startsWith("CUST-") ? parseInt(q.slice(5)) : parseInt(q);
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      ...(!isNaN(custNum) ? [{ id: { contains: String(custNum) } }] : []),
    ];
  }

  const [total, customers] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, emailVerified: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Customers</h1>
        <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{total} registered customers</p>
      </div>

      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, email, phone, CUST-ID…"
          className="w-full h-10 pl-9 pr-4 border rounded-sm text-sm font-body focus:outline-none"
          style={{ borderColor: "var(--color-parchment)", background: "white" }}
        />
      </form>

      <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
        {customers.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-center gap-3">
            <Users className="h-10 w-10" style={{ color: "var(--color-text-disabled)" }} />
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>No customers found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-parchment)" }}>
                {["Customer ID", "Customer", "Email", "Phone", "Orders", "Joined", "Verified", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-body font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={c.id} className="border-b hover:bg-primary-50 transition-colors cursor-pointer"
                  style={{ borderColor: "var(--color-parchment)", background: i % 2 === 0 ? "white" : "var(--color-ivory)" }}>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[11px] font-body font-bold rounded-full"
                      style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                      {c.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-body font-bold text-white"
                        style={{ background: "var(--color-primary)" }}>
                        {(c.firstName?.[0] ?? c.email?.[0] ?? "?").toUpperCase()}
                      </div>
                      <p className="text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>{c.email}</td>
                  <td className="px-4 py-3 text-sm font-body" style={{ color: "var(--color-text-muted)" }}>{c.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-body font-semibold" style={{ color: "var(--color-primary)" }}>{c._count.orders}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[10px] font-body font-semibold rounded-full"
                      style={{ background: c.emailVerified ? "var(--color-success-bg)" : "var(--color-warning-bg)", color: c.emailVerified ? "var(--color-success)" : "var(--color-warning)" }}>
                      {c.emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-1 text-xs font-body font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
