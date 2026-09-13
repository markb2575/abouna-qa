"use client";

import { useActionState } from "react";
import { acceptInvite, type AcceptInviteState } from "./actions";

const initialState: AcceptInviteState = {};

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, isPending] = useActionState(acceptInvite, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-sm">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <span className="text-sm opacity-80">{email}</span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Your name
        </label>
        <input
          id="name"
          name="name"
          required
          className="rounded-md border border-black/20 dark:border-white/20 bg-transparent p-2 text-sm"
        />
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
        {isPending ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
