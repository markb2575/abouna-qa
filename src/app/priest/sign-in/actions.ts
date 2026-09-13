"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signInSchema } from "@/lib/validation";
import { generateRawToken, hashToken, expiryFromNow, MAGIC_LINK_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendMagicSignInEmail } from "@/lib/email";

export async function requestMagicLink(formData: FormData): Promise<void> {
  const parsed = signInSchema.safeParse({ email: formData.get("email") });

  if (parsed.success) {
    const priest = await prisma.priest.findUnique({ where: { email: parsed.data.email } });
    if (priest) {
      const rawToken = generateRawToken();
      await prisma.magicLinkToken.create({
        data: {
          priestId: priest.id,
          tokenHash: hashToken(rawToken),
          expiresAt: expiryFromNow(MAGIC_LINK_TOKEN_TTL_MS),
        },
      });
      await sendMagicSignInEmail({ to: priest.email, rawToken });
    }
  }

  // Same outcome whether or not the email matched a priest, so the form
  // never reveals which addresses are registered.
  redirect("/priest/sign-in/check-email");
}
