"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUIStore } from "@/lib/store/ui";

export function LoginTrigger() {
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const openLoginModal = useUIStore((s) => s.openLoginModal);

  useEffect(() => {
    if (searchParams.get("openLogin") !== "1") return;

    const callbackUrl = searchParams.get("callbackUrl") || "/";

    // Strip the trigger params from the URL without a re-render
    const clean = new URL(window.location.href);
    clean.searchParams.delete("openLogin");
    clean.searchParams.delete("callbackUrl");
    router.replace(clean.pathname + (clean.search || ""), { scroll: false });

    openLoginModal(() => router.push(callbackUrl));
  }, []); // run once on mount — params are stable at this point

  return null;
}
