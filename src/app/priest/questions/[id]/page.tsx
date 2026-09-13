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
    prisma.question.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!question) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Answer Question</h1>
      <dl className="text-xs opacity-70 flex gap-4">
        <div>
          <dt className="inline font-medium">Asker age range: </dt>
          <dd className="inline">{AGE_RANGE_LABELS[question.ageRange]}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Submitted: </dt>
          <dd className="inline">{question.createdAt.toLocaleDateString()}</dd>
        </div>
      </dl>
      <AnswerForm question={question} categories={categories} />
    </div>
  );
}
