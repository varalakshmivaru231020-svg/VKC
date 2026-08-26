"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Check, MessageSquare } from "lucide-react";

interface Props {
  phone: string;
  email: string;
  address: string;
  city: string;
  hoursWeekday: string;
  hoursWeekend: string;
  whatsappNumber: string;
  mapsUrl: string;
}

const topics = ["Order Query", "Product Question", "Styling Advice", "Wholesale / Bulk", "Return / Exchange", "Other"];

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactClient({
  phone,
  email,
  address,
  city,
  hoursWeekday,
  hoursWeekend,
  whatsappNumber,
  mapsUrl,
}: Props) {
  // Only show a card when the detail is actually configured — an empty card is
  // better than one inviting customers to call a number that isn't the store's.
  const info = [
    { icon: Phone, label: "Phone", value: phone, sub: hoursWeekday, href: phone ? `tel:${phone.replace(/\s/g, "")}` : undefined },
    { icon: Mail,  label: "Email", value: email, sub: "We reply within 24 hours", href: email ? `mailto:${email}` : undefined },
    { icon: MapPin,label: "Store", value: address, sub: city, href: mapsUrl || undefined },
    { icon: Clock, label: "Hours", value: hoursWeekday, sub: hoursWeekend },
  ].filter((c) => c.value);
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const focusStyle = {
    onFocus: (e: React.FocusEvent<any>) => {
      e.currentTarget.style.borderColor = "var(--color-primary)";
      e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)";
    },
    onBlur: (e: React.FocusEvent<any>) => {
      e.currentTarget.style.borderColor = "#E5E7EB";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  const inputCls = "w-full h-11 px-4 border rounded-xl text-sm font-body focus:outline-none transition-all";
  const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setStatus("sending");
    // Simulate send — wire to real API / Resend when ready
    await new Promise((r) => setTimeout(r, 1400));
    setStatus("sent");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>

      {/* ── HEADER ── */}
      <div
        className="py-16 text-center border-b"
        style={{ background: "var(--color-cream)", borderColor: "var(--color-parchment)" }}
      >
        <span className="text-xs font-semibold tracking-[0.18em] uppercase font-body" style={{ color: "var(--color-gold)" }}>
          We'd Love to Hear From You
        </span>
        <h1
          className="mt-3"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-h1)",
            fontWeight: "var(--weight-heading)",
            color: "var(--color-text-primary)",
          }}
        >
          Get in Touch
        </h1>
        <p
          className="mt-3 text-base font-body max-w-md mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          Questions about an order, styling advice, or just want to say hello?
          We're here for you.
        </p>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ── Contact Info ── */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2
                className="text-lg font-semibold font-body mb-1"
                style={{ color: "var(--color-text-primary)" }}
              >
                Contact Information
              </h2>
              <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
                Reach us through any of these channels.
              </p>
            </div>

            <div className="space-y-4">
              {info.map(({ icon: Icon, label, value, sub, href }) => {
                const Wrapper = href ? "a" : "div";
                return (
                  <Wrapper
                    key={label}
                    {...(href ? { href, target: href.startsWith("http") ? "_blank" : undefined, rel: "noopener" } : {})}
                    className="flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm group"
                    style={{ background: "white", borderColor: "#E5E7EB", textDecoration: "none" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-primary"
                      style={{ background: "var(--color-primary-50)" }}
                    >
                      <Icon className="h-4.5 w-4.5 transition-colors duration-200 group-hover:text-white" style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-widest font-body mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {label}
                      </p>
                      <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                        {value}
                      </p>
                      <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {sub}
                      </p>
                    </div>
                  </Wrapper>
                );
              })}
            </div>

            {/* WhatsApp quick link — hidden until a real number is configured,
                so the button never opens a chat with someone else's number. */}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold font-body transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#25D366", color: "white" }}
              >
                <MessageSquare className="h-4.5 w-4.5" />
                Chat on WhatsApp
              </a>
            )}
          </div>

          {/* ── Form ── */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl border p-8"
              style={{ background: "white", borderColor: "#E5E7EB" }}
            >
              {status === "sent" ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "#D1FAE5" }}
                  >
                    <Check className="h-7 w-7" style={{ color: "#059669" }} />
                  </div>
                  <h3
                    className="text-xl font-semibold font-body"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Message Sent!
                  </h3>
                  <p className="text-sm font-body max-w-xs" style={{ color: "var(--color-text-muted)" }}>
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setForm({ name: "", email: "", phone: "", topic: "", message: "" }); setStatus("idle"); }}
                    className="text-sm font-body font-medium transition-colors hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold font-body mb-1" style={{ color: "var(--color-text-primary)" }}>
                      Send a Message
                    </h2>
                    <p className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
                      Fill in the form and we'll respond within 24 hours.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
                        Your Name <span style={{ color: "var(--color-error)" }}>*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) => set("name")(e.target.value)}
                        placeholder="Priya Sharma"
                        required
                        className={inputCls}
                        style={inputStyle}
                        {...focusStyle}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
                        Email Address <span style={{ color: "var(--color-error)" }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email")(e.target.value)}
                        placeholder="priya@email.com"
                        required
                        className={inputCls}
                        style={inputStyle}
                        {...focusStyle}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Phone (optional)</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone")(e.target.value)}
                        placeholder="+91 98765 43210"
                        className={inputCls}
                        style={inputStyle}
                        {...focusStyle}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>Topic</label>
                      <select
                        value={form.topic}
                        onChange={(e) => set("topic")(e.target.value)}
                        className={inputCls + " appearance-none"}
                        style={{
                          ...inputStyle,
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 12px center",
                          backgroundSize: "16px",
                        }}
                        {...focusStyle}
                      >
                        <option value="">Select a topic</option>
                        {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
                      Message <span style={{ color: "var(--color-error)" }}>*</span>
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => set("message")(e.target.value)}
                      rows={5}
                      required
                      placeholder="Tell us how we can help…"
                      className="w-full px-4 py-3 border rounded-xl text-sm font-body focus:outline-none transition-all resize-none"
                      style={inputStyle}
                      {...focusStyle}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl text-sm font-semibold font-body transition-all hover:shadow-md hover:opacity-90 disabled:opacity-60"
                    style={{ background: "var(--color-primary)", color: "white" }}
                  >
                    {status === "sending" ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
