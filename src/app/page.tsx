import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Ask Abouna</h1>
      <p className="max-w-prose text-base opacity-80">
        Have a question for a priest? Ask anonymously below, and you&apos;ll get an answer by
        email. You can also browse questions the community has already asked.
      </p>
      <div className="flex gap-4">
        <Link
          href="/ask"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm"
        >
          Ask a Question
        </Link>
        <Link
          href="/questions"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent/10"
        >
          Browse Q&amp;A
        </Link>
      </div>
    </div>
  );
}
