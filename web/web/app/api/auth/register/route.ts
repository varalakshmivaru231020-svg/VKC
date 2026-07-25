import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password } = await req.json();

    if (!email?.trim() || !password?.trim())
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    const existing = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing)
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.$transaction(async (tx) => {
      const last = await tx.user.findFirst({
        where: { customerNumber: { not: null } },
        orderBy: { customerNumber: "desc" },
        select: { customerNumber: true },
      });
      return tx.user.create({
        data: {
          email:          email.trim().toLowerCase(),
          firstName:      firstName?.trim() || null,
          lastName:       lastName?.trim()  || null,
          phone:          phone?.trim()     || null,
          passwordHash,
          role:           "CUSTOMER",
          customerNumber: (last?.customerNumber ?? 0) + 1,
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
