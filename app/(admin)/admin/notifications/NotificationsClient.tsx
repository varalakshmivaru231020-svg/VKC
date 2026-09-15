"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Send, Smartphone, UserCheck, AlertTriangle } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  body: string;
  link: string | null;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface Status {
  configured: boolean;
  devices: number;
  signedIn: number;
  campaigns: Campaign[];
}

const inputCls = "w-full px-3.5 py-2.5 border rounded-lg text-sm font-body focus:outline-none";
const inputStyle = { borderColor: "#E5E7EB", background: "white", color: "#111827" };

const PRESET_LINKS = [
  { label: "Home", value: "/home" },
  { label: "Shop", value: "/shop" },
  { label: "New arrivals", value: "/shop?sort=newest" },
  { label: "Categories", value: "/categories" },
  { label: "Cart", value: "/cart" },
];

export default function NotificationsClient() {
  const [status, setStatus] = useState<Status | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("/shop");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/notifications", { cache: "no-store" });
    if (res.ok) setStatus(await res.json());
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and message are required"); return; }
    if (!confirm(`Send this notification to ${status?.devices ?? 0} phone(s)?`)) return;
    setSending(true); setError(null); setDone(null);
    const res = await fetch("/api/admin/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, link }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { setError(data.error || "Could not send"); return; }
    setDone(`Sent to ${data.result.sent} phone(s)${data.result.failed ? `, ${data.result.failed} failed` : ""}.`);
    setTitle(""); setBody("");
    load();
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg grid place-items-center" style={{ background: "#FBE8D9", color: "#B65F1E" }}><Bell className="h-5 w-5" /></div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#111827" }}>Push Notifications</h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>Send a message to everyone who has the VKC Gold Ikshu app installed.</p>
        </div>
      </div>

      {status && !status.configured && (
        <div className="mb-6 rounded-lg border p-4 flex gap-3 text-sm" style={{ background: "#FFF7ED", borderColor: "#FED7AA", color: "#9A3412" }}>
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Push is not set up on the server yet.</div>
            <div className="mt-1">Add the Firebase service-account JSON to the server as <code>firebase-service-account.json</code> (or the <code>FIREBASE_SERVICE_ACCOUNT_JSON</code> environment variable) and restart the site. Phones can already register; sending starts working the moment the key is in place.</div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Smartphone, label: "Phones registered", value: status ? status.devices : "…" },
          { icon: UserCheck, label: "Signed-in customers", value: status ? status.signedIn : "…" },
          { icon: Send, label: "Campaigns sent", value: status ? status.campaigns.length : "…" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-4 bg-white" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide" style={{ color: "#6B7280" }}><s.icon className="h-4 w-4" />{s.label}</div>
            <div className="mt-2 text-2xl font-semibold" style={{ color: "#111827" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-5 mb-8" style={{ borderColor: "#E5E7EB" }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: "#111827" }}>New notification</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Title <span style={{ color: "#9CA3AF" }}>({title.length}/80)</span></label>
            <input className={inputCls} style={inputStyle} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Diwali gift boxes are here" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Message <span style={{ color: "#9CA3AF" }}>({body.length}/240)</span></label>
            <textarea className={inputCls} style={{ ...inputStyle, minHeight: 90 }} maxLength={240} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Pure jaggery hampers, packed for gifting. Order before 20 October for festival delivery." />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Opens</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_LINKS.map((p) => (
                <button key={p.value} type="button" onClick={() => setLink(p.value)} className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={link === p.value ? { background: "#B65F1E", color: "white", borderColor: "#B65F1E" } : { background: "white", color: "#374151", borderColor: "#E5E7EB" }}>
                  {p.label}
                </button>
              ))}
            </div>
            <input className={inputCls} style={inputStyle} value={link} onChange={(e) => setLink(e.target.value)} placeholder="/shop, /product/jaggery-gift-box or https://…" />
            <p className="mt-1.5 text-xs" style={{ color: "#6B7280" }}>An app screen (starts with /) or a full https link. Product pages are /product/&lt;slug&gt;.</p>
          </div>
          {error && <div className="text-sm rounded-md px-3 py-2" style={{ background: "#FEF2F2", color: "#B91C1C" }}>{error}</div>}
          {done && <div className="text-sm rounded-md px-3 py-2" style={{ background: "#ECFDF5", color: "#065F46" }}>{done}</div>}
          <div>
            <button type="button" onClick={send} disabled={sending || !status?.configured}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#B65F1E" }}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : `Send to ${status?.devices ?? 0} phone(s)`}
            </button>
          </div>
        </div>
      </div>

      <h2 className="text-base font-semibold mb-3" style={{ color: "#111827" }}>Sent</h2>
      <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        {!status || status.campaigns.length === 0 ? (
          <div className="p-6 text-sm" style={{ color: "#6B7280" }}>Nothing sent yet. Order updates (confirmed, shipped, delivered) go out automatically and are not listed here.</div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: "#F9FAFB", color: "#6B7280" }}>
              <tr>
                <th className="text-left font-medium px-4 py-2.5">When</th>
                <th className="text-left font-medium px-4 py-2.5">Notification</th>
                <th className="text-left font-medium px-4 py-2.5">Opens</th>
                <th className="text-right font-medium px-4 py-2.5">Sent</th>
              </tr>
            </thead>
            <tbody>
              {status.campaigns.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#6B7280" }}>{new Date(c.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-3"><div className="font-semibold" style={{ color: "#111827" }}>{c.title}</div><div style={{ color: "#4B5563" }}>{c.body}</div></td>
                  <td className="px-4 py-3" style={{ color: "#6B7280" }}>{c.link ?? "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap" style={{ color: "#111827" }}>{c.sentCount}{c.failedCount ? <span style={{ color: "#B91C1C" }}> · {c.failedCount} failed</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
