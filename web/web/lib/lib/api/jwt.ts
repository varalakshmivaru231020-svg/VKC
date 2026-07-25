import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ACCESS_SECRET  = new TextEncoder().encode(
  process.env.MOBILE_JWT_ACCESS_SECRET  || process.env.NEXTAUTH_SECRET || "dev-access-secret-change-me"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.MOBILE_JWT_REFRESH_SECRET || (process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET + ":refresh" : "dev-refresh-secret-change-me")
);

const ACCESS_TTL  = "1h";
const REFRESH_TTL = "30d";
const ISSUER   = "vijaylakshmi-mobile";
const AUDIENCE = "vijaylakshmi-app";

export interface AccessPayload extends JWTPayload {
  sub: string;        // user id
  role: string;
  phone?: string | null;
  type: "access";
}
export interface RefreshPayload extends JWTPayload {
  sub: string;
  type: "refresh";
}

export async function signAccessToken(input: { userId: string; role: string; phone?: string | null }) {
  return new SignJWT({ role: input.role, phone: input.phone ?? null, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ACCESS_TTL)
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(userId: string) {
  return new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(REFRESH_TTL)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET, { issuer: ISSUER, audience: AUDIENCE });
    if (payload.type !== "access") return null;
    return payload as AccessPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET, { issuer: ISSUER, audience: AUDIENCE });
    if (payload.type !== "refresh") return null;
    return payload as RefreshPayload;
  } catch {
    return null;
  }
}

export async function issueTokenPair(input: { userId: string; role: string; phone?: string | null }) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(input),
    signRefreshToken(input.userId),
  ]);
  return {
    accessToken,
    refreshToken,
    expiresIn: 60 * 60,           // 1 hour, in seconds
    refreshExpiresIn: 60 * 60 * 24 * 30, // 30 days
    tokenType: "Bearer" as const,
  };
}
