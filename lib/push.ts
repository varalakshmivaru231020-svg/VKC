import { createSign } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { db } from "@/lib/db";

/**
 * Push notifications to the customer app through Firebase Cloud Messaging
 * (HTTP v1). No SDK: the service account signs a JWT, Google swaps it for a
 * short-lived access token, and each message is one POST.
 *
 * Configuration (either one):
 *   FIREBASE_SERVICE_ACCOUNT_JSON  — the service-account JSON, inline
 *   FIREBASE_SERVICE_ACCOUNT_FILE  — path to the JSON file
 *                                    (default: ./firebase-service-account.json)
 *
 * Until one is present, every send is a no-op that reports "not configured",
 * so the site and the admin panel keep working without Firebase.
 */

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export interface PushMessage {
  title: string;
  body: string;
  /** App route ("/orders/abc") or a full URL; the app opens it on tap. */
  link?: string | null;
  data?: Record<string, string>;
}

export interface PushResult {
  configured: boolean;
  sent: number;
  failed: number;
  removed: number;
}

let account: ServiceAccount | null | undefined;
let cachedToken: { value: string; expiresAt: number } | null = null;

function loadAccount(): ServiceAccount | null {
  if (account !== undefined) return account;
  try {
    const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const raw = inline && inline.trim()
      ? inline
      : readFileSync(path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_FILE || "firebase-service-account.json"), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) throw new Error("service account is missing fields");
    account = { project_id: parsed.project_id, client_email: parsed.client_email, private_key: String(parsed.private_key).replace(/\\n/g, "\n") };
  } catch {
    account = null;
  }
  return account;
}

export function pushConfigured(): boolean {
  return loadAccount() !== null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(sa.private_key));
  const assertion = `${header}.${claims}.${signature}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: now + (json.expires_in || 3600) };
  return json.access_token;
}

/** Sends one message to one device. Resolves to "ok", "invalid" (token gone) or "error". */
async function sendOne(sa: ServiceAccount, bearer: string, token: string, msg: PushMessage): Promise<"ok" | "invalid" | "error"> {
  const data: Record<string, string> = { ...(msg.data ?? {}) };
  if (msg.link) data.route = msg.link;
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: msg.title, body: msg.body },
        data,
        android: { priority: "high", notification: { channel_id: "vkc_default", sound: "default" } },
        apns: { payload: { aps: { sound: "default" } } },
      },
    }),
  });
  if (res.ok) return "ok";
  const text = await res.text();
  if (res.status === 404 || /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/.test(text)) return "invalid";
  console.error("[push] send failed", res.status, text.slice(0, 300));
  return "error";
}

/** Sends to a list of device tokens, pruning any the platform reports as gone. */
export async function sendToTokens(tokens: string[], msg: PushMessage): Promise<PushResult> {
  const sa = loadAccount();
  if (!sa) return { configured: false, sent: 0, failed: 0, removed: 0 };
  const unique = Array.from(new Set(tokens.filter(Boolean)));
  if (unique.length === 0) return { configured: true, sent: 0, failed: 0, removed: 0 };
  const bearer = await accessToken(sa);
  let sent = 0, failed = 0;
  const invalid: string[] = [];
  const batch = 20;
  for (let i = 0; i < unique.length; i += batch) {
    const results = await Promise.all(unique.slice(i, i + batch).map((t) => sendOne(sa, bearer, t, msg).catch(() => "error" as const)));
    results.forEach((r, j) => {
      if (r === "ok") sent += 1;
      else { failed += 1; if (r === "invalid") invalid.push(unique[i + j]); }
    });
  }
  if (invalid.length) await db.deviceToken.deleteMany({ where: { token: { in: invalid } } }).catch(() => {});
  return { configured: true, sent, failed, removed: invalid.length };
}

/** Every registered device (a campaign from the admin panel). */
export async function notifyAll(msg: PushMessage): Promise<PushResult> {
  const rows = await db.deviceToken.findMany({ select: { token: true } });
  return sendToTokens(rows.map((r) => r.token), msg);
}

/** Every device signed in as this customer. */
export async function notifyUser(userId: string, msg: PushMessage): Promise<PushResult> {
  const rows = await db.deviceToken.findMany({ where: { userId }, select: { token: true } });
  return sendToTokens(rows.map((r) => r.token), msg);
}

const STATUS_COPY: Record<string, { title: string; body: (n: string) => string }> = {
  CONFIRMED:  { title: "Order confirmed",     body: (n) => `Order ${n} is confirmed. We are getting it ready.` },
  PROCESSING: { title: "Order packed",        body: (n) => `Order ${n} is packed and will ship soon.` },
  SHIPPED:    { title: "Order shipped",       body: (n) => `Order ${n} is on its way to you.` },
  DELIVERED:  { title: "Order delivered",     body: (n) => `Order ${n} has been delivered. Enjoy!` },
  CANCELLED:  { title: "Order cancelled",     body: (n) => `Order ${n} has been cancelled.` },
  REFUNDED:   { title: "Refund processed",    body: (n) => `The refund for order ${n} has been processed.` },
  RETURN_APPROVED: { title: "Return approved", body: (n) => `The return for order ${n} has been approved.` },
  RETURN_PICKUP_ASSIGNED: { title: "Return pickup scheduled", body: (n) => `A pickup has been arranged for the return of order ${n}.` },
};

/** Tells the customer their order moved to [status]; silent when there is nothing to say. */
export async function notifyOrderStatus(order: { id: string; orderNumber: string; userId: string | null; status: string }): Promise<void> {
  const copy = STATUS_COPY[order.status];
  if (!copy || !order.userId) return;
  await notifyUser(order.userId, { title: copy.title, body: copy.body(order.orderNumber), link: `/orders/${order.id}`, data: { type: "order", orderId: order.id } });
}
