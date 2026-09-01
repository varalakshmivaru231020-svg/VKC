"use client";

import { useState } from "react";
import { Search, Package, Truck, CheckCircle, Clock, X, ExternalLink } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

const STATUS_STEPS = [
  { key: "PENDING",    label: "Order Placed",  icon: Package },
  { key: "CONFIRMED",  label: "Confirmed",     icon: CheckCircle },
  { key: "PROCESSING", label: "Processing",    icon: Clock },
  { key: "SHIPPED",    label: "Shipped",       icon: Truck },
  { key: "DELIVERED",  label: "Delivered",     icon: CheckCircle },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/orders?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.order) {
        setError("Order not found. Please check the order number and try again.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STATUS_ORDER.indexOf(order.status) : -1;

  return (
    <div className="min-h-[60vh] py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--color-cream)" }}>
            <Truck className="h-8 w-8" style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 className="text-3xl font-bold mb-2"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            Track Your Order
          </h1>
          <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
            Enter your order number to get real-time shipping updates
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-text-disabled)" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter order number (e.g. VKC-001234)"
              className="w-full h-12 pl-11 pr-4 border rounded-xl text-sm font-body focus:outline-none"
              style={{ borderColor: "var(--color-parchment)", background: "white" }}
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading}
            className="h-12 px-6 rounded-xl text-sm font-semibold font-body text-white transition-all disabled:opacity-60"
            style={{ background: "var(--color-primary)" }}>
            {loading ? "Searching…" : "Track"}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl border text-sm font-body text-center mb-6"
            style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
            {error}
          </div>
        )}

        {order && (
          <div className="space-y-6">
            {/* Order summary */}
            <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-body uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Order Number</p>
                  <p className="text-xl font-bold font-body mt-0.5" style={{ color: "var(--color-text-primary)" }}>#{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-sm font-semibold font-body mt-0.5" style={{ color: "var(--color-primary)" }}>
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {order.status !== "CANCELLED" && order.status !== "REFUNDED" ? (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute top-4 left-4 right-4 h-0.5" style={{ background: "var(--color-parchment)" }} />
                    <div className="absolute top-4 left-4 h-0.5 transition-all"
                      style={{
                        background: "var(--color-primary)",
                        width: currentStep >= 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * (100 - 8)}%` : "0%",
                      }} />
                    <div className="relative flex justify-between">
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= currentStep;
                        const current = i === currentStep;
                        return (
                          <div key={step.key} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 ${current ? "scale-110" : ""}`}
                              style={{
                                background: done ? "var(--color-primary)" : "white",
                                borderColor: done ? "var(--color-primary)" : "var(--color-parchment)",
                              }}>
                              <step.icon className="h-3.5 w-3.5" style={{ color: done ? "white" : "var(--color-text-disabled)" }} />
                            </div>
                            <p className="text-[9px] font-body font-semibold mt-2 text-center max-w-[56px]"
                              style={{ color: done ? "var(--color-primary)" : "var(--color-text-disabled)" }}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-body font-semibold" style={{ color: "#DC2626" }}>
                  <X className="h-4 w-4" />
                  Order {order.status === "CANCELLED" ? "Cancelled" : "Refunded"}
                </div>
              )}
            </div>

            {/* Tracking details */}
            {(order.trackingNumber || order.courierPartner) && (
              <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                <h3 className="text-sm font-semibold font-body mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                  <Truck className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                  Shipping Details
                </h3>
                <div className="space-y-2">
                  {order.courierPartner && (
                    <div className="flex items-center justify-between text-sm font-body">
                      <span style={{ color: "var(--color-text-muted)" }}>Courier</span>
                      <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{order.courierPartner}</span>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="flex items-center justify-between text-sm font-body">
                      <span style={{ color: "var(--color-text-muted)" }}>Tracking No.</span>
                      <span className="font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>{order.trackingNumber}</span>
                    </div>
                  )}
                  {order.shippedAt && (
                    <div className="flex items-center justify-between text-sm font-body">
                      <span style={{ color: "var(--color-text-muted)" }}>Shipped</span>
                      <span style={{ color: "var(--color-text-primary)" }}>
                        {new Date(order.shippedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div className="flex items-center justify-between text-sm font-body">
                      <span style={{ color: "var(--color-text-muted)" }}>Delivered</span>
                      <span className="font-semibold" style={{ color: "var(--color-success)" }}>
                        {new Date(order.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold font-body border transition-colors hover:bg-gray-50"
                      style={{ borderColor: "var(--color-parchment)", color: "var(--color-primary)" }}>
                      <ExternalLink className="h-4 w-4" />
                      Track on Courier Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            {order.items?.length > 0 && (
              <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                <h3 className="text-sm font-semibold font-body mb-4" style={{ color: "var(--color-text-primary)" }}>
                  Items ({order.items.length})
                </h3>
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0 border"
                        style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                        {item.imageUrl
                          ? <SmartImage src={item.imageUrl} alt={item.productName} fill objectFit="cover" />
                          : <Package className="h-5 w-5 m-auto mt-4" style={{ color: "var(--color-text-disabled)" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{item.productName}</p>
                        <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>{item.variantColor} · Qty {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
