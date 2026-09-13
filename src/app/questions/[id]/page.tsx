import { notFound } from "next/navigation";
import { getPublicQuestion } from "@/lib/questions";

export default async function PublicQuestionPage({ params }: PageProps<"/questions/[id]">) {
  const { id } = await params;
  const question = await getPublicQuestion(id);
  if (!question) notFound();

  return (
    <article className="flex flex-col gap-6">
      {question.category && (
        <span className="w-fit rounded-full bg-black/5 dark:bg-white/10 px-3 py-1 text-xs">
          {question.category.name}
        </span>
      )}
      <h1 className="text-xl font-semibold">{question.questionText}</h1>
      <div className="rounded-md border border-black/10 dark:border-white/10 p-4 whitespace-pre-wrap text-sm">
        {question.answerText}
      </div>
    </article>
  );
}
