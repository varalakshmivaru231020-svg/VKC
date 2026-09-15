import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST { email, source? }
 * Public — adds an address to the newsletter list (Admin can export the
 * `newsletter_subscribers` table). Used by the website footer form and the
 * app's "Sweetness in your inbox" block. Re-subscribing an existing address
 * is a no-op success, so a customer never sees "already subscribed".
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  const source = body?.source === "app" ? "app" : "website";

  try {
    await db.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true },
      create: { email, source },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[v1/newsletter]", err);
    return NextResponse.json({ error: "Could not subscribe right now" }, { status: 500 });
  }
}
