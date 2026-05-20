import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Wallet, ArrowDownLeft, ArrowUpRight, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Wallet" };

export default async function WalletPage() {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) redirect("/");

  let wallet = await db.wallet.findUnique({
    where: { userId: uid },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: { userId: uid, balance: 0 },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
    }) as any;
  }

  const balance = Number(wallet!.balance);
  const transactions = wallet!.transactions;

  const totalCredit = transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      <h1 className="text-xl font-bold font-body" style={{ color: "var(--color-text-primary)" }}>My Wallet</h1>

      {/* Balance card */}
      <div className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #5a0f1e 100%)" }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full opacity-10" style={{ background: "white" }} />
        <p className="text-sm text-white/70 font-body mb-1">Available Balance</p>
        <p className="text-4xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          ₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </p>
        <p className="text-white/60 text-xs font-body mt-4">Use wallet balance during checkout</p>

        <div className="flex gap-6 mt-6 pt-6 border-t border-white/20">
          <div>
            <p className="text-xs text-white/60 font-body">Total Credited</p>
            <p className="text-sm font-semibold text-white">₹{totalCredit.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 font-body">Total Debited</p>
            <p className="text-sm font-semibold text-white">₹{totalDebit.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl border text-sm font-body" style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}>
        <p className="font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>How Wallet Works</p>
        <ul className="space-y-1 list-disc list-inside text-xs">
          <li>Wallet credits are added by store for refunds, cashback and special offers</li>
          <li>Use your wallet balance to pay for orders at checkout</li>
          <li>Wallet balance does not expire</li>
        </ul>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-sm font-semibold font-body uppercase tracking-widest mb-4" style={{ color: "var(--color-text-muted)" }}>
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border p-12 flex flex-col items-center gap-4"
            style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
              <Wallet className="h-7 w-7" style={{ color: "var(--color-text-disabled)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>No transactions yet</p>
              <p className="text-xs font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
                Your wallet transactions will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
            {transactions.map((tx, i) => (
              <div key={tx.id}
                className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t" : ""}`}
                style={{ borderColor: "var(--color-parchment)" }}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === "CREDIT" ? "bg-green-50" : "bg-red-50"}`}>
                  {tx.type === "CREDIT"
                    ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {tx.reason || (tx.type === "CREDIT" ? "Wallet Credit" : "Wallet Debit")}
                  </p>
                  <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold font-body ${tx.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                    {tx.type === "CREDIT" ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    Bal: ₹{Number(tx.balance).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
