import Link from "next/link";
import { requirePriest } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AGE_RANGE_LABELS } from "@/lib/validation";

export const metadata = { title: "Priest Dashboard — Abouna Q&A" };

export default async function PriestDashboardPage({
  searchParams,
}: PageProps<"/priest/dashboard">) {
  const priest = await requirePriest();
  const params = await searchParams;
  const tab = params.tab === "answered" ? "answered" : "pending";

  const questions = await prisma.question.findMany({
    where: { status: tab === "pending" ? "PENDING" : "ANSWERED" },
    orderBy: { createdAt: tab === "pending" ? "asc" : "desc" },
    include: { category: true },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="opacity-70">{priest.name}</span>
          {priest.isAdmin && <Link href="/admin/invite" className="underline">Invite a priest</Link>}
          <Link href="/priest/account" className="underline">Account</Link>
        </div>
      </div>

      <div className="flex gap-4 border-b border-black/10 dark:border-white/10 text-sm">
        <Link
          href="/priest/dashboard?tab=pending"
          className={`pb-2 ${tab === "pending" ? "border-b-2 border-foreground font-medium" : "opacity-70"}`}
        >
          Pending
        </Link>
        <Link
          href="/priest/dashboard?tab=answered"
          className={`pb-2 ${tab === "answered" ? "border-b-2 border-foreground font-medium" : "opacity-70"}`}
        >
          Answered
        </Link>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm opacity-70">Nothing here.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {questions.map((q) => (
            <li key={q.id} className="rounded-md border border-black/10 dark:border-white/10 p-4">
              <Link href={`/priest/questions/${q.id}`} className="font-medium hover:underline">
                {q.questionText}
              </Link>
              <div className="mt-1 flex flex-wrap gap-2 text-xs opacity-70">
                <span>{AGE_RANGE_LABELS[q.ageRange]}</span>
                {q.category && <span>{q.category.name}</span>}
                {q.isPublic && <span>Public</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
