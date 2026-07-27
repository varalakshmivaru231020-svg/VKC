"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils/format";
import type { CartItem } from "@/lib/types/product";

export interface ShortfallEntry {
  item: CartItem;
  available: number;
  preBookingEligible: boolean;
  preBookingEtaLabel: string | null;
  resolved: boolean;
}

interface Props {
  entries: ShortfallEntry[];
  onBuyAvailable: (variantId: string, available: number) => void;
  onPreBook: (variantId: string, etaLabel: string | null) => void;
  onContinue: () => void;
  onClose: () => void;
}

export function PreBookingShortfallModal({ entries, onBuyAvailable, onPreBook, onContinue, onClose }: Props) {
  const allResolved = entries.every((e) => e.resolved);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-md shadow-2xl"
        style={{ background: "white" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--color-parchment)" }}>
          <h2 className="text-lg font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
            Limited Stock
          </h2>
          <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Some items in your cart have less stock than you've requested.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {entries.map(({ item, available, preBookingEligible, preBookingEtaLabel, resolved }) => {
            const shortfall = item.quantity - available;
            return (
              <div key={item.variantId} className="rounded-md border p-4"
                style={{ borderColor: resolved ? "var(--color-success)" : "var(--color-parchment)", background: resolved ? "var(--color-success-bg)" : "var(--color-cream)" }}>
                <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {item.productName} <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>({item.variantColor})</span>
                </p>
                <p className="text-xs font-body mt-1 flex items-start gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {available > 0
                    ? `Only ${available} of ${item.quantity} requested are currently available.`
                    : `This item is currently out of stock.`}
                  {preBookingEligible && ` You can pre-book the remaining ${shortfall}.`}
                </p>

                {resolved ? (
                  <p className="text-xs font-body font-semibold mt-2" style={{ color: "var(--color-success)" }}>
                    ✓ {item.isPreBooking ? `Pre-booking all ${item.quantity}` : `Buying ${item.quantity} available`}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {available > 0 && (
                      <Button variant="outline" className="h-9 px-3 text-xs"
                        onClick={() => onBuyAvailable(item.variantId, available)}>
                        Buy {available} Available
                      </Button>
                    )}
                    {preBookingEligible && (
                      <Button variant="buyNow" className="h-9 px-3 text-xs"
                        onClick={() => onPreBook(item.variantId, preBookingEtaLabel)}>
                        Pre-Book {item.quantity} Items
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-5 border-t flex gap-3" style={{ borderColor: "var(--color-parchment)" }}>
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!allResolved} onClick={onContinue}>
            Continue to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
