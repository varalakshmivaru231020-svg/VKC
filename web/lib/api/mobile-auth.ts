import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken, type AccessPayload } from "./jwt";

export interface MobileUser {
  id: string;
  role: string;
  phone: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

/** Extract bearer token from Authorization header. */
export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  return m ? m[1].trim() : null;
}

/** Verify token and return user from DB. Returns null on any failure. */
export async function getMobileUser(req: Request): Promise<MobileUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload?.sub) return null;

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, phone: true, email: true, firstName: true, lastName: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return { id: user.id, role: user.role, phone: user.phone, email: user.email, firstName: user.firstName, lastName: user.lastName };
}

/** Helper to require auth in a route handler — returns either the user or a 401 NextResponse. */
export async function requireMobileUser(req: Request): Promise<MobileUser | NextResponse> {
  const user = await getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return user;
}

/** Type guard: tells TS whether requireMobileUser returned a NextResponse (= unauthorized). */
export function isUnauthorized(value: MobileUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export type { AccessPayload };
