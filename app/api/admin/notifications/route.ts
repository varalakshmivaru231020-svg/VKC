import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyAll, pushConfigured } from "@/lib/push";

export const dynamic = "force-dynamic";

/** Setup status, how many phones are registered, and the campaigns sent so far. */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [devices, signedIn, campaigns] = await Promise.all([
    db.deviceToken.count(),
    db.deviceToken.count({ where: { userId: { not: null } } }),
    db.pushCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return NextResponse.json({ configured: pushConfigured(), devices, signedIn, campaigns });
}

/** POST { title, body, link? } — sends a notification to every registered phone. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await req.json().catch(() => ({}));
  const title = String(payload?.title ?? "").trim();
  const body = String(payload?.body ?? "").trim();
  const link = String(payload?.link ?? "").trim() || null;
  if (!title || !body) return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  if (title.length > 80 || body.length > 240) return NextResponse.json({ error: "Keep the title under 80 and the message under 240 characters" }, { status: 400 });
  if (link && !/^(\/[\w\-./?=&%]*|https?:\/\/\S+)$/.test(link)) return NextResponse.json({ error: "Link must be an app route like /shop or a full https URL" }, { status: 400 });
  if (!pushConfigured()) return NextResponse.json({ error: "Push is not configured on the server yet (Firebase service account missing)" }, { status: 409 });

  try {
    const result = await notifyAll({ title, body, link, data: { type: "campaign" } });
    const campaign = await db.pushCampaign.create({
      data: { title, body, link, sentCount: result.sent, failedCount: result.failed, createdById: (session.user as any).id ?? null },
    });
    return NextResponse.json({ campaign, result });
  } catch (err: any) {
    console.error("[admin/notifications]", err);
    return NextResponse.json({ error: err?.message || "Could not send" }, { status: 500 });
  }
}
