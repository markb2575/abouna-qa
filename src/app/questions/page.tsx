import Link from "next/link";
import { prisma } from "@/lib/db";
import { searchPublicQuestions } from "@/lib/questions";

export const metadata = { title: "Browse Q&A — Abouna Q&A" };

export default async function QuestionsPage({
  searchParams,
}: PageProps<"/questions">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const categoryId = typeof params.category === "string" ? params.category : undefined;
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const [{ items, hasNextPage }, categories] = await Promise.all([
    searchPublicQuestions({ q, categoryId, page }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Browse Q&amp;A</h1>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          type="search"
          name="q"
          placeholder="Search questions and answers…"
          defaultValue={q}
          className="flex-1 min-w-[200px] rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
        />
        <select
          name="category"
          defaultValue={categoryId ?? ""}
          className="rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-black/20 dark:border-white/20 px-4 py-2 text-sm font-medium"
        >
          Search
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm opacity-70">No questions found.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border border-black/10 dark:border-white/10 p-4">
              <Link href={`/questions/${item.id}`} className="font-medium hover:underline">
                {item.questionText}
              </Link>
              {item.categoryName && (
                <div className="mt-1 text-xs opacity-70">{item.categoryName}</div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-4 text-sm">
        {page > 1 && (
          <Link href={buildPageHref(q, categoryId, page - 1)} className="underline">
            Previous
          </Link>
        )}
        {hasNextPage && (
          <Link href={buildPageHref(q, categoryId, page + 1)} className="underline">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

function buildPageHref(q: string | undefined, categoryId: string | undefined, page: number) {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (categoryId) sp.set("category", categoryId);
  sp.set("page", String(page));
  return `/questions?${sp.toString()}`;
}
