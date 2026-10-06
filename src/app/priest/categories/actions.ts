"use server";

import { revalidatePath } from "next/cache";
import { requirePriest } from "@/lib/session";
import { prisma } from "@/lib/db";
import { categoryNameSchema, slugify } from "@/lib/validation";

export type CategoryActionResult = {
  error?: string;
  category?: { id: string; name: string };
};

export async function createCategory(name: string): Promise<CategoryActionResult> {
  await requirePriest();

  const parsed = categoryNameSchema.safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category name." };
  }

  const existing = await prisma.category.findUnique({ where: { name: parsed.data } });
  if (existing) {
    return { error: "A category with this name already exists." };
  }

  const category = await prisma.category.create({
    data: { name: parsed.data, slug: slugify(parsed.data) },
  });

  revalidatePath("/priest/categories");
  revalidatePath("/priest/dashboard");
  return { category: { id: category.id, name: category.name } };
}

export async function updateCategory(id: string, name: string): Promise<CategoryActionResult> {
  await requirePriest();

  const parsed = categoryNameSchema.safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category name." };
  }

  const existing = await prisma.category.findUnique({ where: { name: parsed.data } });
  if (existing && existing.id !== id) {
    return { error: "A category with this name already exists." };
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name: parsed.data, slug: slugify(parsed.data) },
  });

  revalidatePath("/priest/categories");
  revalidatePath("/priest/dashboard");
  revalidatePath("/questions");
  return { category: { id: category.id, name: category.name } };
}

export async function deleteCategory(id: string): Promise<CategoryActionResult> {
  await requirePriest();

  // QuestionCategory.category has onDelete: Cascade — this only removes the
  // tag from any questions that had it, never the questions themselves.
  await prisma.category.delete({ where: { id } });

  revalidatePath("/priest/categories");
  revalidatePath("/priest/dashboard");
  revalidatePath("/questions");
  return {};
}
