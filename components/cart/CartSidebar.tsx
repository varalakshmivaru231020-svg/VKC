"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, Minus, Plus, ArrowRight, Tag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useUIStore } from "@/lib/store/ui";
import { formatINR } from "@/lib/utils/format";
import { SmartImage } from "@/components/ui/SmartImage";

export function CartSidebar() {
  const { cartOpen, closeCart } = useUIStore();
  const { items: rawItems, removeItem, updateQty, subtotal, totalItems } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [shippingConfig, setShippingConfig] = useState({
    freeShippingThreshold: 2999, firstSareeRate: 100, additionalSareeRate: 50,
  });

  useEffect(() => {
    fetch("/api/shipping-config").then(r => r.json()).then(d => setShippingConfig(d)).catch(() => {});
  }, []);

  const handleCheckout = () => {
    closeCart();
    router.push("/cart");
  };

  useEffect(() => { setMounted(true); }, []);

  // Lock scroll when open
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCart]);

  const items = mounted ? rawItems : [];
  const sub = mounted ? subtotal() : 0;
  const count = mounted ? totalItems() : 0;
  const shipping = sub >= shippingConfig.freeShippingThreshold
    ? 0
    : shippingConfig.firstSareeRate + Math.max(0, count - 1) * shippingConfig.additionalSareeRate;
  const total = sub + shipping;

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-[90] flex flex-col w-full max-w-[420px] shadow-2xl transition-transform duration-300"
        style={{
          background: "var(--color-ivory)",
          transform: cartOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-parchment)" }}>
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            <span className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
              My Cart
            </span>
            {count > 0 && (
              <span className="h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold font-body text-white"
                style={{ background: "var(--color-primary)" }}>
                {count}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="h-9 w-9 flex items-center justify-center rounded-sm transition-colors hover:bg-cream"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-cream)" }}>
              <ShoppingBag className="h-9 w-9" style={{ color: "var(--color-text-disabled)" }} />
            </div>
            <div>
              <p className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                Your cart is empty
              </p>
              <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
                Discover our natural jaggery range
              </p>
            </div>
            <button
              onClick={closeCart}
              className="px-6 py-3 rounded-sm text-sm font-body font-semibold transition-colors"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.map((item) => {
                const hasDiscount = item.originalPrice > item.salePrice;
                return (
                  <div key={item.variantId}
                    className="flex gap-3 p-3 rounded-md border"
                    style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                    {/* Image */}
                    <div className="relative shrink-0 overflow-hidden rounded-sm"
                      style={{ background: item.colorHex + "25", border: "1px solid var(--color-parchment)", height: "88px", width: "64px" }}>
                      {item.imageUrl
                        ? <SmartImage src={item.imageUrl} alt={item.productName} fill objectFit="cover" />
                        : <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 rounded-full" style={{ background: item.colorHex }} /></div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-1">
                        <p className="text-sm font-body font-medium line-clamp-2 leading-snug" style={{ color: "var(--color-text-primary)" }}>
                          {item.productName}
                        </p>
                        <button onClick={() => removeItem(item.variantId)}
                          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-sm transition-colors hover:bg-error-bg ml-1"
                          style={{ color: "var(--color-text-muted)" }}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-3 h-3 rounded-full border border-white"
                          style={{ background: item.colorHex, boxShadow: "0 0 0 1px var(--color-parchment)" }} />
                        <span className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                          {item.variantColor}
                        </span>
                        {item.sareeCode && (
                          <span className="text-[10px] font-mono px-1 rounded-xs"
                            style={{ background: "var(--color-cream)", color: "var(--color-text-muted)" }}>
                            {item.sareeCode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Price */}
                        <div className="flex items-baseline gap-1.5">
                          <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "15px", color: "var(--color-primary)" }}>
                            {formatINR(item.salePrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] font-body line-through" style={{ color: "var(--color-text-muted)" }}>
                              {formatINR(item.originalPrice)}
                            </span>
                          )}
                        </div>
                        {/* Qty */}
                        <div className="flex items-center border rounded-xs overflow-hidden"
                          style={{ borderColor: "var(--color-parchment)" }}>
                          <button onClick={() => updateQty(item.variantId, item.quantity - 1)}
                            className="h-7 w-7 flex items-center justify-center transition-colors hover:bg-cream">
                            <Minus className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                          </button>
                          <span className="h-7 w-8 flex items-center justify-center text-xs font-body font-medium border-x"
                            style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}>
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQty(item.variantId, item.quantity + 1)}
                            className="h-7 w-7 flex items-center justify-center transition-colors hover:bg-cream"
                            disabled={item.quantity >= (item.qtyCap ?? item.stockQty)}>
                            <Plus className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Free shipping bar */}
              {shippingConfig.freeShippingThreshold > 0 && sub < shippingConfig.freeShippingThreshold && (
                <div className="p-3 rounded-md text-center" style={{ background: "var(--color-primary-50)", border: "1px dashed var(--color-primary)" }}>
                  <p className="text-xs font-body font-medium" style={{ color: "var(--color-primary)" }}>
                    Add <strong>{formatINR(shippingConfig.freeShippingThreshold - sub)}</strong> more for free shipping!
                  </p>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-parchment)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (sub / shippingConfig.freeShippingThreshold) * 100)}%`, background: "var(--color-primary)" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: "var(--color-parchment)", background: "white" }}>
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-body">
                  <span style={{ color: "var(--color-text-muted)" }}>Subtotal</span>
                  <span style={{ color: "var(--color-text-primary)" }}>{formatINR(sub)}</span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span style={{ color: "var(--color-text-muted)" }}>Shipping</span>
                  <span style={{ color: shipping === 0 ? "var(--color-success)" : "var(--color-text-primary)", fontWeight: shipping === 0 ? 600 : 400 }}>
                    {shipping === 0 ? "Free" : formatINR(shipping)}
                  </span>
                </div>
                <div className="flex justify-between font-body font-semibold text-base pt-1 border-t" style={{ borderColor: "var(--color-parchment)" }}>
                  <span style={{ color: "var(--color-text-primary)" }}>Total</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "18px", color: "var(--color-primary)" }}>
                    {formatINR(total)}
                  </span>
                </div>
              </div>

              {/* Coupon hint */}
              <div className="flex items-center gap-1.5 text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                <Tag className="h-3.5 w-3.5" />
                Coupons & offers available at checkout
              </div>

              {/* Buttons */}
              <button
                onClick={handleCheckout}
                className="flex items-center justify-center gap-2 w-full h-12 rounded-sm text-sm font-body font-semibold transition-colors whitespace-nowrap"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex items-center justify-center w-full h-10 rounded-sm text-sm font-body font-medium border transition-colors"
                style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-secondary)" }}
              >
                View Full Cart
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
