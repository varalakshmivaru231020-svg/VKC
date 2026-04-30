"use client";

import { useState } from "react";
import { X, ArrowRight, RotateCcw } from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { signIn } from "next-auth/react";
import { useUIStore } from "@/lib/store/ui";

function OtpBoxes({ value, onChange, idPrefix }: { value: string; onChange: (v: string) => void; idPrefix: string }) {
  return (
    <div className="flex gap-2 justify-center">
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
          className="w-10 h-12 text-center text-lg font-bold rounded-lg border-2 focus:outline-none transition-all"
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

  const [phone, setPhone]       = useState("");
  const [dialCode, setDialCode] = useState("+91");
  const [otp, setOtp]           = useState("");
  const [step, setStep]         = useState<"phone" | "otp">("phone");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [devOtp, setDevOtp]     = useState("");
  const [countdown, setCountdown] = useState(0);

  if (!loginModalOpen) return null;

  const reset = () => {
    setPhone(""); setDialCode("+91"); setOtp(""); setStep("phone");
    setError(""); setDevOtp(""); setCountdown(0);
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
      setStep("otp");
      startCountdown();
      if (data.otp) setDevOtp(data.otp);
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
      const result = await signIn("phone-otp", { phone: dialCode + phone, otp, redirect: false });
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

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--color-ivory)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full hover:bg-cream transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-8 pt-8 pb-6 border-b text-center" style={{ borderColor: "var(--color-parchment)" }}>
          <p className="text-xs font-body font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
            Vijaylakshmi Sarees
          </p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", color: "var(--color-text-primary)" }}>
            {step === "phone" ? "Sign in to continue" : "Verify Mobile"}
          </h2>
          <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
            {step === "phone"
              ? "Save your cart and track orders easily"
              : `OTP sent to ${dialCode} ${phone}`}
          </p>
        </div>

        <div className="p-7 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm font-body"
              style={{ background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
              {error}
            </div>
          )}

          {devOtp && step === "otp" && (
            <div className="px-3 py-2 rounded-lg text-xs font-body text-center"
              style={{ background: "#FEF9C3", color: "#92400E", border: "1px solid #FDE68A" }}>
              Dev mode — OTP: <strong>{devOtp}</strong>
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
              <OtpBoxes value={otp} onChange={setOtp} idPrefix="modal-otp" />

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold font-body transition-all disabled:opacity-50"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                {loading
                  ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "Verify & Sign In"}
              </button>

              <div className="flex items-center justify-between text-sm font-body">
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); setDevOtp(""); }}
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

        </div>
      </div>
    </div>
  );
}
