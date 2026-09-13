"use server";

import { prisma } from "@/lib/db";
import { askQuestionSchema } from "@/lib/validation";

export type AskQuestionState = {
  error?: string;
  success?: boolean;
};

export async function submitQuestion(
  _prevState: AskQuestionState,
  formData: FormData
): Promise<AskQuestionState> {
  const parsed = askQuestionSchema.safeParse({
    questionText: formData.get("questionText"),
    askerEmail: formData.get("askerEmail"),
    ageRange: formData.get("ageRange"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your answers and try again." };
  }

  const { questionText, askerEmail, ageRange } = parsed.data;

  await prisma.question.create({
    data: {
      questionText,
      originalQuestionText: questionText,
      askerEmail,
      ageRange,
    },
  });

  return { success: true };
}
