"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const messages = [
  "Free shipping all over India",
  "15-day no-questions-asked returns",
  "New Arrivals: Kanjivaram 2026 — Shop Now",
  "50+ weaver families · 15 states · one curated store",
];

export function AnnouncementBar() {
  const [visible, setVisible]   = useState(false);
  const [idx, setIdx]           = useState(0);
  const [fading, setFading]     = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("vl-ann-closed")) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % messages.length);
        setFading(false);
      }, 300);
    }, 4000);
    return () => clearInterval(t);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("vl-ann-closed", "1");
  };

  if (!visible) return null;

  return (
    <div
      className="relative flex items-center justify-center h-9 px-10 overflow-hidden"
      style={{ background: "var(--color-text-primary)" }}
    >
      {/* Gold accent lines */}
      <div className="absolute inset-x-0 top-0 h-px opacity-25" style={{ background: "var(--color-gold)" }} />
      <div className="absolute inset-x-0 bottom-0 h-px opacity-25" style={{ background: "var(--color-gold)" }} />

      {/* Cycling message */}
      <p
        className="text-[11.5px] font-body font-medium tracking-[0.06em] text-center select-none transition-opacity duration-300"
        style={{
          color: "var(--color-gold-light)",
          opacity: fading ? 0 : 1,
        }}
      >
        <span className="opacity-50 mr-2" style={{ color: "var(--color-gold)" }}>✦</span>
        {messages[idx]}
        <span className="opacity-50 ml-2" style={{ color: "var(--color-gold)" }}>✦</span>
      </p>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Close announcement"
        className="absolute right-4 opacity-40 hover:opacity-80 transition-opacity"
      >
        <X className="h-3.5 w-3.5" style={{ color: "var(--color-gold-light)" }} />
      </button>
    </div>
  );
}
