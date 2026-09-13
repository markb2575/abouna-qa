import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession, type SessionOptions } from "iron-session";
import { prisma } from "@/lib/db";
import {
  generateRawToken,
  hashToken,
  expiryFromNow,
  isExpired,
  SESSION_TTL_MS,
  SESSION_REFRESH_THRESHOLD_MS,
} from "@/lib/tokens";

type SessionData = {
  priestId?: string;
  sessionToken?: string;
};

function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters");
  }
  return {
    cookieName: "abouna_priest_session",
    password: secret,
    ttl: SESSION_TTL_MS / 1000,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

async function getIronSessionData() {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}

/** Called from a Server Action or Route Handler after an invite/magic-link is verified. */
export async function createPriestSession(priestId: string): Promise<void> {
  const rawToken = generateRawToken();
  await prisma.priestSession.create({
    data: {
      priestId,
      tokenHash: hashToken(rawToken),
      expiresAt: expiryFromNow(SESSION_TTL_MS),
    },
  });

  const session = await getIronSessionData();
  session.priestId = priestId;
  session.sessionToken = rawToken;
  await session.save();
}

export type CurrentPriest = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

/** Returns the signed-in priest, or null. Also enforces DB-side revocation/expiry and bumps sliding expiration. */
export async function getCurrentPriest(): Promise<CurrentPriest | null> {
  const session = await getIronSessionData();
  if (!session.priestId || !session.sessionToken) return null;

  const dbSession = await prisma.priestSession.findUnique({
    where: { tokenHash: hashToken(session.sessionToken) },
    include: { priest: true },
  });

  if (!dbSession || dbSession.revokedAt || isExpired(dbSession.expiresAt)) {
    session.destroy();
    return null;
  }

  if (Date.now() - dbSession.lastSeenAt.getTime() > SESSION_REFRESH_THRESHOLD_MS) {
    await prisma.priestSession.update({
      where: { id: dbSession.id },
      data: { lastSeenAt: new Date(), expiresAt: expiryFromNow(SESSION_TTL_MS) },
    });
  }

  return {
    id: dbSession.priest.id,
    email: dbSession.priest.email,
    name: dbSession.priest.name,
    isAdmin: dbSession.priest.isAdmin,
  };
}

/** Server Component/Action guard: redirects to sign-in if no valid session. */
export async function requirePriest(): Promise<CurrentPriest> {
  const priest = await getCurrentPriest();
  if (!priest) redirect("/priest/sign-in");
  return priest;
}

/** Server Component/Action guard: redirects non-admins back to the dashboard. */
export async function requireAdmin(): Promise<CurrentPriest> {
  const priest = await requirePriest();
  if (!priest.isAdmin) redirect("/priest/dashboard");
  return priest;
}

export async function destroySession(): Promise<void> {
  const session = await getIronSessionData();
  if (session.sessionToken) {
    await prisma.priestSession
      .updateMany({
        where: { tokenHash: hashToken(session.sessionToken), revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => {});
  }
  session.destroy();
}
