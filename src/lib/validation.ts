import { z } from "zod";

export const AGE_RANGE_VALUES = [
  "UNDER_18",
  "AGE_18_25",
  "AGE_26_40",
  "AGE_41_60",
  "AGE_60_PLUS",
] as const;

export const AGE_RANGE_LABELS: Record<(typeof AGE_RANGE_VALUES)[number], string> = {
  UNDER_18: "Under 18",
  AGE_18_25: "18–25",
  AGE_26_40: "26–40",
  AGE_41_60: "41–60",
  AGE_60_PLUS: "60+",
};

export const askQuestionSchema = z.object({
  questionText: z.string().trim().min(10, "Please provide a bit more detail.").max(4000),
  askerEmail: z.email("Please enter a valid email address."),
  ageRange: z.enum(AGE_RANGE_VALUES),
});

export const answerQuestionSchema = z.object({
  questionId: z.string().min(1),
  questionText: z.string().trim().min(10).max(4000),
  answerText: z.string().trim().min(1, "An answer is required.").max(8000),
  categoryId: z.string().min(1).optional(),
  newCategoryName: z.string().trim().min(2).max(60).optional(),
  isPublic: z.boolean(),
});

export const inviteSchema = z.object({
  email: z.email("Please enter a valid email address."),
});

export const signInSchema = z.object({
  email: z.email("Please enter a valid email address."),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(1, "Name is required.").max(100),
});

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
