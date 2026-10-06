import { requirePriest } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CategoryManager } from "./CategoryManager";

export const metadata = { title: "Categories — Abouna Q&A" };

export default async function CategoriesPage() {
  await requirePriest();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { questionCategories: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="text-sm text-muted-foreground">
        Manage the categories priests can tag questions with. Deleting a category only removes the
        tag from any questions that had it — the questions themselves are never affected.
      </p>
      <CategoryManager
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          count: c._count.questionCategories,
        }))}
      />
    </div>
  );
}
