"use client";

import { CartSyncEffect } from "./CartSyncEffect";
import { WishlistSyncEffect } from "./WishlistSyncEffect";

/**
 * Single mount point for all silent store-to-DB sync effects.
 * Add this once inside the marketing layout (client boundary).
 */
export function StoreSyncProvider() {
  return (
    <>
      <CartSyncEffect />
      <WishlistSyncEffect />
    </>
  );
}
