import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 20;

export type PublicQuestionListItem = {
  id: string;
  questionText: string;
  answerText: string | null;
  answeredAt: Date | null;
  categories: { id: string; name: string }[];
};

export async function searchPublicQuestions(params: {
  q?: string;
  categoryIds?: string[];
  page?: number;
}): Promise<{ items: PublicQuestionListItem[]; hasNextPage: boolean; page: number }> {
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;
  const q = params.q?.trim();
  const categoryIds = params.categoryIds?.filter(Boolean) ?? [];

  let ids: string[];

  if (q) {
    const categoryFilter =
      categoryIds.length > 0
        ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM "QuestionCategory" qc
            WHERE qc."questionId" = q.id AND qc."categoryId" IN (${Prisma.join(categoryIds)})
          )`
        : Prisma.empty;

    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT q.id
      FROM "Question" q
      WHERE q."isPublic" = true
        AND q.status = 'ANSWERED'
        AND q."searchVector" @@ websearch_to_tsquery('english', ${q})
        ${categoryFilter}
      ORDER BY ts_rank(q."searchVector", websearch_to_tsquery('english', ${q})) DESC, q."answeredAt" DESC
      LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
    `;
    ids = rows.map((r) => r.id);
  } else {
    const rows = await prisma.question.findMany({
      where: {
        isPublic: true,
        status: "ANSWERED",
        ...(categoryIds.length > 0
          ? { questionCategories: { some: { categoryId: { in: categoryIds } } } }
          : {}),
      },
      select: { id: true },
      orderBy: { answeredAt: "desc" },
      skip: offset,
      take: PAGE_SIZE + 1,
    });
    ids = rows.map((r) => r.id);
  }

  const hasNextPage = ids.length > PAGE_SIZE;
  const pageIds = ids.slice(0, PAGE_SIZE);

  if (pageIds.length === 0) {
    return { items: [], hasNextPage: false, page };
  }

  // Fetch full rows (order not guaranteed by IN, so re-sort to match `pageIds`).
  const questions = await prisma.question.findMany({
    where: { id: { in: pageIds } },
    include: { questionCategories: { include: { category: true } } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  const items: PublicQuestionListItem[] = pageIds
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => !!q)
    .map((q) => ({
      id: q.id,
      questionText: q.questionText,
      answerText: q.answerText,
      answeredAt: q.answeredAt,
      categories: q.questionCategories.map((qc) => ({ id: qc.category.id, name: qc.category.name })),
    }));

  return { items, hasNextPage, page };
}

export async function getPublicQuestion(id: string) {
  const question = await prisma.question.findFirst({
    where: { id, isPublic: true, status: "ANSWERED" },
    include: { questionCategories: { include: { category: true } } },
  });
  if (!question) return null;
  return {
    ...question,
    categories: question.questionCategories.map((qc) => qc.category),
  };
}
