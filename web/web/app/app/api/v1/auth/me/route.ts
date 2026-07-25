import { NextResponse } from "next/server";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export async function GET(req: Request) {
  const result = await requireMobileUser(req);
  if (isUnauthorized(result)) return result;
  return NextResponse.json({ user: result });
}
