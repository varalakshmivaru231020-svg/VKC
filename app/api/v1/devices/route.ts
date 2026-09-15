import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

/**
 * POST { token, platform?, appVersion? }
 * Registers the phone's push token. Signed-in customers are attached to the
 * token so order updates reach them; a guest's token still receives store
 * announcements. Re-registering the same token just refreshes it — the app
 * calls this at launch, on token refresh, and whenever sign-in changes.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? "").trim();
  if (!token || token.length > 512) return NextResponse.json({ error: "token is required" }, { status: 400 });
  const platform = body?.platform === "ios" ? "ios" : "android";
  const appVersion = body?.appVersion ? String(body.appVersion).slice(0, 40) : null;
  const user = await getMobileUser(req);

  try {
    await db.deviceToken.upsert({
      where: { token },
      update: { userId: user?.id ?? null, platform, appVersion, lastSeenAt: new Date() },
      create: { token, userId: user?.id ?? null, platform, appVersion, lastSeenAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[v1/devices]", err);
    return NextResponse.json({ error: "Could not register device" }, { status: 500 });
  }
}

/** DELETE ?token=… — forgets a device (the app calls it when a token is retired). */
export async function DELETE(req: Request) {
  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });
  await db.deviceToken.deleteMany({ where: { token } }).catch(() => {});
  return NextResponse.json({ success: true });
}
