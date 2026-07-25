"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function AuthModalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dismiss = () => router.push("/");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute -top-3 -right-3 z-10 h-9 w-9 flex items-center justify-center rounded-full shadow-lg transition-colors hover:bg-gray-100"
          style={{ background: "white", color: "var(--color-text-muted)" }}
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
