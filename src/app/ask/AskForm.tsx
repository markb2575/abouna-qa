"use client";

import { useActionState } from "react";
import { submitQuestion, type AskQuestionState } from "./actions";
import { AGE_RANGE_VALUES, AGE_RANGE_LABELS } from "@/lib/validation";

const initialState: AskQuestionState = {};

export function AskForm() {
  const [state, formAction, isPending] = useActionState(submitQuestion, initialState);

  if (state.success) {
    return (
      <div className="rounded-md border border-green-600/30 bg-green-600/10 p-4 text-sm">
        Thank you — your question has been submitted. You&apos;ll receive an email once a priest
        answers.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1">
        <label htmlFor="questionText" className="text-sm font-medium">
          Your question
        </label>
        <textarea
          id="questionText"
          name="questionText"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          className="rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="askerEmail" className="text-sm font-medium">
          Your email
        </label>
        <input
          id="askerEmail"
          name="askerEmail"
          type="email"
          required
          className="rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
        />
        <p className="text-xs opacity-70">
          Used only to send you the answer. Never shown publicly.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ageRange" className="text-sm font-medium">
          Age range
        </label>
        <select
          id="ageRange"
          name="ageRange"
          required
          defaultValue=""
          className="rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
        >
          <option value="" disabled>
            Select an age range
          </option>
          {AGE_RANGE_VALUES.map((value) => (
            <option key={value} value={value}>
              {AGE_RANGE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit Question"}
      </button>
    </form>
  );
}
