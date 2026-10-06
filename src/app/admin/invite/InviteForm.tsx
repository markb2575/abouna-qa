"use client";

import { useActionState, useState } from "react";
import { sendInvite, type InviteState } from "./actions";

const initialState: InviteState = {};

export function InviteForm() {
  const [state, formAction, isPending] = useActionState(sendInvite, initialState);
  const [email, setEmail] = useState("");

  // Controlled so a validation error doesn't wipe the field (React resets
  // uncontrolled fields whenever the action completes, success or not) — but
  // on an actual successful send, clearing it is exactly what we want. Adjusting
  // state during render (rather than in an effect) when `state` changes is the
  // pattern React recommends for this: https://react.dev/learn/you-might-not-need-an-effect
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setEmail("");
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-sm">
      <p className="text-xs text-muted-foreground">Fields marked * are required.</p>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Priest&apos;s email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-600" role="status">
          Invite sent.
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send Invite"}
      </button>
    </form>
  );
}
