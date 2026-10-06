"use client";

import { useActionState, useState, useTransition } from "react";
import { answerQuestion, type AnswerQuestionState } from "./actions";
import { createCategory } from "../../categories/actions";

const initialState: AnswerQuestionState = {};

type Category = { id: string; name: string; count: number };

export function AnswerForm({
  question,
  categories: initialCategories,
}: {
  question: {
    id: string;
    questionText: string;
    answerText: string | null;
    categoryIds: string[];
    isPublic: boolean;
  };
  categories: Category[];
}) {
  const [state, formAction, isPending] = useActionState(answerQuestion, initialState);

  // Controlled so a validation error doesn't trigger React's
  // reset-on-action-completion and wipe out what was already typed.
  const [questionText, setQuestionText] = useState(question.questionText);
  const [answerText, setAnswerText] = useState(question.answerText ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(question.categoryIds);
  const [isPublic, setIsPublic] = useState(question.isPublic);

  // Categories are local state (not just a prop) so adding one updates the
  // checkbox list immediately, without submitting or reloading the page.
  const [categories, setCategories] = useState(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isAddingCategory, startAddCategory] = useTransition();

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleAddCategory() {
    setCategoryError(null);
    const name = newCategoryName.trim();
    if (!name) return;
    startAddCategory(async () => {
      const result = await createCategory(name);
      if (result.error) {
        setCategoryError(result.error);
        return;
      }
      if (result.category) {
        setCategories((prev) =>
          [...prev, { ...result.category!, count: 0 }].sort((a, b) => a.name.localeCompare(b.name))
        );
        setSelectedCategoryIds((prev) => [...prev, result.category!.id]);
        setNewCategoryName("");
      }
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-2xl">
      <p className="text-xs text-muted-foreground">Fields marked * are required.</p>
      <input type="hidden" name="questionId" value={question.id} />

      <div className="flex flex-col gap-1">
        <label htmlFor="questionText" className="text-sm font-medium">
          Question (editable) <span className="text-red-500">*</span>
        </label>
        <textarea
          id="questionText"
          name="questionText"
          required
          rows={4}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="answerText" className="text-sm font-medium">
          Answer <span className="text-red-500">*</span>
        </label>
        <textarea
          id="answerText"
          name="answerText"
          required
          rows={8}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          className="rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Categories</legend>
        <div className="flex flex-col gap-1 rounded-md border border-border p-2 max-h-48 overflow-auto">
          {categories.length === 0 ? (
            <p className="text-sm opacity-70">No categories yet — create one below.</p>
          ) : (
            categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={c.id}
                  checked={selectedCategoryIds.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
                />
                {c.name} <span className="text-xs opacity-60">({c.count} question{c.count === 1 ? "" : "s"})</span>
              </label>
            ))
          )}
        </div>
        <div className="mt-1 flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            placeholder="New category name…"
            className="flex-1 rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={isAddingCategory || !newCategoryName.trim()}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent/10 disabled:opacity-50"
          >
            {isAddingCategory ? "Adding…" : "Add"}
          </button>
        </div>
        {categoryError && (
          <p className="text-sm text-red-600" role="alert">
            {categoryError}
          </p>
        )}
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        Make this question and answer public
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save & Notify Asker"}
      </button>
    </form>
  );
}
