"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, ChevronUp, Phone } from "lucide-react";
import { useSession } from "next-auth/react";

// ── Helpers ────────────────────────────────────────────────────────────────────

function DisplayField({ label, value, placeholder = "Not set" }: {
  label: string; value: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <p
        className="text-[11px] font-body font-semibold uppercase tracking-[0.1em]"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      <div
        className="h-11 px-4 border rounded-sm flex items-center text-sm font-body"
        style={{
          borderColor: "var(--color-parchment)",
          background: "var(--color-ivory)",
          color: value ? "var(--color-text-primary)" : "var(--color-text-disabled)",
        }}
      >
        {value || placeholder}
      </div>
    </div>
  );
}

function EditInput({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-4 border rounded-sm text-sm font-body focus:outline-none transition-all"
        style={{ borderColor: "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-primary)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--color-parchment)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function SaveCancel({
  onSave, onCancel, saving,
}: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-8 py-2.5 rounded-sm text-sm font-body font-semibold transition-all disabled:opacity-60"
        style={{ background: "var(--color-primary)", color: "white" }}
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
      <button
        onClick={onCancel}
        className="px-6 py-2.5 rounded-sm text-sm font-body font-medium border transition-colors hover:bg-cream"
        style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}
      >
        Cancel
      </button>
    </div>
  );
}

