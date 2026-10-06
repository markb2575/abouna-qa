import { requirePriest } from "@/lib/session";
import { signOut } from "./actions";

export const metadata = { title: "Account — Abouna Q&A" };

export default async function PriestAccountPage() {
  const priest = await requirePriest();

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <h1 className="text-2xl font-semibold">Account</h1>
      <dl className="text-sm flex flex-col gap-1">
        <div>
          <dt className="inline font-medium">Name: </dt>
          <dd className="inline">{priest.name}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Email: </dt>
          <dd className="inline">{priest.email}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Church: </dt>
          <dd className="inline">{priest.church}</dd>
        </div>
        {priest.isAdmin && (
          <div>
            <dt className="inline font-medium">Role: </dt>
            <dd className="inline">Admin</dd>
          </div>
        )}
      </dl>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent/10"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
