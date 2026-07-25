import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueTokenPair, verifyRefreshToken } from "@/lib/api/jwt";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json({ error: "refreshToken required" }, { status: 400 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload?.sub) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, phone: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User no longer active" }, { status: 401 });
    }

    const tokens = await issueTokenPair({ userId: user.id, role: user.role, phone: user.phone });
    return NextResponse.json({ success: true, ...tokens });
  } catch (err) {
    console.error("[v1/auth/refresh]", err);
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
  }
}
