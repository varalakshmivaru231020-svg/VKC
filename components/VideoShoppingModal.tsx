"use client";

import { useState } from "react";
import { Video, X, Check } from "lucide-react";
import { useUIStore } from "@/lib/store/ui";

const TIME_SLOTS = ["10:00 AM – 1:00 PM", "2:00 PM – 5:00 PM", "6:00 PM – 8:00 PM"];

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const EMPTY_FORM = { name: "", phone: "", email: "", preferredDate: "", preferredTime: TIME_SLOTS[0], notes: "" };

/**
 * Rendered once at the marketing layout level (like QuickViewModal / LoginModal)
 * so it survives the mobile nav drawer closing — it used to live inside
 * VideoShoppingButton itself, which meant tapping it from the mobile menu
 * unmounted the modal the instant it opened, since the drawer's own close
 * handler tore down the whole subtree it was nested in.
 */
export function VideoShoppingModal() {
  const { videoShoppingOpen: open, closeVideoShopping } = useUIStore();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  if (!open) return null;

  const close = () => {
    closeVideoShopping();
    setTimeout(() => { setDone(false); setError(null); setForm(EMPTY_FORM); }, 250);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.phone.trim() || !form.preferredDate) {
      setError("Please fill your name, phone number, and preferred date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/video-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not submit your request. Please try again.");
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "var(--color-ivory)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-parchment)" }} />
        </div>

        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: "var(--color-primary)" }}>
          <div className="flex items-center gap-2" style={{ color: "white" }}>
            <Video className="h-4 w-4" />
            <span className="text-sm font-semibold font-body">Book a Video Shopping Appointment</span>
          </div>
          <button onClick={close} aria-label="Close" className="h-7 w-7 flex items-center justify-center rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-y-auto min-h-0">
          {done ? (
            <div className="p-8 text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--color-success-bg, #E8F5E9)" }}>
                <Check className="h-7 w-7" style={{ color: "var(--color-success)" }} />
              </div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
                Request Received!
              </p>
              <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
                Our team will review your request and contact you shortly to confirm your video shopping slot.
              </p>
              <button onClick={close} className="mt-2 h-10 px-6 rounded-lg text-sm font-body font-semibold" style={{ background: "var(--color-primary)", color: "white" }}>
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="p-5 space-y-3">
              <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                See our sarees live over a video call with our team — tell us when works for you and we'll get in touch to confirm.
              </p>
              <input
                type="text" placeholder="Your Name" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full h-11 px-3 text-base sm:text-sm font-body border rounded-lg focus:outline-none"
                style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
              />
              <input
                type="tel" placeholder="Phone Number" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full h-11 px-3 text-base sm:text-sm font-body border rounded-lg focus:outline-none"
                style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
              />
              <input
                type="email" placeholder="Email (optional)" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full h-11 px-3 text-base sm:text-sm font-body border rounded-lg focus:outline-none"
                style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date" value={form.preferredDate} min={todayPlus(1)}
                  onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                  className="w-full h-11 px-3 text-base sm:text-sm font-body border rounded-lg focus:outline-none"
                  style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                />
                <select
                  value={form.preferredTime}
                  onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
                  className="w-full h-11 px-3 text-base sm:text-sm font-body border rounded-lg focus:outline-none"
                  style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                >
                  {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
              <textarea
                placeholder="What would you like us to show you? (optional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-base sm:text-sm font-body border rounded-lg focus:outline-none resize-none"
                style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
              />
              {error && <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg text-sm font-body font-semibold transition-opacity disabled:opacity-60"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
              {/* Safe area spacer for mobile */}
              <div className="sm:hidden h-1" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
