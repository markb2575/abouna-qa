"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { acceptInviteSchema } from "@/lib/validation";
import { hashToken } from "@/lib/tokens";
import { createPriestSession } from "@/lib/session";

export type AcceptInviteState = {
  error?: string;
};

export async function acceptInvite(
  _prevState: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter your name." };
  }

  const tokenHash = hashToken(parsed.data.token);

  const invite = await prisma.priestInvite.findUnique({ where: { tokenHash } });
  if (!invite || invite.usedAt || invite.expiresAt.getTime() <= Date.now()) {
    return { error: "This invite link is invalid, expired, or already used." };
  }

  const existingPriest = await prisma.priest.findUnique({ where: { email: invite.email } });
  if (existingPriest) {
    return { error: "An account for this email already exists. Sign in instead." };
  }

  // Atomically claim the invite before creating the account.
  const claimed = await prisma.priestInvite.updateMany({
    where: { tokenHash, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) {
    return { error: "This invite link is invalid, expired, or already used." };
  }

  const priest = await prisma.priest.create({
    data: { email: invite.email, name: parsed.data.name },
  });

  await createPriestSession(priest.id);
  redirect("/priest/dashboard");
}
