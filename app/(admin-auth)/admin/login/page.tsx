"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react";

function AdminLoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get("from") || "/admin";

  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("admin-credentials", {
        email:    form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid credentials. Only admin accounts can access this panel.");
      } else {
        router.push(from);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls   = "w-full h-11 px-4 border rounded-lg text-sm font-body focus:outline-none transition-all bg-white";
  const inputStyle = { borderColor: "#E5E7EB", color: "#111827" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F3F4F6" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "var(--color-primary)" }}>
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold font-body" style={{ color: "#111827" }}>Admin Sign In</h1>
          <p className="text-sm font-body mt-1" style={{ color: "#6B7280" }}>vkcgoldikshu Admin Panel</p>
        </div>

        <div className="rounded-2xl p-8 shadow-sm" style={{ background: "white", border: "1px solid #E5E7EB" }}>
          {error && (
            <div className="flex items-start gap-2 mb-5 px-4 py-3 rounded-lg text-sm font-body"
              style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5" }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@vkcgoldikshu.com"
                required
                autoComplete="email"
                className={inputCls}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium font-body" style={{ color: "#374151" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                  className={inputCls + " pr-10"}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: "#9CA3AF" }}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold font-body transition-all disabled:opacity-60 hover:opacity-90 mt-2"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : "Sign In to Admin"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-body mt-6" style={{ color: "#9CA3AF" }}>
          Not an admin?{" "}
          <a href="/" className="underline" style={{ color: "#6B7280" }}>Return to store</a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
