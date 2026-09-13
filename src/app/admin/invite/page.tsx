import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isExpired } from "@/lib/tokens";
import { InviteForm } from "./InviteForm";

export const metadata = { title: "Invite a Priest — Abouna Q&A" };

export default async function AdminInvitePage() {
  await requireAdmin();

  const invites = await prisma.priestInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { invitedBy: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Invite a Priest</h1>
        <InviteForm />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Recent Invites</h2>
        {invites.length === 0 ? (
          <p className="text-sm opacity-70">No invites sent yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-4">
                <span>{invite.email}</span>
                <span className="opacity-70">
                  {invite.usedAt
                    ? "Accepted"
                    : isExpired(invite.expiresAt)
                      ? "Expired"
                      : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
