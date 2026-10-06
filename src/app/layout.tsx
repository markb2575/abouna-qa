import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentPriest } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";

// Runs before paint so the stored mode applies immediately — no flash of the
// wrong mode. Static string, no user input, safe to inline.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var mode = localStorage.getItem('theme-mode');
    if (!mode) mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-mode', mode);
  } catch (e) {}
})();
`;

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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
          <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              Abouna Q&amp;A
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/ask" className="hover:text-accent">
                Ask a Question
              </Link>
              <Link href="/questions" className="hover:text-accent">
                Browse Q&amp;A
              </Link>
              {priest ? (
                <>
                  <Link href="/priest/dashboard" className="hover:text-accent">
                    Priest Dashboard
                  </Link>
                  <Link href="/priest/categories" className="hover:text-accent">
                    Categories
                  </Link>
                </>
              ) : (
                <Link href="/priest/sign-in" className="hover:text-accent">
                  Priest Sign In
                </Link>
              )}
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          Abouna Q&amp;A
        </footer>
      </body>
    </html>
  );
}
