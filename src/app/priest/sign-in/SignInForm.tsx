"use client";

import { useState } from "react";
import { requestMagicLink } from "./actions";

export function SignInForm() {
  const [email, setEmail] = useState("");

  return (
    <form action={requestMagicLink} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        Send Sign-In Link
      </button>
    </form>
  );
}
