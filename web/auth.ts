import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface User { role: string; phone?: string | null }
  interface Session {
    user: { id: string; role: string; name?: string | null; email?: string | null; phone?: string | null }
  }
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.startsWith("91") && digits.length === 12) return "+" + digits;
  return "+" + digits;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // ── Admin: email + password ───────────────────────────────────────────────
    Credentials({
      id: "admin-credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email    = (credentials?.email    as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password  as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || !user.isActive || user.role !== "ADMIN") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          role:  user.role,
          phone: user.phone,
        };
      },
    }),

    // ── Customer: mobile OTP ─────────────────────────────────────────────────
    Credentials({
      id: "phone-otp",
      credentials: { phone: {}, otp: {} },
      async authorize(credentials) {
        const rawPhone = credentials?.phone as string | undefined;
        const otp      = credentials?.otp   as string | undefined;
        if (!rawPhone || !otp) return null;

        const phone = normalisePhone(rawPhone);

        const record = await db.otpCode.findFirst({
          where: {
            phone,
            code:      otp,
            used:      false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });
        if (!record) return null;

        await db.otpCode.update({ where: { id: record.id }, data: { used: true } });

        let user = await db.user.findUnique({ where: { phone } });
        if (!user) {
          user = await db.$transaction(async (tx) => {
            const last = await tx.user.findFirst({
              where: { customerNumber: { not: null } },
              orderBy: { customerNumber: "desc" },
              select: { customerNumber: true },
            });
            return tx.user.create({
              data: {
                phone,
                role:           "CUSTOMER",
                isActive:       true,
                phoneVerified:  true,
                customerNumber: (last?.customerNumber ?? 0) + 1,
              },
            });
          });
        } else if (!user.phoneVerified) {
          await db.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
        }

        return {
          id:    user.id,
          email: user.email,
          name:  [user.firstName, user.lastName].filter(Boolean).join(" ") || phone,
          role:  user.role,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id    = user.id   as string;
        token.role  = user.role as string;
        token.phone = (user as any).phone as string | null | undefined;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id    = token.id    as string;
      session.user.role  = token.role  as string;
      session.user.phone = token.phone as string | null | undefined;
      return session;
    },
  },
});
