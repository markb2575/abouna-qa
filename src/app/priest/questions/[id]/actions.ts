"use server";

import { redirect } from "next/navigation";
import { requirePriest } from "@/lib/session";
import { prisma } from "@/lib/db";
import { answerQuestionSchema, slugify } from "@/lib/validation";
import { sendQuestionAnsweredEmail } from "@/lib/email";

export type AnswerQuestionState = {
  error?: string;
};

export async function answerQuestion(
  _prevState: AnswerQuestionState,
  formData: FormData
): Promise<AnswerQuestionState> {
  const priest = await requirePriest();

  const categoryId = formData.get("categoryId");
  const newCategoryName = formData.get("newCategoryName");

  const parsed = answerQuestionSchema.safeParse({
    questionId: formData.get("questionId"),
    questionText: formData.get("questionText"),
    answerText: formData.get("answerText"),
    categoryId: categoryId === "__new__" || !categoryId ? undefined : categoryId,
    newCategoryName: categoryId === "__new__" ? newCategoryName || undefined : undefined,
    isPublic: formData.get("isPublic") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existingQuestion = await prisma.question.findUnique({ where: { id: parsed.data.questionId } });
  if (!existingQuestion) {
    return { error: "Question not found." };
  }

  let resolvedCategoryId = parsed.data.categoryId ?? existingQuestion.categoryId ?? undefined;

  if (parsed.data.newCategoryName) {
    const name = parsed.data.newCategoryName.trim();
    const category = await prisma.category.upsert({
      where: { name },
      create: { name, slug: slugify(name) },
      update: {},
    });
    resolvedCategoryId = category.id;
  }

  await prisma.question.update({
    where: { id: parsed.data.questionId },
    data: {
      questionText: parsed.data.questionText,
      answerText: parsed.data.answerText,
      categoryId: resolvedCategoryId ?? null,
      isPublic: parsed.data.isPublic,
      status: "ANSWERED",
      answeredByPriestId: priest.id,
      answeredAt: new Date(),
    },
  });

  await sendQuestionAnsweredEmail({
    to: existingQuestion.askerEmail,
    questionText: parsed.data.questionText,
    answerText: parsed.data.answerText,
    isPublic: parsed.data.isPublic,
    questionId: parsed.data.questionId,
  });

  redirect("/priest/dashboard?tab=answered");
}
