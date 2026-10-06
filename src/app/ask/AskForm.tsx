"use client";

import { useActionState, useState } from "react";
import { submitQuestion, type AskQuestionState } from "./actions";
import { AGE_RANGE_VALUES, AGE_RANGE_LABELS } from "@/lib/validation";
import { ChurchPicker } from "@/components/ChurchPicker";

const initialState: AskQuestionState = {};

export function AskForm() {
  const [state, formAction, isPending] = useActionState(submitQuestion, initialState);

  // Controlled so a validation error (which never throws — see actions.ts)
  // doesn't trigger React's automatic form-reset-on-action-completion and
  // wipe out what was already typed.
  const [questionText, setQuestionText] = useState("");
  const [askerEmail, setAskerEmail] = useState("");
  const [ageRange, setAgeRange] = useState("");

  if (state.success) {
    return (
      <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm">
        Thank you — your question has been submitted. You&apos;ll receive an email once a priest
        answers.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <p className="text-xs text-muted-foreground">Fields marked * are required.</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="questionText" className="text-sm font-medium">
          Your question <span className="text-red-500">*</span>
        </label>
        <textarea
          id="questionText"
          name="questionText"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="askerEmail" className="text-sm font-medium">
          Your email <span className="text-red-500">*</span>
        </label>
        <input
          id="askerEmail"
          name="askerEmail"
          type="email"
          required
          value={askerEmail}
          onChange={(e) => setAskerEmail(e.target.value)}
          className="rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs opacity-70">
          Used only to send you the answer. Never shown publicly.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ageRange" className="text-sm font-medium">
          Age range <span className="text-red-500">*</span>
        </label>
        <select
          id="ageRange"
          name="ageRange"
          required
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          className="rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Your church (optional)</span>
        <p className="text-xs text-muted-foreground">
          Stays private — only used to notify a priest at your own church, and never shown
          publicly. Pick as much or as little as you&apos;re comfortable with.
        </p>
        <ChurchPicker />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit Question"}
      </button>
    </form>
  );
}
