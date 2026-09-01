"use client";

import { create } from "zustand";
import type { ProductData } from "@/lib/types/product";

interface UIStore {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  quickViewProduct: ProductData | null;
  openQuickView: (product: ProductData) => void;
  closeQuickView: () => void;
  loginModalOpen: boolean;
  loginModalCallback: (() => void) | null;
  openLoginModal: (callback?: () => void) => void;
  closeLoginModal: () => void;

}

export const useUIStore = create<UIStore>((set) => ({
  cartOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),

  quickViewProduct: null,
  openQuickView: (product) => set({ quickViewProduct: product }),
  closeQuickView: () => set({ quickViewProduct: null }),

  loginModalOpen: false,
  loginModalCallback: null,
  openLoginModal: (callback) => set({ loginModalOpen: true, loginModalCallback: callback ?? null }),
  closeLoginModal: () => set({ loginModalOpen: false, loginModalCallback: null }),

}));
