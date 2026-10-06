"use client";

import { useActionState, useState } from "react";
import { acceptInvite, type AcceptInviteState } from "./actions";
import { ChurchPicker } from "@/components/ChurchPicker";

const initialState: AcceptInviteState = {};

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, isPending] = useActionState(acceptInvite, initialState);
  const [name, setName] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-sm">
      <p className="text-xs text-muted-foreground">Fields marked * are required.</p>
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <span className="text-sm opacity-80">{email}</span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Your name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Your church</span>
        <ChurchPicker required />
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
        {isPending ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
