"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, RotateCcw, User } from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { signIn } from "next-auth/react";
import { useUIStore } from "@/lib/store/ui";

function OtpBoxes({ value, onChange, idPrefix }: { value: string; onChange: (v: string) => void; idPrefix: string }) {
  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          id={`${idPrefix}-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            const arr = value.split("");
            arr[i] = ch;
            const next = arr.join("").slice(0, 6);
            onChange(next);
            if (ch && i < 5) document.getElementById(`${idPrefix}-${i + 1}`)?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              document.getElementById(`${idPrefix}-${i - 1}`)?.focus();
              const arr = value.split("");
              arr[i - 1] = "";
              onChange(arr.join(""));
            }
          }}
          className="w-9 h-11 sm:w-10 sm:h-12 text-center text-base sm:text-lg font-bold rounded-lg border-2 focus:outline-none transition-all"
          style={{
            borderColor: value[i] ? "var(--color-primary)" : "var(--color-parchment)",
            background: "white",
            color: "var(--color-text-primary)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = value[i] ? "var(--color-primary)" : "var(--color-parchment)"; e.currentTarget.style.boxShadow = "none"; }}
        />
      ))}
    </div>
  );
}

export function LoginModal() {
  const { loginModalOpen, loginModalCallback, closeLoginModal } = useUIStore();

  const [phone, setPhone]         = useState("");
  const [dialCode, setDialCode]   = useState("+91");
  const [otp, setOtp]             = useState("");
  const [name, setName]           = useState("");
  const [isNew, setIsNew]         = useState(false);
  const [step, setStep]           = useState<"phone" | "otp">("phone");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [countdown, setCountdown] = useState(0);

  // Lock body scroll when open
  useEffect(() => {
    if (loginModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [loginModalOpen]);

  if (!loginModalOpen) return null;

  const reset = () => {
    setPhone(""); setDialCode("+91"); setOtp(""); setName("");
    setIsNew(false); setStep("phone"); setError(""); setCountdown(0);
  };

  const handleClose = () => { reset(); closeLoginModal(); };

  const startCountdown = () => {
    setCountdown(30);
    const t = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const sendOtp = async () => {
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: dialCode + phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
      setIsNew(!!data.isNew);
      setStep("otp");
      startCountdown();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) { setError("Enter the 6-digit OTP"); return; }
    setError(""); setLoading(true);
    try {
      const result = await signIn("phone-otp", {
        phone: dialCode + phone,
        otp,
        name: name.trim(),
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid or expired OTP. Please try again.");
        setOtp("");
      } else {
        reset();
        closeLoginModal();
        loginModalCallback?.();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = step === "phone" ? "Sign in to continue" : isNew ? "Create Account" : "Verify Mobile";
  const stepSub   = step === "phone"
    ? "Save your cart and track orders easily"
    : `OTP sent to ${dialCode} ${phone}`;

  return (
    /* Bottom sheet on mobile, centered dialog on sm+ */
    <div
      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl shadow-2xl overflow-y-auto"
        style={{ background: "var(--color-ivory)", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-parchment)" }} />
        </div>

        <button
          onClick={handleClose}
          className="absolute top-3 right-4 h-8 w-8 flex items-center justify-center rounded-full hover:bg-cream transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-5 sm:pb-6 border-b text-center" style={{ borderColor: "var(--color-parchment)" }}>
          <p className="text-xs font-body font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
            Vijaylakshmi Sarees
          </p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.45rem", color: "var(--color-text-primary)" }}>
            {stepTitle}
          </h2>
          <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
            {stepSub}
          </p>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm font-body"
              style={{ background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
              {error}
            </div>
          )}

          {step === "phone" ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium font-body" style={{ color: "var(--color-text-primary)" }}>
                  Mobile Number
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  dialCode={dialCode}
                  onDialCodeChange={setDialCode}
                  placeholder="Enter mobile number"
                  autoFocus
                  onEnter={() => phone.length >= 7 && sendOtp()}
                />
              </div>

              <button
                onClick={sendOtp}
                disabled={loading || phone.length < 7}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold font-body transition-all disabled:opacity-50"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                {loading
                  ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>Send OTP <ArrowRight className="h-4 w-4" /></>}
              </button>
            </>
          ) : (
            <>
              {/* Name field — only for new users */}
              {isNew && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium font-body" style={{ color: "var(--color-text-primary)" }}>
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      autoFocus
                      className="w-full h-11 pl-9 pr-4 rounded-lg border text-sm font-body focus:outline-none transition-all"
                      style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-parchment)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium font-body text-center" style={{ color: "var(--color-text-primary)" }}>
                  Enter 6-digit OTP
                </label>
                <OtpBoxes value={otp} onChange={setOtp} idPrefix="modal-otp" />
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold font-body transition-all disabled:opacity-50 whitespace-nowrap"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                {loading
                  ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : isNew ? "Create Account & Sign In" : "Verify & Sign In"}
              </button>

              <div className="flex items-center justify-between text-sm font-body">
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  className="flex items-center gap-1 hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Change number
                </button>
                {countdown > 0
                  ? <span style={{ color: "var(--color-text-muted)" }}>Resend in {countdown}s</span>
                  : <button onClick={sendOtp} className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>Resend OTP</button>}
              </div>
            </>
          )}

          {/* Safe area spacer for mobile home indicator */}
          <div className="sm:hidden h-2" />
        </div>
      </div>
    </div>
  );
}
