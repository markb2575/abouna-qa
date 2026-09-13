import { AskForm } from "./AskForm";

export const metadata = { title: "Ask a Question — Abouna Q&A" };

export default function AskPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Ask a Question</h1>
      <AskForm />
    </div>
  );
}