function SectionCard({ title, onEdit, editing = false, children }: {
  title: string;
  onEdit?: () => void;
  editing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="border rounded-sm overflow-hidden"
      style={{ background: "white", borderColor: "var(--color-parchment)" }}
    >
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}
      >
        <h2 className="text-sm font-body font-bold" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </h2>
        {onEdit && !editing && (
          <button
            onClick={onEdit}
            className="text-sm font-body font-semibold hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-primary)" }}
          >
            Edit
          </button>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      className="w-full text-left border-b py-4 last:border-0 transition-colors"
      style={{ borderColor: "var(--color-parchment)" }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {question}
        </p>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--color-text-muted)" }} />
          : <ChevronDown className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--color-text-muted)" }} />
        }
      </div>
      {open && (
        <p className="mt-2 text-sm font-body text-left" style={{ color: "var(--color-text-muted)" }}>
          {answer}
        </p>
      )}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { update: updateSession } = useSession();

  const [loaded, setLoaded]   = useState(false);
  const [globalError, setGlobalError] = useState("");

  // Persisted data
  const [phone, setPhone]       = useState("");
  const [personal, setPersonal] = useState({ firstName: "", lastName: "" });
  const [email, setEmail]       = useState("");

  // Edit drafts
  const [personalDraft, setPersonalDraft] = useState({ firstName: "", lastName: "" });
  const [emailDraft, setEmailDraft]       = useState("");

  // Edit modes
  const [editPersonal, setEditPersonal] = useState(false);
  const [editEmail, setEditEmail]       = useState(false);

  // Saving states
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingEmail, setSavingEmail]       = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return;
        setPersonal({ firstName: user.firstName ?? "", lastName: user.lastName ?? "" });
        setEmail(user.email ?? "");
        setPhone(user.phone ? user.phone.replace(/^\+91/, "") : "");
      })
      .catch(() => setGlobalError("Failed to load profile. Please refresh."))
      .finally(() => setLoaded(true));
  }, []);

  const patchProfile = async (body: object) => {
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to save");
    return res;
  };

  const savePersonal = async () => {
    setSavingPersonal(true);
    setGlobalError("");
    try {
      await patchProfile({ ...personalDraft, email });
      setPersonal(personalDraft);
      setEditPersonal(false);
      await updateSession();
    } catch {
      setGlobalError("Failed to save personal info. Please try again.");
    } finally {
      setSavingPersonal(false);
    }
  };

  const saveEmail = async () => {
    setSavingEmail(true);
    setGlobalError("");
    try {
      await patchProfile({ ...personal, email: emailDraft });
      setEmail(emailDraft);
      setEditEmail(false);
    } catch {
      setGlobalError("Failed to save email. Please try again.");
    } finally {
      setSavingEmail(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="h-7 w-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 lg:px-10 py-8 space-y-4">

      {globalError && (
        <div
          className="px-4 py-3 rounded-sm text-sm font-body"
          style={{ background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}
        >
          {globalError}
        </div>
      )}

      {/* ── Personal Information ── */}
      <SectionCard
        title="Personal Information"
        editing={editPersonal}
        onEdit={() => { setPersonalDraft({ ...personal }); setEditPersonal(true); setGlobalError(""); }}
      >
        {editPersonal ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditInput
                label="First Name"
                value={personalDraft.firstName}
                onChange={(v) => setPersonalDraft((p) => ({ ...p, firstName: v }))}
                placeholder="Priya"
              />
              <EditInput
                label="Last Name"
                value={personalDraft.lastName}
                onChange={(v) => setPersonalDraft((p) => ({ ...p, lastName: v }))}
                placeholder="Sharma"
              />
            </div>
            <SaveCancel onSave={savePersonal} onCancel={() => setEditPersonal(false)} saving={savingPersonal} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DisplayField label="First Name" value={personal.firstName} />
            <DisplayField label="Last Name"  value={personal.lastName} />
          </div>
        )}
      </SectionCard>

      {/* ── Email Address ── */}
      <SectionCard
        title="Email Address"
        editing={editEmail}
        onEdit={() => { setEmailDraft(email); setEditEmail(true); setGlobalError(""); }}
      >
        {editEmail ? (
          <div className="space-y-4">
            <EditInput
              label="Email Address"
              value={emailDraft}
              onChange={setEmailDraft}
              type="email"
              placeholder="priya@example.com"
            />
            <SaveCancel onSave={saveEmail} onCancel={() => setEditEmail(false)} saving={savingEmail} />
          </div>
        ) : (
          <DisplayField label="Email Address" value={email} placeholder="Not added" />
        )}
      </SectionCard>

      {/* ── Mobile Number (always read-only) ── */}
      <SectionCard title="Mobile Number">
        <div className="space-y-3">
          <div className="space-y-1">
            <p
              className="text-[11px] font-body font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--color-text-muted)" }}
            >
              Mobile Number
            </p>
            <div
              className="flex items-center border rounded-sm overflow-hidden"
              style={{ borderColor: "var(--color-parchment)", background: "var(--color-ivory)" }}
            >
              <div
                className="flex items-center gap-1.5 px-4 h-11 border-r text-sm font-body shrink-0"
                style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)", background: "var(--color-cream)" }}
              >
                <Phone className="h-3.5 w-3.5" /> +91
              </div>
              <span
                className="flex-1 px-4 text-sm font-body"
                style={{ color: phone ? "var(--color-text-primary)" : "var(--color-text-disabled)" }}
              >
                {phone || "Not set"}
              </span>
              {phone && (
                <span
                  className="flex items-center gap-1 px-4 text-xs font-body font-semibold"
                  style={{ color: "var(--color-success)" }}
                >
                  <Check className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
          </div>
          <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
            Mobile number is verified via OTP and cannot be changed here. Contact support if needed.
          </p>
        </div>
      </SectionCard>

      {/* ── FAQs ── */}
      <div className="pt-2">
        <h3 className="text-sm font-body font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          FAQs
        </h3>
        {[
          {
            q: "What happens when I update my email address?",
            a: "Your login email changes accordingly. You will receive all order-related communications on the updated email address.",
          },
          {
            q: "Can I change my mobile number?",
            a: "Your mobile number is your login identity and is verified via OTP. To change it, please contact our support team.",
          },
          {
            q: "How is my personal data used?",
            a: "Your data is used only to personalise your shopping experience and to send order updates. We never share your details with third parties.",
          },
        ].map(({ q, a }) => (
          <FAQItem key={q} question={q} answer={a} />
        ))}
      </div>
    </div>
  );
}
