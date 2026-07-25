import { NextResponse } from "next/server";

// Stateless logout — client deletes its tokens. This endpoint exists so the
// app has a single conceptual logout call, and so we can hook server-side
// session cleanup later (e.g. push-token deregistration).
export async function POST() {
  return NextResponse.json({ success: true });
}
