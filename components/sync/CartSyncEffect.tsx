"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart";

/**
 * Invisible component that syncs the Zustand cart to the database
 * whenever it changes (debounced 800 ms). Mounted once in the marketing layout.
 * This makes the admin Cart History page reflect real-time cart data.
 */
export function CartSyncEffect() {
  const { data: session, status } = useSession();
  const items = useCartStore((s) => s.items);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetch("/api/web/cart", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity:  i.quantity,
          })),
        }),
      }).catch(() => {});
    }, 800);

    return () => clearTimeout(timerRef.current);
  }, [items, session?.user?.id, status]);

  return null;
}
