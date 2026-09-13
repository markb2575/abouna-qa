export const metadata = { title: "Check Your Email — Abouna Q&A" };

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="text-sm opacity-80">
        If that email is registered, a sign-in link has been sent. It expires in 15 minutes and
        can only be used once.
      </p>
    </div>
  );
}
