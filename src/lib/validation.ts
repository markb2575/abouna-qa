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

// A church-location selection is "partial" for an asker (any subset of these
// three, in order) but must be a full, valid triple for a priest.
export const partialChurchLocationSchema = z
  .object({
    country: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    church: z.string().trim().min(1).optional(),
  })
  .refine((v) => !(v.state && !v.country), { message: "Select a country first." })
  .refine((v) => !(v.church && !v.state), { message: "Select a state/region first." });

export const requiredChurchLocationSchema = z.object({
  country: z.string().trim().min(1, "Country is required."),
  state: z.string().trim().min(1, "State/region is required."),
  church: z.string().trim().min(1, "Church is required."),
});

export const askQuestionSchema = z
  .object({
    questionText: z.string().trim().min(10, "Please provide a bit more detail.").max(4000),
    askerEmail: z.email("Please enter a valid email address."),
    ageRange: z.enum(AGE_RANGE_VALUES),
  })
  .and(partialChurchLocationSchema);

export const answerQuestionSchema = z.object({
  questionId: z.string().min(1),
  questionText: z.string().trim().min(10).max(4000),
  answerText: z.string().trim().min(1, "An answer is required.").max(8000),
  categoryIds: z.array(z.string().min(1)).default([]),
  isPublic: z.boolean(),
});

export const categoryNameSchema = z
  .string()
  .trim()
  .min(2, "Category name must be at least 2 characters.")
  .max(60, "Category name must be 60 characters or fewer.");

export const inviteSchema = z.object({
  email: z.email("Please enter a valid email address."),
});

export const signInSchema = z.object({
  email: z.email("Please enter a valid email address."),
});

export const acceptInviteSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().trim().min(1, "Name is required.").max(100),
  })
  .and(requiredChurchLocationSchema);

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
