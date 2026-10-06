"use server";

import { prisma } from "@/lib/db";
import { askQuestionSchema } from "@/lib/validation";
import { sendNewQuestionFromYourChurchEmail } from "@/lib/email";

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
    country: formData.get("country") || undefined,
    state: formData.get("state") || undefined,
    church: formData.get("church") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your answers and try again." };
  }

  const { questionText, askerEmail, ageRange, country, state, church } = parsed.data;

  const question = await prisma.question.create({
    data: {
      questionText,
      originalQuestionText: questionText,
      askerEmail,
      ageRange,
      askerCountry: country,
      askerState: state,
      askerChurch: church,
    },
  });

  if (church) {
    const matchingPriests = await prisma.priest.findMany({ where: { church } });
    await Promise.all(
      matchingPriests.map((priest) =>
        sendNewQuestionFromYourChurchEmail({
          to: priest.email,
          questionText: question.questionText,
          church,
        })
      )
    );
  }

  return { success: true };
}
