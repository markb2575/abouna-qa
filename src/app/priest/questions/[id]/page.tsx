import { notFound } from "next/navigation";
import { requirePriest } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AGE_RANGE_LABELS } from "@/lib/validation";
import { AnswerForm } from "./AnswerForm";

export default async function PriestQuestionPage({
  params,
}: PageProps<"/priest/questions/[id]">) {
  await requirePriest();
  const { id } = await params;

  const [question, categories] = await Promise.all([
    prisma.question.findUnique({
      where: { id },
      include: { questionCategories: { select: { categoryId: true } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { questionCategories: true } } },
    }),
  ]);

  if (!question) notFound();

  const location = [question.askerChurch, question.askerState, question.askerCountry].find(
    (v) => v
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Answer Question</h1>
      <dl className="flex flex-wrap gap-4 text-xs opacity-70">
        <div>
          <dt className="inline font-medium">Asker age range: </dt>
          <dd className="inline">{AGE_RANGE_LABELS[question.ageRange]}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Submitted: </dt>
          <dd className="inline">{question.createdAt.toLocaleDateString()}</dd>
        </div>
        {location && (
          <div>
            <dt className="inline font-medium">Asker&apos;s location: </dt>
            <dd className="inline">{location}</dd>
          </div>
        )}
      </dl>
      <AnswerForm
        question={{
          id: question.id,
          questionText: question.questionText,
          answerText: question.answerText,
          isPublic: question.isPublic,
          categoryIds: question.questionCategories.map((qc) => qc.categoryId),
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name, count: c._count.questionCategories }))}
      />
    </div>
  );
}
