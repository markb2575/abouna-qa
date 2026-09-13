import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { createPriestSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const signInUrl = new URL("/priest/sign-in?error=invalid-link", request.url);

  if (!token) {
    return NextResponse.redirect(signInUrl);
  }

  const tokenHash = hashToken(token);

  // Atomically claim the token: only one request can flip usedAt from null.
  const claimed = await prisma.magicLinkToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  if (claimed.count === 0) {
    return NextResponse.redirect(signInUrl);
  }

  const magicLinkToken = await prisma.magicLinkToken.findUnique({ where: { tokenHash } });
  if (!magicLinkToken) {
    return NextResponse.redirect(signInUrl);
  }

  await createPriestSession(magicLinkToken.priestId);

  return NextResponse.redirect(new URL("/priest/dashboard", request.url));
}
