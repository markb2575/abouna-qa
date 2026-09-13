import { prisma } from "@/lib/db";
import { hashToken, isExpired } from "@/lib/tokens";
import { AcceptInviteForm } from "./AcceptInviteForm";

export default async function AcceptInvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const invite = await prisma.priestInvite.findUnique({ where: { tokenHash: hashToken(token) } });

  const isValid = !!invite && !invite.usedAt && !isExpired(invite.expiresAt);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Accept Priest Invite</h1>
      {isValid ? (
        <AcceptInviteForm token={token} email={invite.email} />
      ) : (
        <p className="text-sm text-red-600">
          This invite link is invalid, expired, or already used. Ask an admin to send a new one.
        </p>
      )}
    </div>
  );
}
