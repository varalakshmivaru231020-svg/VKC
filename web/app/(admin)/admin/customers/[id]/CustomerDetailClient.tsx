"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, MapPin, ShoppingBag, Wallet, Ban, CheckCircle,
  Plus, Minus, ChevronRight, Package, CreditCard, X, Loader2,
  Calendar, Phone, Mail, Shield, TrendingUp, TrendingDown,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

interface OrderItem {
  id: string; productName: string; variantColor: string;
  quantity: number; unitPrice: string; totalPrice: string; imageUrl: string | null;
}
interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  paymentMethod: string | null; totalAmount: string; createdAt: string;
  items: OrderItem[];
}
interface Address {
  id: string; label: string | null; fullName: string; phone: string;
  addressLine1: string; addressLine2: string | null;
  city: string; state: string; pincode: string; country: string; isDefault: boolean;
}
interface WalletTx {
  id: string; type: "CREDIT" | "DEBIT"; amount: string; balance: string;
  reason: string | null; createdAt: string;
}
interface CustomerWallet { balance: string; transactions: WalletTx[]; }
interface Customer {
  id: string; firstName: string | null; lastName: string | null;
  email: string | null; phone: string | null; emailVerified: boolean; phoneVerified: boolean;
  isBlocked: boolean; blockedReason: string | null; isActive: boolean; role: string;
  createdAt: string;
  addresses: Address[];
  orders: Order[];
  wallet: CustomerWallet | null;
  _count: { orders: number; wishlist: number };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:    { bg: "#FEF9C3", color: "#854D0E", label: "Pending" },
  CONFIRMED:  { bg: "#EDE9FE", color: "#7C3AED", label: "Confirmed" },
  PROCESSING: { bg: "#EDE9FE", color: "#7C3AED", label: "Processing" },
  SHIPPED:    { bg: "#EEF2FF", color: "#4338CA", label: "Shipped" },
  DELIVERED:  { bg: "#DCFCE7", color: "#15803D", label: "Delivered" },
  CANCELLED:  { bg: "#FEE2E2", color: "#B91C1C", label: "Cancelled" },
};

