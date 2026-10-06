import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requirePriest } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AGE_RANGE_LABELS } from "@/lib/validation";

export const metadata = { title: "Priest Dashboard — Abouna Q&A" };

const SORT_OPTIONS = {
  newest: { label: "Newest first", orderBy: { createdAt: "desc" } as const },
  oldest: { label: "Oldest first", orderBy: { createdAt: "asc" } as const },
  active: { label: "Recently active", orderBy: { updatedAt: "desc" } as const },
} satisfies Record<string, { label: string; orderBy: Prisma.QuestionOrderByWithRelationInput }>;

type SortKey = keyof typeof SORT_OPTIONS;

export default async function PriestDashboardPage({
  searchParams,
}: PageProps<"/priest/dashboard">) {
  const priest = await requirePriest();
  const params = await searchParams;
  const tab = params.tab === "answered" ? "answered" : "pending";
  const status = tab === "pending" ? "PENDING" : "ANSWERED";

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const categoryParam = params.category;
  const categoryIds = Array.isArray(categoryParam)
    ? categoryParam
    : typeof categoryParam === "string"
      ? [categoryParam]
      : [];
  const sortParam = typeof params.sort === "string" ? params.sort : "";
  const sort: SortKey = sortParam in SORT_OPTIONS ? (sortParam as SortKey) : tab === "pending" ? "oldest" : "newest";

  const [pendingCount, answeredCount, categories, questions] = await Promise.all([
    prisma.question.count({ where: { status: "PENDING" } }),
    prisma.question.count({ where: { status: "ANSWERED" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.question.findMany({
      where: {
        status,
        ...(q ? { questionText: { contains: q, mode: "insensitive" } } : {}),
        ...(categoryIds.length > 0
          ? { questionCategories: { some: { categoryId: { in: categoryIds } } } }
          : {}),
      },
      orderBy: SORT_OPTIONS[sort].orderBy,
      include: { questionCategories: { include: { category: true } } },
      take: 50,
    }),
  ]);

  function buildHref(overrides: { tab?: string; sort?: string }) {
    const sp = new URLSearchParams();
    sp.set("tab", overrides.tab ?? tab);
    sp.set("sort", overrides.sort ?? sort);
    if (q) sp.set("q", q);
    for (const id of categoryIds) sp.append("category", id);
    return `/priest/dashboard?${sp.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="opacity-70">{priest.name}</span>
          {priest.isAdmin && (
            <Link href="/admin/invite" className="hover:text-accent">
              Invite a priest
            </Link>
          )}
          <Link href="/priest/account" className="hover:text-accent">
            Account
          </Link>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border text-sm">
        <Link
          href={buildHref({ tab: "pending", sort: "oldest" })}
          className={`pb-2 ${tab === "pending" ? "border-b-2 border-accent font-medium text-accent" : "opacity-70"}`}
        >
          Pending ({pendingCount})
        </Link>
        <Link
          href={buildHref({ tab: "answered", sort: "newest" })}
          className={`pb-2 ${tab === "answered" ? "border-b-2 border-accent font-medium text-accent" : "opacity-70"}`}
        >
          Answered ({answeredCount})
        </Link>
      </div>

      <form className="flex flex-col gap-3" method="get">
        <input type="hidden" name="tab" value={tab} />
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search question text…"
            defaultValue={q}
            className="min-w-[200px] flex-1 rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
              <option key={key} value={key}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent/10"
          >
            Apply
          </button>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label
                key={c.id}
                className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-foreground hover:bg-accent/10 has-[:checked]:hover:bg-accent"
              >
                <input
                  type="checkbox"
                  name="category"
                  value={c.id}
                  defaultChecked={categoryIds.includes(c.id)}
                  className="sr-only"
                />
                {c.name}
              </label>
            ))}
          </div>
        )}
      </form>

      {questions.length === 0 ? (
        <p className="text-sm opacity-70">Nothing here.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {questions.map((question) => (
            <li key={question.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <Link href={`/priest/questions/${question.id}`} className="font-medium hover:text-accent">
                {question.questionText}
              </Link>
              <div className="mt-1 flex flex-wrap gap-2 text-xs opacity-70">
                <span>{AGE_RANGE_LABELS[question.ageRange]}</span>
                {question.questionCategories.map((qc) => (
                  <span key={qc.categoryId}>{qc.category.name}</span>
                ))}
                {question.askerChurch && <span>{question.askerChurch}</span>}
                {question.isPublic && <span>Public</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
