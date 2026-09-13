"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { inviteSchema } from "@/lib/validation";
import { generateRawToken, hashToken, expiryFromNow, INVITE_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendPriestInviteEmail } from "@/lib/email";

export type InviteState = {
  error?: string;
  success?: boolean;
};

export async function sendInvite(_prevState: InviteState, formData: FormData): Promise<InviteState> {
  const admin = await requireAdmin();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existingPriest = await prisma.priest.findUnique({ where: { email: parsed.data.email } });
  if (existingPriest) {
    return { error: "A priest account with this email already exists." };
  }

  const rawToken = generateRawToken();
  await prisma.priestInvite.create({
    data: {
      email: parsed.data.email,
      tokenHash: hashToken(rawToken),
      invitedById: admin.id,
      expiresAt: expiryFromNow(INVITE_TOKEN_TTL_MS),
    },
  });

  await sendPriestInviteEmail({ to: parsed.data.email, rawToken, invitedByName: admin.name });

  return { success: true };
}