type Tab = "overview" | "orders" | "addresses" | "wallet";

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CustomerDetailClient({ customer: init }: { customer: Customer }) {
  const router = useRouter();
  const [customer, setCustomer] = useState(init);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [blocking, setBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);

  const [walletModal, setWalletModal] = useState(false);
  const [walletType, setWalletType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);
  const [walletError, setWalletError] = useState("");

  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—";
  const initials = (customer.firstName?.[0] ?? customer.email?.[0] ?? "?").toUpperCase();
  const walletBalance = Number(customer.wallet?.balance ?? 0);
  const totalSpent = customer.orders.reduce((s, o) => s + Number(o.totalAmount), 0);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",  label: "Overview",                             icon: User },
    { id: "orders",    label: `Orders (${customer._count.orders})`,   icon: ShoppingBag },
    { id: "addresses", label: `Addresses (${customer.addresses.length})`, icon: MapPin },
    { id: "wallet",    label: "Wallet",                               icon: Wallet },
  ];

  const handleBlock = async () => {
    setBlocking(true);
    const willBlock = !customer.isBlocked;
    const res = await fetch(`/api/admin/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isBlocked: willBlock,
        blockedReason: willBlock ? (blockReason || null) : null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomer(p => ({ ...p, isBlocked: updated.isBlocked, blockedReason: updated.blockedReason }));
      setShowBlockModal(false);
      setBlockReason("");
    }
    setBlocking(false);
  };

  const handleWalletTx = async () => {
    const amt = Number(walletAmount);
    if (!amt || amt <= 0) { setWalletError("Enter a valid amount"); return; }
    setWalletSaving(true); setWalletError("");
    const res = await fetch(`/api/admin/customers/${customer.id}/wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: walletType, amount: amt, reason: walletReason }),
    });
    const data = await res.json();
    if (!res.ok) { setWalletError(data.error ?? "Failed"); setWalletSaving(false); return; }

    const newTx: WalletTx = {
      id: Date.now().toString(),
      type: walletType,
      amount: String(amt),
      balance: String(data.balance),
      reason: walletReason || null,
      createdAt: new Date().toISOString(),
    };
    setCustomer(p => ({
      ...p,
      wallet: {
        balance: String(data.balance),
        transactions: [newTx, ...(p.wallet?.transactions ?? [])],
      },
    }));
    setWalletModal(false);
    setWalletAmount("");
    setWalletReason("");
    setWalletSaving(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => router.back()}
          className="h-9 w-9 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50 shrink-0"
          style={{ borderColor: "#E5E7EB" }}>
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold font-body" style={{ color: "#111827" }}>{name}</h1>
          <p className="text-sm font-body" style={{ color: "#6B7280" }}>
            {customer.email ?? customer.phone ?? "—"}
          </p>
        </div>
        <button
          onClick={() => customer.isBlocked ? handleBlock() : setShowBlockModal(true)}
          disabled={blocking}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium font-body border transition-all"
          style={customer.isBlocked
            ? { borderColor: "#A7F3D0", background: "#ECFDF5", color: "#059669" }
            : { borderColor: "#FECACA", background: "#FEF2F2", color: "#DC2626" }}>
          {blocking ? <Loader2 className="h-4 w-4 animate-spin" /> : customer.isBlocked ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          {customer.isBlocked ? "Unblock" : "Block"}
        </button>
      </div>

      {/* Blocked banner */}
      {customer.isBlocked && (
        <div className="p-4 rounded-xl border flex items-start gap-3 text-sm font-body"
          style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#991B1B" }}>
          <Ban className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Account Blocked</span>
            {customer.blockedReason && <span> — {customer.blockedReason}</span>}
          </div>
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
        <div className="p-6 flex flex-wrap gap-5 items-start">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ background: "var(--color-primary)" }}>
            {initials}
          </div>

          {/* Info grid */}
          <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Customer ID",    value: customer.id.slice(0, 8).toUpperCase(), mono: true },
              { label: "Phone",          value: customer.phone ?? "—" },
              { label: "Email Verified", value: customer.emailVerified ? "✓ Verified" : "Not verified",
                color: customer.emailVerified ? "#059669" : "#9CA3AF" },
              { label: "Wallet Balance", value: fmt(walletBalance),
                color: walletBalance > 0 ? "var(--color-primary)" : "#374151" },
              { label: "Total Orders",   value: String(customer._count.orders) },
              { label: "Joined",         value: fmtDate(customer.createdAt) },
            ].map(({ label, value, mono, color }) => (
              <div key={label}>
                <p className="text-[10px] font-body font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>{label}</p>
                <p className={`text-sm font-body ${mono ? "font-mono" : "font-medium"}`} style={{ color: color ?? "#111827" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 border-t divide-x" style={{ borderColor: "#E5E7EB" }}>
          {[
            { label: "Total Spent",     value: fmt(totalSpent),                    icon: CreditCard, color: "#059669" },
            { label: "Orders",          value: String(customer._count.orders),      icon: ShoppingBag, color: "var(--color-primary)" },
            { label: "Wishlist Items",  value: String(customer._count.wishlist),    icon: Package, color: "#7C3AED" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <p className="text-lg font-bold font-body leading-none" style={{ color: "#111827" }}>{value}</p>
                <p className="text-[10px] font-body text-gray-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b" style={{ borderColor: "#E5E7EB" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium font-body border-b-2 transition-all -mb-px"
            style={{
              borderColor: activeTab === t.id ? "var(--color-primary)" : "transparent",
              color: activeTab === t.id ? "var(--color-primary)" : "#6B7280",
            }}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Contact details */}
          <div className="rounded-xl border p-6 space-y-4" style={{ background: "white", borderColor: "#E5E7EB" }}>
            <h2 className="text-sm font-semibold font-body" style={{ color: "#111827" }}>Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Mail,     label: "Email",   value: customer.email ?? "—",   verified: customer.emailVerified },
                { icon: Phone,    label: "Phone",   value: customer.phone ?? "—",   verified: customer.phoneVerified },
                { icon: Calendar, label: "Joined",  value: fmtDateTime(customer.createdAt), verified: undefined },
                { icon: Shield,   label: "Role",    value: customer.role,            verified: undefined },
              ].map(({ icon: Icon, label, value, verified }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#F3F4F6" }}>
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-body text-gray-400">{label}</p>
                    <p className="text-sm font-body font-medium truncate" style={{ color: "#111827" }}>{value}</p>
                  </div>
                  {verified !== undefined && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold font-body"
                      style={{ background: verified ? "#DCFCE7" : "#F3F4F6", color: verified ? "#15803D" : "#9CA3AF" }}>
                      {verified ? "Verified" : "Unverified"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent orders preview */}
          {customer.orders.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
              <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
                <p className="text-sm font-semibold font-body" style={{ color: "#111827" }}>Recent Orders</p>
                <button onClick={() => setActiveTab("orders")} className="text-xs font-body" style={{ color: "var(--color-primary)" }}>
                  View all →
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: "#E5E7EB" }}>
                {customer.orders.slice(0, 3).map((order) => {
                  const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
                  return (
                    <Link key={order.id} href={`/admin/orders/${order.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold font-body" style={{ color: "#111827" }}>#{order.orderNumber}</p>
                          <span className="px-2 py-0.5 text-[10px] font-semibold font-body rounded-full"
                            style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        <p className="text-xs font-body text-gray-400 mt-0.5">
                          {fmtDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold font-body shrink-0" style={{ color: "var(--color-primary)" }}>
                        {fmt(order.totalAmount)}
                      </p>
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ORDERS ── */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          {customer.orders.length === 0 ? (
            <div className="rounded-xl border p-14 text-center" style={{ background: "white", borderColor: "#E5E7EB" }}>
              <ShoppingBag className="h-12 w-12 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
              <p className="text-sm font-semibold font-body" style={{ color: "#374151" }}>No orders yet</p>
              <p className="text-xs font-body text-gray-400 mt-1">This customer hasn't placed any orders.</p>
            </div>
          ) : customer.orders.map((order) => {
            const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
            return (
              <div key={order.id} className="rounded-xl border overflow-hidden transition-all hover:shadow-sm"
                style={{ background: "white", borderColor: "#E5E7EB" }}>
                <div className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold font-body" style={{ color: "#111827" }}>#{order.orderNumber}</p>
                      <span className="px-2 py-0.5 text-[10px] font-semibold font-body rounded-full"
                        style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      <span className="text-xs font-body text-gray-400">{fmtDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold font-body shrink-0" style={{ color: "var(--color-primary)" }}>
                    {fmt(order.totalAmount)}
                  </p>
                  <Link href={`/admin/orders/${order.id}`}
                    className="flex items-center gap-1 text-xs font-semibold font-body hover:underline shrink-0"
                    style={{ color: "var(--color-primary)" }}>
                    View <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                {/* Items */}
                <div className="px-5 py-3 flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                      style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                      {item.imageUrl && (
                        <div className="relative h-7 w-7 rounded overflow-hidden shrink-0">
                          <SmartImage src={item.imageUrl} alt="" fill objectFit="cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] font-semibold font-body leading-tight" style={{ color: "#374151" }}>
                          {item.productName}
                        </p>
                        <p className="text-[10px] font-body text-gray-400">
                          {item.variantColor} · Qty {item.quantity} · {fmt(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADDRESSES ── */}
      {activeTab === "addresses" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {customer.addresses.length === 0 ? (
            <div className="col-span-2 rounded-xl border p-14 text-center" style={{ background: "white", borderColor: "#E5E7EB" }}>
              <MapPin className="h-12 w-12 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
              <p className="text-sm font-semibold font-body" style={{ color: "#374151" }}>No addresses saved</p>
              <p className="text-xs font-body text-gray-400 mt-1">This customer hasn't added any delivery addresses.</p>
            </div>
          ) : customer.addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border p-5 relative"
              style={{ background: "white", borderColor: addr.isDefault ? "var(--color-primary)" : "#E5E7EB" }}>
              {addr.isDefault && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold font-body"
                  style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
                  Default
                </span>
              )}
              {addr.label && (
                <p className="text-[10px] font-semibold font-body uppercase tracking-wide mb-2 text-gray-400">{addr.label}</p>
              )}
              <p className="text-sm font-semibold font-body mb-1" style={{ color: "#111827" }}>{addr.fullName}</p>
              <p className="text-xs font-body text-gray-500">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
              <p className="text-xs font-body text-gray-500">{addr.city}, {addr.state} — {addr.pincode}</p>
              <p className="text-xs font-body text-gray-500">{addr.country}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Phone className="h-3 w-3 text-gray-400" />
                <p className="text-xs font-body text-gray-400">{addr.phone}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── WALLET ── */}
      {activeTab === "wallet" && (
        <div className="space-y-4">
          {/* Balance card */}
          <div className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #6B0F22 100%)" }}>
            <div className="flex-1">
              <p className="text-sm font-body text-white/70 mb-1">Current Balance</p>
              <p className="text-4xl font-bold text-white">{fmt(walletBalance)}</p>
              <p className="text-xs font-body text-white/50 mt-1">
                {customer.wallet?.transactions.length ?? 0} transaction{(customer.wallet?.transactions.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setWalletType("CREDIT"); setWalletAmount(""); setWalletReason(""); setWalletError(""); setWalletModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body transition-all"
                style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
                <TrendingUp className="h-4 w-4" /> Add Money
              </button>
              <button onClick={() => { setWalletType("DEBIT"); setWalletAmount(""); setWalletReason(""); setWalletError(""); setWalletModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body transition-all"
                style={{ background: "rgba(0,0,0,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                <TrendingDown className="h-4 w-4" /> Deduct
              </button>
            </div>
          </div>

          {/* Transactions */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "#E5E7EB" }}>
            <div className="px-5 py-3.5 border-b" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
              <p className="text-sm font-semibold font-body" style={{ color: "#111827" }}>Transaction History</p>
            </div>
            {(!customer.wallet || customer.wallet.transactions.length === 0) ? (
              <div className="p-14 text-center">
                <Wallet className="h-12 w-12 mx-auto mb-3" style={{ color: "#E5E7EB" }} />
                <p className="text-sm font-semibold font-body" style={{ color: "#374151" }}>No transactions yet</p>
                <p className="text-xs font-body text-gray-400 mt-1">Use the buttons above to add or deduct wallet balance.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                {customer.wallet.transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === "CREDIT" ? "bg-green-50" : "bg-red-50"}`}>
                      {tx.type === "CREDIT"
                        ? <TrendingUp className="h-4 w-4 text-green-600" />
                        : <TrendingDown className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium" style={{ color: "#111827" }}>
                        {tx.reason || (tx.type === "CREDIT" ? "Wallet Credit" : "Wallet Debit")}
                      </p>
                      <p className="text-xs font-body text-gray-400 mt-0.5">{fmtDateTime(tx.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold font-body ${tx.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                        {tx.type === "CREDIT" ? "+" : "−"}{fmt(tx.amount)}
                      </p>
                      <p className="text-[10px] font-body text-gray-400 mt-0.5">Bal: {fmt(tx.balance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BLOCK MODAL ── */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E5E7EB" }}>
              <h3 className="text-base font-semibold font-body text-gray-900">Block Customer</h3>
              <button onClick={() => setShowBlockModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm font-body text-gray-600">
                Blocking <strong>{name}</strong> will prevent them from logging in. You can unblock them later.
              </p>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body text-gray-700">Reason (optional)</label>
                <textarea
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Fraudulent activity, Payment dispute…"
                  className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <button onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-body text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleBlock} disabled={blocking}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-body text-white transition-all disabled:opacity-60"
                style={{ background: "#DC2626" }}>
                {blocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Block Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WALLET MODAL ── */}
      {walletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E5E7EB" }}>
              <h3 className="text-base font-semibold font-body text-gray-900">
                {walletType === "CREDIT" ? "Add Money to Wallet" : "Deduct from Wallet"}
              </h3>
              <button onClick={() => setWalletModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                {(["CREDIT", "DEBIT"] as const).map((t) => (
                  <button key={t} onClick={() => setWalletType(t)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold font-body border transition-all"
                    style={{
                      background: walletType === t ? (t === "CREDIT" ? "#DCFCE7" : "#FEE2E2") : "white",
                      borderColor: walletType === t ? (t === "CREDIT" ? "#86EFAC" : "#FCA5A5") : "#E5E7EB",
                      color: walletType === t ? (t === "CREDIT" ? "#15803D" : "#DC2626") : "#6B7280",
                    }}>
                    {t === "CREDIT" ? "➕ Credit" : "➖ Debit"}
                  </button>
                ))}
              </div>

              {walletError && (
                <p className="text-xs font-body text-red-600 bg-red-50 px-3 py-2 rounded-lg">{walletError}</p>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body text-gray-700">Amount (₹) *</label>
                <input
                  type="number" min="1" value={walletAmount}
                  onChange={e => setWalletAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full h-11 px-4 border rounded-lg text-sm font-body focus:outline-none"
                  style={{ borderColor: "#E5E7EB" }}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body text-gray-700">Remarks</label>
                <textarea
                  value={walletReason}
                  onChange={e => setWalletReason(e.target.value)}
                  rows={2}
                  placeholder={walletType === "CREDIT" ? "e.g. Refund for order #VL123" : "e.g. Correction for over-credit"}
                  className="w-full px-4 py-2.5 border rounded-lg text-sm font-body focus:outline-none resize-none"
                  style={{ borderColor: "#E5E7EB" }}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <button onClick={() => setWalletModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-body text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleWalletTx} disabled={walletSaving || !walletAmount}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-body text-white disabled:opacity-60"
                style={{ background: walletType === "CREDIT" ? "#059669" : "#DC2626" }}>
                {walletSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : walletType === "CREDIT" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {walletType === "CREDIT" ? "Add" : "Deduct"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
