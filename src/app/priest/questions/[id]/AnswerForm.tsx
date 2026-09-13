"use client";

import { useActionState, useState } from "react";
import { answerQuestion, type AnswerQuestionState } from "./actions";

const initialState: AnswerQuestionState = {};

const NEW_CATEGORY_VALUE = "__new__";

type Category = { id: string; name: string };

export function AnswerForm({
  question,
  categories,
}: {
  question: {
    id: string;
    questionText: string;
    answerText: string | null;
    categoryId: string | null;
    isPublic: boolean;
  };
  categories: Category[];
}) {
  const [state, formAction, isPending] = useActionState(answerQuestion, initialState);
  const [categorySelection, setCategorySelection] = useState(question.categoryId ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-2xl">
      <input type="hidden" name="questionId" value={question.id} />

      <div className="flex flex-col gap-1">
        <label htmlFor="questionText" className="text-sm font-medium">
          Question (editable)
        </label>
        <textarea
          id="questionText"
          name="questionText"
          required
          rows={4}
          defaultValue={question.questionText}
          className="rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="answerText" className="text-sm font-medium">
          Answer
        </label>
        <textarea
          id="answerText"
          name="answerText"
          required
          rows={8}
          defaultValue={question.answerText ?? ""}
          className="rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={categorySelection}
          onChange={(e) => setCategorySelection(e.target.value)}
          className="rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NEW_CATEGORY_VALUE}>+ Create new category…</option>
        </select>
        {categorySelection === NEW_CATEGORY_VALUE && (
          <input
            name="newCategoryName"
            required
            placeholder="New category name"
            className="mt-1 rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
          />
        )}
        {/* Reserved slot: an AI-suggested category would render here once that
            feature is built (see aiSuggestedCategoryLabel on Question). */}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublic" defaultChecked={question.isPublic} />
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
        className="w-fit rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save & Notify Asker"}
      </button>
    </form>
  );
}
