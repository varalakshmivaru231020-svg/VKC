"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trash2, Minus, Plus, ShoppingBag, ArrowRight, Heart,
} from "lucide-react";
import { CouponPicker } from "@/components/cart/CouponPicker";
import { useSession } from "next-auth/react";
import { useCartStore, useWishlistStore, useCheckoutMetaStore } from "@/lib/store/cart";
import { useUIStore } from "@/lib/store/ui";
import { formatINR, discountPercent } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/SmartImage";

interface ShippingConfig {
  freeShippingThreshold: number; firstSareeRate: number; additionalSareeRate: number;
  deliveryTitle: string; deliveryNotes: string;
}

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal } = useCartStore();
  const { toggle: wishlistToggle, isWishlisted } = useWishlistStore();
  const { coupon: couponApplied, setCoupon, removeCoupon } = useCheckoutMetaStore();
  const { openLoginModal } = useUIStore();
  const { data: session } = useSession();
  const router = useRouter();

  const [movedToWishlist, setMovedToWishlist] = useState<string | null>(null);

  const handleCouponApply = (c: { code: string; discount: number; freeShipping: boolean; description: string }) => {
    setCoupon(c);
  };
  const handleCouponRemove = () => removeCoupon();

  const moveToWishlist = (variantId: string) => {
    if (!isWishlisted(variantId)) wishlistToggle(variantId);
    removeItem(variantId);
    setMovedToWishlist(variantId);
    setTimeout(() => setMovedToWishlist(null), 2500);
  };

  // Shipping config
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>({
    freeShippingThreshold: 2999, firstSareeRate: 100, additionalSareeRate: 50,
    deliveryTitle: "Standard Delivery", deliveryNotes: "4–7 business days",
  });

  useEffect(() => {
    fetch("/api/shipping-config").then(r => r.json()).then(d => setShippingConfig(d)).catch(() => {});
  }, []);

  const standardItems = items;

  const sub = subtotal();
  const discountAmt = couponApplied ? couponApplied.discount : 0;
  const afterDiscount = sub - discountAmt;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const gstAmount = items.reduce((s, i) => {
    const rate = i.gstPercent ?? 5;
    const lineTotal = i.salePrice * i.quantity;
    return s + (lineTotal - lineTotal / (1 + rate / 100));
  }, 0);

  const domesticShippingCost = afterDiscount >= shippingConfig.freeShippingThreshold
    ? 0
    : shippingConfig.firstSareeRate + Math.max(0, totalQty - 1) * shippingConfig.additionalSareeRate;

  const total = afterDiscount + domesticShippingCost;

  const [checkingStock, setCheckingStock] = useState(false);

  const goToCheckout = () => {
    router.push("/checkout");
  };

  const handleCheckout = () => {
    const proceed = async () => {
      // Re-check live stock right before checkout — cart quantities are
      // snapshotted at add-time and can go stale (someone else bought the
      // last few), and checkout otherwise creates the order regardless of
      // actual stock.
      if (items.length === 0) { goToCheckout(); return; }

      setCheckingStock(true);
      try {
        const res = await fetch("/api/web/cart/check-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) }),
        });
        const data = await res.json();
        const results: { variantId: string; available: number; shortfall: number }[] = data.results ?? [];
        const shortfalls = results.filter((r) => r.shortfall > 0);

        if (shortfalls.length === 0) { goToCheckout(); return; }

        // Some items are no longer available in the requested quantity —
        // clamp each to what's in stock (removes any that sold out) and let
        // the customer review before trying again.
        for (const r of shortfalls) updateQty(r.variantId, r.available);
        alert(
          "Some items in your cart are no longer available in the quantity you chose. " +
          "We've updated them to the current stock — please review your cart and checkout again."
        );
      } catch {
        // If the stock check itself fails, don't block checkout on it —
        // fall back to proceeding rather than stranding the customer.
        goToCheckout();
      } finally {
        setCheckingStock(false);
      }
    };
    if (!session) {
      openLoginModal(proceed);
    } else {
      proceed();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center py-24 px-4"
        style={{ background: "var(--color-ivory)" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: "var(--color-cream)" }}>
          <ShoppingBag className="h-10 w-10" style={{ color: "var(--color-text-muted)" }} />
        </div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", color: "var(--color-text-primary)" }}>
          Your cart is empty
        </h2>
        <p className="mt-2 text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
          Discover our natural jaggery range and add your favourites
        </p>
        <Button asChild className="mt-8">
          <Link href="/shop">Browse Products <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-10">
        {standardItems.length > 0 && (
        <div>
        <h1 className="mb-8 font-body font-semibold text-2xl" style={{ color: "var(--color-text-primary)" }}>
          My Cart <span className="text-base font-normal ml-2" style={{ color: "var(--color-text-muted)" }}>({totalQty} item{totalQty !== 1 ? "s" : ""})</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart items */}
          <div className="flex-1 space-y-4">
            {standardItems.map((item) => {
              const hasDiscount = item.originalPrice > item.salePrice;
              const pct = discountPercent(item.originalPrice, item.salePrice);
              return (
                <div key={item.variantId} className="flex gap-5 p-6 rounded-md"
                  style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
                  <Link href={`/shop/${item.productId}`} className="shrink-0">
                    <div className="relative w-32 h-44 rounded-sm overflow-hidden"
                      style={{ background: item.colorHex + "30", border: "1px solid var(--color-parchment)" }}>
                      {item.imageUrl
                        ? <SmartImage src={item.imageUrl} alt={item.productName} fill objectFit="cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full" style={{ background: item.colorHex }} />
                          </div>
                      }
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/shop/${item.productId}`}>
                          <p className="font-body font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors"
                            style={{ color: "var(--color-text-primary)" }}>
                            {item.productName}
                          </p>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-3.5 h-3.5 rounded-full border border-white"
                            style={{ background: item.colorHex, boxShadow: "0 0 0 1px var(--color-parchment)" }} />
                          <span className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                            {item.variantColor}
                          </span>
                          {item.sareeCode && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs"
                              style={{ background: "var(--color-cream)", color: "var(--color-text-muted)", border: "1px solid var(--color-parchment)" }}>
                              {item.sareeCode}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.variantId)}
                        className="shrink-0 h-7 w-7 flex items-center justify-center rounded-sm transition-colors hover:bg-error-bg"
                        style={{ color: "var(--color-text-muted)" }}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-price-sm)", fontStyle: "italic", color: "var(--color-primary)" }}>
                          {formatINR(item.salePrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs line-through font-body" style={{ color: "var(--color-text-muted)" }}>
                            {formatINR(item.originalPrice)}
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="text-[10px] font-body font-semibold rounded-xs px-1.5 py-0.5"
                            style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>
                            {pct}% off
                          </span>
                        )}
                      </div>
                      <div className="flex items-center border rounded-xs overflow-hidden shrink-0"
                        style={{ borderColor: "var(--color-parchment)" }}>
                        <button onClick={() => updateQty(item.variantId, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center transition-colors hover:bg-cream">
                          <Minus className="h-3.5 w-3.5" style={{ color: "var(--color-text-muted)" }} />
                        </button>
                        <span className="h-8 w-10 flex items-center justify-center text-sm font-body font-medium border-x"
                          style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}>
                          {item.quantity}
                        </span>
                        <button onClick={() => updateQty(item.variantId, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center transition-colors hover:bg-cream"
                          disabled={item.quantity >= (item.qtyCap ?? item.stockQty)}>
                          <Plus className="h-3.5 w-3.5" style={{ color: "var(--color-text-muted)" }} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
                      <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                        Item total: <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{formatINR(item.salePrice * item.quantity)}</span>
                      </p>
                      <button
                        onClick={() => moveToWishlist(item.variantId)}
                        className="flex items-center gap-1 text-xs font-body font-medium transition-colors hover:opacity-80 whitespace-nowrap shrink-0"
                        style={{ color: "var(--color-primary)" }}
                      >
                        <Heart className="h-3.5 w-3.5 shrink-0" />
                        Move to Wishlist
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {movedToWishlist && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border"
                style={{ background: "#FFF0F3", borderColor: "#FECDD3" }}>
                <Heart className="h-4 w-4 shrink-0 fill-current" style={{ color: "#E11D48" }} />
                <p className="text-sm font-body" style={{ color: "#9F1239" }}>
                  Item moved to your <span className="font-semibold">Wishlist</span> — it's saved for later.
                </p>
              </div>
            )}

            <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-body font-medium mt-2 transition-colors"
              style={{ color: "var(--color-primary)" }}>
              ← Continue Shopping
            </Link>
          </div>

          {/* Order summary */}
          <div className="lg:w-80 shrink-0 space-y-4">
            {/* Coupon */}
            <div className="p-5 rounded-md" style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
              <p className="text-sm font-body font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                Apply Coupon
              </p>
              <CouponPicker
                subtotal={sub}
                applied={couponApplied}
                onApply={handleCouponApply}
                onRemove={handleCouponRemove}
              />
            </div>

            {/* Shipping option */}
            {/* Summary */}
            <div className="p-5 rounded-md" style={{ background: "white", border: "1px solid var(--color-parchment)" }}>
              <p className="text-base font-body font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Order Summary</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-body">
                  <span style={{ color: "var(--color-text-muted)" }}>Subtotal ({totalQty} item{totalQty !== 1 ? "s" : ""})</span>
                  <span style={{ color: "var(--color-text-primary)" }}>{formatINR(sub)}</span>
                </div>
                {couponApplied && (
                  <div className="flex items-center justify-between text-sm font-body">
                    <div>
                      <span style={{ color: "var(--color-success)" }}>Coupon ({couponApplied.code})</span>
                      <p className="text-[11px]" style={{ color: "var(--color-success)", opacity: 0.85 }}>{couponApplied.description}</p>
                    </div>
                    <span style={{ color: "var(--color-success)", fontWeight: 600 }}>
                      {couponApplied.freeShipping ? "Free ship" : `−${formatINR(discountAmt)}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-body">
                  <span style={{ color: "var(--color-text-muted)" }}>Shipping</span>
                  <span style={{
                    color: domesticShippingCost === 0 ? "var(--color-success)" : "var(--color-text-primary)",
                    fontWeight: domesticShippingCost === 0 ? 600 : 400,
                  }}>
                    {domesticShippingCost === 0 ? "Free" : formatINR(domesticShippingCost)}
                  </span>
                </div>

                {domesticShippingCost > 0 && afterDiscount < shippingConfig.freeShippingThreshold && (
                  <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                    Add {formatINR(shippingConfig.freeShippingThreshold - afterDiscount)} more for free shipping
                  </p>
                )}

                <div className="gold-divider" />
                <div className="flex items-center justify-between">
                  <span className="font-body font-semibold text-base" style={{ color: "var(--color-text-primary)" }}>Total</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-price)", fontStyle: "italic", color: "var(--color-primary)" }}>
                    {formatINR(total)}
                  </span>
                </div>
                <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>Includes {formatINR(gstAmount)} GST</p>
              </div>

              <Button
                className="w-full mt-5 h-12"
                onClick={handleCheckout}
                loading={checkingStock}
              >
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-4">
                {["UPI", "Cards", "NetBanking", "EMI", "COD"].map((m) => (
                  <span key={m} className="text-[10px] font-body font-medium whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
        )}
      </div>
    </div>
  );
}
