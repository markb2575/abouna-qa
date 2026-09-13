import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 20;

export type PublicQuestionListItem = {
  id: string;
  questionText: string;
  answerText: string | null;
  answeredAt: Date | null;
  categoryId: string | null;
  categoryName: string | null;
};

export async function searchPublicQuestions(params: {
  q?: string;
  categoryId?: string;
  page?: number;
}): Promise<{ items: PublicQuestionListItem[]; hasNextPage: boolean; page: number }> {
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;
  const q = params.q?.trim();

  let items: PublicQuestionListItem[];

  if (q) {
    const categoryFilter = params.categoryId
      ? Prisma.sql`AND q."categoryId" = ${params.categoryId}`
      : Prisma.empty;

    items = await prisma.$queryRaw<PublicQuestionListItem[]>`
      SELECT q.id, q."questionText", q."answerText", q."answeredAt", q."categoryId", c.name AS "categoryName"
      FROM "Question" q
      LEFT JOIN "Category" c ON c.id = q."categoryId"
      WHERE q."isPublic" = true
        AND q.status = 'ANSWERED'
        AND q."searchVector" @@ websearch_to_tsquery('english', ${q})
        ${categoryFilter}
      ORDER BY ts_rank(q."searchVector", websearch_to_tsquery('english', ${q})) DESC, q."answeredAt" DESC
      LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
    `;
  } else {
    const rows = await prisma.question.findMany({
      where: {
        isPublic: true,
        status: "ANSWERED",
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      },
      include: { category: true },
      orderBy: { answeredAt: "desc" },
      skip: offset,
      take: PAGE_SIZE + 1,
    });
    items = rows.map((r) => ({
      id: r.id,
      questionText: r.questionText,
      answerText: r.answerText,
      answeredAt: r.answeredAt,
      categoryId: r.categoryId,
      categoryName: r.category?.name ?? null,
    }));
  }

  const hasNextPage = items.length > PAGE_SIZE;
  return { items: items.slice(0, PAGE_SIZE), hasNextPage, page };
}

export async function getPublicQuestion(id: string) {
  const question = await prisma.question.findFirst({
    where: { id, isPublic: true, status: "ANSWERED" },
    include: { category: true },
  });
  return question;
}
