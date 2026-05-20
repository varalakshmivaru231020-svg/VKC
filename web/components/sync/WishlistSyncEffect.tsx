"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/lib/store/cart";

/**
 * Invisible component that syncs the Zustand wishlist to the database
 * whenever it changes (debounced 800 ms). Mounted once in the marketing layout.
 * This makes the admin Wishlist History page reflect real-time wishlist data.
 */
export function WishlistSyncEffect() {
  const { data: session, status } = useSession();
  const variantIds = useWishlistStore((s) => s.variantIds);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetch("/api/web/wishlist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantIds }),
      }).catch(() => {});
    }, 800);

    return () => clearTimeout(timerRef.current);
  }, [variantIds, session?.user?.id, status]);

  return null;
}
