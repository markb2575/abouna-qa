import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentPriest } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Abouna Q&A",
  description: "Ask a priest a question, and browse answered questions.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const priest = await getCurrentPriest();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <nav className="mx-auto max-w-4xl flex items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="font-semibold">
              Abouna Q&amp;A
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/ask">Ask a Question</Link>
              <Link href="/questions">Browse Q&amp;A</Link>
              {priest ? (
                <Link href="/priest/dashboard">Priest Dashboard</Link>
              ) : (
                <Link href="/priest/sign-in">Priest Sign In</Link>
              )}
            </div>
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">{children}</main>
        <footer className="border-t border-black/10 dark:border-white/10 py-6 text-center text-xs opacity-70">
          Abouna Q&amp;A
        </footer>
      </body>
    </html>
  );
}
