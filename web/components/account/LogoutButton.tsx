"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-sm font-body font-medium transition-colors hover:bg-red-50"
      style={{ color: "var(--color-error)" }}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      Sign Out
    </button>
  );
}
