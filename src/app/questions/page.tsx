import Link from "next/link";
import { prisma } from "@/lib/db";
import { searchPublicQuestions } from "@/lib/questions";

export const metadata = { title: "Browse Q&A — Abouna Q&A" };

export default async function QuestionsPage({
  searchParams,
}: PageProps<"/questions">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const categoryParam = params.category;
  const categoryIds = Array.isArray(categoryParam)
    ? categoryParam
    : typeof categoryParam === "string"
      ? [categoryParam]
      : [];
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const [{ items, hasNextPage }, categories] = await Promise.all([
    searchPublicQuestions({ q, categoryIds, page }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Browse Q&amp;A</h1>

      <form className="flex flex-col gap-3" method="get">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search questions and answers…"
            defaultValue={q}
            className="min-w-[200px] flex-1 rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent/10"
          >
            Search
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

      {items.length === 0 ? (
        <p className="text-sm opacity-70">No questions found.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <Link href={`/questions/${item.id}`} className="font-medium hover:text-accent">
                {item.questionText}
              </Link>
              {item.categories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.categories.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-4 text-sm">
        {page > 1 && (
          <Link href={buildPageHref(q, categoryIds, page - 1)} className="underline">
            Previous
          </Link>
        )}
        {hasNextPage && (
          <Link href={buildPageHref(q, categoryIds, page + 1)} className="underline">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

function buildPageHref(q: string | undefined, categoryIds: string[], page: number) {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  for (const id of categoryIds) sp.append("category", id);
  sp.set("page", String(page));
  return `/questions?${sp.toString()}`;
}
