import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id   = user.id   as string;
        token.role = user.role as string;
      }
      return token;
    },
    session({ session, token }: { session: any; token: any }) {
      session.user.id   = token.id   as string;
      session.user.role = token.role as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
