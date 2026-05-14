"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

interface PopupData {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
}

export function PopupBanner({ popup }: { popup: PopupData | null }) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!popup) return;
    const dismissed = sessionStorage.getItem(`popup_dismissed_${popup.id}`);
    if (dismissed) return;
    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    }, 1500);
    return () => clearTimeout(timer);
  }, [popup]);

  const dismiss = () => {
    setAnimate(false);
    setTimeout(() => {
      if (popup) sessionStorage.setItem(`popup_dismissed_${popup.id}`, "1");
      setVisible(false);
    }, 300);
  };

  if (!visible || !popup) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      style={{
        background: `rgba(10,6,4,${animate ? "0.75" : "0"})`,
        backdropFilter: animate ? "blur(8px)" : "blur(0px)",
        transition: "background 0.35s ease, backdrop-filter 0.35s ease",
      }}
      onClick={dismiss}
    >
      {/* Card */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: "min(580px, 94vw)",
          borderRadius: "1.5rem",
          boxShadow: "0 40px 100px rgba(0,0,0,0.45), 0 12px 32px rgba(0,0,0,0.25)",
          border: "1px solid rgba(196,146,42,0.4)",
          background: "var(--color-ivory)",
          transform: animate ? "translateY(0) scale(1)" : "translateY(28px) scale(0.93)",
          opacity: animate ? 1 : 0,
          transition: "transform 0.36s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header strip ── */}
        <div
          className="relative flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ background: "var(--color-primary)" }}
        >
          {/* Decorative rings */}
          <div className="absolute -left-8 -top-8 w-24 h-24 rounded-full pointer-events-none opacity-[0.08]"
            style={{ border: "20px solid var(--color-gold)" }} />
          <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full pointer-events-none opacity-[0.06]"
            style={{ border: "16px solid var(--color-gold)" }} />

          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--color-gold)" }} />
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.2em] font-body"
              style={{ color: "var(--color-gold-light)" }}
            >
              Exclusive Offer
            </span>
          </div>

          <button
            onClick={dismiss}
            aria-label="Close"
            className="relative z-10 h-7 w-7 rounded-full flex items-center justify-center transition-all duration-150"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.22)";
              (e.currentTarget as HTMLElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Thin gold line below header */}
        <div className="h-px shrink-0" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-gold), var(--color-primary))" }} />

        {/* ── Image (fixed aspect ratio 4:3) ── */}
        <div className="relative w-full overflow-hidden shrink-0" style={{ aspectRatio: "4 / 3" }}>
          {popup.linkUrl ? (
            <a href={popup.linkUrl} onClick={dismiss} className="absolute inset-0">
              <SmartImage src={popup.imageUrl} alt="Promotion" fill objectFit="cover" objectPosition="center top" />
            </a>
          ) : (
            <SmartImage src={popup.imageUrl} alt="Promotion" fill objectFit="cover" objectPosition="center top" />
          )}

          {/* Bottom image gradient */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(28,20,16,0.5) 0%, transparent 100%)" }}
          />
        </div>

        {/* ── Footer strip ── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ background: "var(--color-cream)", borderTop: "1px solid var(--color-parchment)" }}
        >
          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
            Limited time · Handcrafted sarees
          </p>
          {popup.linkUrl ? (
            <a
              href={popup.linkUrl}
              onClick={dismiss}
              className="text-[11px] font-semibold font-body uppercase tracking-[0.12em] px-4 py-1.5 rounded-full transition-all duration-150"
              style={{
                background: "var(--color-primary)",
                color: "white",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary-dark)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary)"; }}
            >
              Shop Now
            </a>
          ) : (
            <button
              onClick={dismiss}
              className="text-[11px] font-semibold font-body uppercase tracking-[0.12em] px-4 py-1.5 rounded-full transition-all duration-150"
              style={{ background: "var(--color-parchment)", color: "var(--color-text-secondary)" }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
