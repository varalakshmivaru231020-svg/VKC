"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: wire up to email API
    setStatus("success");
    setEmail("");
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <form className="flex gap-2 mt-2" onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 h-11 px-4 rounded-xs text-sm font-body bg-white/10 border border-white/20 text-white placeholder:text-[#BFBFBF] focus:outline-none focus:border-current transition-colors"
        style={{ fontFamily: "var(--font-body)" }}
        required
      />
      <button
        type="submit"
        className="h-11 px-6 rounded-xs text-sm font-semibold transition-colors shrink-0 cursor-pointer"
        style={{ background: "var(--color-gold)", color: "#FFFFFF", fontFamily: "var(--font-body)" }}
      >
        {status === "success" ? "Subscribed!" : "Subscribe"}
      </button>
    </form>
  );
}
