import { SignInForm } from "./SignInForm";

export const metadata = { title: "Priest Sign In — Abouna Q&A" };

export default async function PriestSignInPage({ searchParams }: PageProps<"/priest/sign-in">) {
  const params = await searchParams;
  const hasError = params.error === "invalid-link";

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <h1 className="text-2xl font-semibold">Priest Sign In</h1>
      <p className="text-sm opacity-80">
        Enter your email and we&apos;ll send you a one-time sign-in link.
      </p>
      {hasError && (
        <p className="text-sm text-red-600" role="alert">
          That link is invalid, expired, or already used. Request a new one below.
        </p>
      )}
      <SignInForm />
    </div>
  );
}
