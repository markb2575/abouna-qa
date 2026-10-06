"use server";

import { redirect } from "next/navigation";
import { requirePriest } from "@/lib/session";
import { prisma } from "@/lib/db";
import { answerQuestionSchema } from "@/lib/validation";
import { sendQuestionAnsweredEmail } from "@/lib/email";

export type AnswerQuestionState = {
  error?: string;
};

export async function answerQuestion(
  _prevState: AnswerQuestionState,
  formData: FormData
): Promise<AnswerQuestionState> {
  const priest = await requirePriest();

  const parsed = answerQuestionSchema.safeParse({
    questionId: formData.get("questionId"),
    questionText: formData.get("questionText"),
    answerText: formData.get("answerText"),
    categoryIds: formData.getAll("categoryIds"),
    isPublic: formData.get("isPublic") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existingQuestion = await prisma.question.findUnique({ where: { id: parsed.data.questionId } });
  if (!existingQuestion) {
    return { error: "Question not found." };
  }

  const categoryIds = [...parsed.data.categoryIds];

  await prisma.$transaction([
    prisma.question.update({
      where: { id: parsed.data.questionId },
      data: {
        questionText: parsed.data.questionText,
        answerText: parsed.data.answerText,
        isPublic: parsed.data.isPublic,
        status: "ANSWERED",
        answeredByPriestId: priest.id,
        answeredAt: new Date(),
      },
    }),
    prisma.questionCategory.deleteMany({ where: { questionId: parsed.data.questionId } }),
    prisma.questionCategory.createMany({
      data: categoryIds.map((categoryId) => ({ questionId: parsed.data.questionId, categoryId })),
    }),
  ]);

  await sendQuestionAnsweredEmail({
    to: existingQuestion.askerEmail,
    questionText: parsed.data.questionText,
    answerText: parsed.data.answerText,
    isPublic: parsed.data.isPublic,
    questionId: parsed.data.questionId,
  });

  redirect("/priest/dashboard?tab=answered");
}
