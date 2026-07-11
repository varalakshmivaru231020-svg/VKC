"use client";

import { useState } from "react";
import { Video, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TIME_SLOTS = ["10:00 AM – 1:00 PM", "2:00 PM – 5:00 PM", "6:00 PM – 8:00 PM"];

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function VideoShoppingButton({ className = "", onTrigger }: { className?: string; onTrigger?: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", preferredDate: "", preferredTime: TIME_SLOTS[0], notes: "",
  });

  const close = () => {
    setOpen(false);
    setTimeout(() => { setDone(false); setError(null); setForm({ name: "", phone: "", email: "", preferredDate: "", preferredTime: TIME_SLOTS[0], notes: "" }); }, 250);
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
        throw new Error(data.error || "Something went wrong");
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Could not book your appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { onTrigger?.(); setOpen(true); }}
        className={cn("inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-body font-semibold transition-all duration-150", className)}
        style={{ background: "var(--color-primary)", color: "white" }}
      >
        <Video className="h-4 w-4" />
        Video Shopping
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "var(--color-ivory)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ background: "var(--color-primary)" }}>
              <div className="flex items-center gap-2" style={{ color: "white" }}>
                <Video className="h-4 w-4" />
                <span className="text-sm font-semibold font-body">Book a Video Shopping Appointment</span>
              </div>
              <button onClick={close} aria-label="Close" className="h-7 w-7 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {done ? (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--color-success-bg, #E8F5E9)" }}>
                  <Check className="h-7 w-7" style={{ color: "var(--color-success)" }} />
                </div>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
                  Appointment Requested!
                </p>
                <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
                  We'll call you shortly to confirm your video shopping slot and share the call link.
                </p>
                <button onClick={close} className="mt-2 h-10 px-6 rounded-lg text-sm font-body font-semibold" style={{ background: "var(--color-primary)", color: "white" }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-3">
                <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
                  See our sarees live over a video call with our team — tell us when works for you.
                </p>
                <input
                  type="text" placeholder="Your Name" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-3 text-sm font-body border rounded-lg focus:outline-none"
                  style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                />
                <input
                  type="tel" placeholder="Phone Number" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full h-10 px-3 text-sm font-body border rounded-lg focus:outline-none"
                  style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                />
                <input
                  type="email" placeholder="Email (optional)" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full h-10 px-3 text-sm font-body border rounded-lg focus:outline-none"
                  style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                />
                <div className="flex gap-2">
                  <input
                    type="date" value={form.preferredDate} min={todayPlus(1)}
                    onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                    className="w-full h-10 px-3 text-sm font-body border rounded-lg focus:outline-none"
                    style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                  />
                  <select
                    value={form.preferredTime}
                    onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
                    className="w-full h-10 px-3 text-sm font-body border rounded-lg focus:outline-none"
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
                  className="w-full px-3 py-2 text-sm font-body border rounded-lg focus:outline-none resize-none"
                  style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                />
                {error && <p className="text-xs font-body" style={{ color: "var(--color-error)" }}>{error}</p>}
                <button
                  type="submit" disabled={submitting}
                  className="w-full h-11 rounded-lg text-sm font-body font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: "var(--color-primary)", color: "white" }}
                >
                  {submitting ? "Booking…" : "Request Appointment"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
