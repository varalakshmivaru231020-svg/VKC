import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    await db.siteSetting.deleteMany();
    return NextResponse.json({ success: true, message: "Theme reset to defaults" });
  } catch (error) {
    console.error("[theme reset]", error);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
