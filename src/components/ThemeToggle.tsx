"use client";

type IconProps = { className?: string; "data-theme-icon"?: "light" | "dark" };

function SunIcon(props: IconProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" />
    </svg>
  );
}

function MoonIcon(props: IconProps) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  );
}

// No React state here on purpose: the live source of truth is the [data-mode]
// attribute on <html> (set by the blocking init script in layout.tsx before
// hydration, and updated directly below on click). Mirroring it into
// useState+useEffect would risk a hydration mismatch — CSS in globals.css
// reads this same data-theme-icon attribute to swap which icon is shown.
export function ThemeToggle() {
  function toggleMode() {
    const next = document.documentElement.getAttribute("data-mode") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-mode", next);
    localStorage.setItem("theme-mode", next);
  }

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label="Toggle light/dark mode"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-foreground/10"
    >
      <SunIcon data-theme-icon="light" className="h-4.5 w-4.5" />
      <MoonIcon data-theme-icon="dark" className="h-4.5 w-4.5" />
    </button>
  );
}
