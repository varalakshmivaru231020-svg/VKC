"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types/product";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  removeItems: (variantIds: string[]) => void;
  updateQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const cap = newItem.qtyCap ?? newItem.stockQty;
          const existing = state.items.find((i) => i.variantId === newItem.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, cap) }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) }));
      },

      // Used after a split checkout completes — clears only the purchased
      // items, leaving any other-type items still sitting in the cart
      // untouched (clearCart() would wrongly wipe both sections at once).
      removeItems: (variantIds) => {
        const ids = new Set(variantIds);
        set((state) => ({ items: state.items.filter((i) => !ids.has(i.variantId)) }));
      },

      updateQty: (variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.variantId !== variantId) return i;
            const cap = i.qtyCap ?? i.stockQty;
            return { ...i, quantity: Math.min(qty, cap) };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.salePrice * i.quantity, 0),
    }),
    { name: "vl-cart" }
  )
);

// Checkout meta store — coupon only (persisted from cart → checkout)
interface AppliedCoupon {
  code: string;
  discount: number;
  freeShipping: boolean;
  description: string;
}

interface CheckoutMetaStore {
  coupon: AppliedCoupon | null;
  setCoupon: (c: AppliedCoupon) => void;
  removeCoupon: () => void;
  clearCheckoutMeta: () => void;
}

export const useCheckoutMetaStore = create<CheckoutMetaStore>()(
  persist(
    (set) => ({
      coupon: null,
      setCoupon: (c) => set({ coupon: c }),
      removeCoupon: () => set({ coupon: null }),
      clearCheckoutMeta: () => set({ coupon: null }),
    }),
    { name: "vl-checkout-meta" }
  )
);

// Wishlist store
interface WishlistStore {
  variantIds: string[];
  toggle: (variantId: string) => void;
  isWishlisted: (variantId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      variantIds: [],
      toggle: (variantId) =>
        set((state) => ({
          variantIds: state.variantIds.includes(variantId)
            ? state.variantIds.filter((id) => id !== variantId)
            : [...state.variantIds, variantId],
        })),
      isWishlisted: (variantId) => get().variantIds.includes(variantId),
    }),
    { name: "vl-wishlist" }
  )
);
