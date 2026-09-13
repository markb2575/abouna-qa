import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Ask Abouna</h1>
      <p className="text-base opacity-80 max-w-prose">
        Have a question for a priest? Ask anonymously below, and you&apos;ll get an answer by
        email. You can also browse questions the community has already asked.
      </p>
      <div className="flex gap-4">
        <Link
          href="/ask"
          className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium"
        >
          Ask a Question
        </Link>
        <Link
          href="/questions"
          className="rounded-md border border-black/20 dark:border-white/20 px-4 py-2 text-sm font-medium"
        >
          Browse Q&amp;A
        </Link>
      </div>
    </div>
  );
}
