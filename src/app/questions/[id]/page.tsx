import { notFound } from "next/navigation";
import { getPublicQuestion } from "@/lib/questions";

export default async function PublicQuestionPage({ params }: PageProps<"/questions/[id]">) {
  const { id } = await params;
  const question = await getPublicQuestion(id);
  if (!question) notFound();

  return (
    <article className="flex flex-col gap-6">
      {question.categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {question.categories.map((c) => (
            <span
              key={c.id}
              className="w-fit rounded-full bg-accent/10 px-3 py-1 text-xs text-accent"
            >
              {c.name}
            </span>
          ))}
        </div>
      )}
      <h1 className="text-xl font-semibold">{question.questionText}</h1>
      <div className="rounded-lg border border-border bg-card p-4 whitespace-pre-wrap text-sm shadow-sm">
        {question.answerText}
      </div>
    </article>
  );
}
