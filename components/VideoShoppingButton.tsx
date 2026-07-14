"use client";

import { Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/ui";

interface VideoShoppingButtonProps {
  className?: string;
  onTrigger?: () => void;
}

/**
 * Trigger only — the modal itself is <VideoShoppingModal>, rendered once at
 * the marketing layout level so it isn't tied to wherever this button lives
 * (e.g. inside the mobile nav drawer, which unmounts on its own close).
 */
export function VideoShoppingButton({ className = "", onTrigger }: VideoShoppingButtonProps) {
  const openVideoShopping = useUIStore((s) => s.openVideoShopping);

  return (
    <button
      onClick={() => { onTrigger?.(); openVideoShopping(); }}
      className={cn("inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-body font-semibold transition-all duration-150", className)}
      style={{ background: "var(--color-primary)", color: "white" }}
    >
      <Video className="h-4 w-4" />
      Video Shopping
    </button>
  );
}
