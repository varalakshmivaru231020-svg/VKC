"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          id={`otp-${i}`}
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
            if (ch && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              document.getElementById(`otp-${i - 1}`)?.focus();
              const arr = value.split("");
              arr[i - 1] = "";
              onChange(arr.join(""));
            }
          }}
          className="w-11 h-14 text-center text-xl font-bold rounded-lg border-2 focus:outline-none transition-all"
          style={{
            borderColor: value[i] ? "var(--color-primary)" : "var(--color-parchment)",
            background: "white",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-body)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = value[i] ? "var(--color-primary)" : "var(--color-parchment)"; e.currentTarget.style.boxShadow = "none"; }}
        />
      ))}
    </div>
  );
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || "/account";

  const [phone,    setPhone]    = useState("");
  const [dialCode, setDialCode] = useState("+91");
  const [otp,      setOtp]      = useState("");
  const [step,     setStep]     = useState<"phone" | "otp">("phone");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [devOtp,    setDevOtp]    = useState("");
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(30);
    const t = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const sendOtp = async () => {
    setError("");
    setLoading(true);
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
      if (data.otp) setDevOtp(data.otp); // dev only
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) { setError("Enter the 6-digit OTP"); return; }
    setError("");
    setLoading(true);
    try {
      const result = await signIn("phone-otp", { phone: dialCode + phone, otp, redirect: false });
      if (result?.error) {
        setError("Invalid or expired OTP. Please try again.");
        setOtp("");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: "var(--color-primary)" }}>
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", color: "var(--color-text-primary)" }}>
          {step === "phone" ? "Welcome Back" : "Verify Mobile"}
        </h1>
        <p className="mt-2 text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
          {step === "phone"
            ? "Enter your mobile number to continue"
            : `OTP sent to ${dialCode} ${phone}`}
        </p>
      </div>

      <div className="p-7 rounded-xl" style={{ background: "white", border: "1px solid var(--color-parchment)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg text-sm font-body"
            style={{ background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
            {error}
          </div>
        )}

        {/* Dev OTP hint */}
        {devOtp && step === "otp" && (
          <div className="mb-4 px-3 py-2 rounded-lg text-xs font-body text-center"
            style={{ background: "#FEF9C3", color: "#92400E", border: "1px solid #FDE68A" }}>
            Dev mode — OTP: <strong>{devOtp}</strong>
          </div>
        )}

        {step === "phone" ? (
          <div className="space-y-5">
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
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Send OTP <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <OtpInput value={otp} onChange={setOtp} />
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
              {countdown > 0 ? (
                <span style={{ color: "var(--color-text-muted)" }}>Resend in {countdown}s</span>
              ) : (
                <button onClick={sendOtp} className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-sm font-body mt-6" style={{ color: "var(--color-text-muted)" }}>
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline" style={{ color: "var(--color-text-secondary)" }}>Terms</Link>
        {" "}&amp;{" "}
        <Link href="/privacy" className="underline" style={{ color: "var(--color-text-secondary)" }}>Privacy Policy</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
