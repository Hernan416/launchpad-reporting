"use client";

/**
 * No local state: which icon shows is driven purely by the `dark:` variant
 * CSS (both icons render, one hidden), so there's nothing to sync on mount
 * and no hydration-mismatch risk against the inline anti-FOUC script in
 * app/layout.tsx that sets the "dark" class before paint.
 */
export function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#0067eb] dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-[#ffcf00]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="hidden h-5 w-5 dark:block"
      >
        <path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 15a5 5 0 100-10 5 5 0 000 10zm9-6a1 1 0 110 2h-1a1 1 0 110-2h1zM4 12a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zm14.24 6.24a1 1 0 001.42-1.42l-.71-.7a1 1 0 10-1.42 1.41l.71.71zM6.47 6.47a1 1 0 001.42-1.42l-.71-.7A1 1 0 105.76 5.76l.71.71zm12.02-1.42a1 1 0 10-1.42-1.42l-.7.71a1 1 0 001.41 1.42l.71-.71zM7.18 17.54a1 1 0 10-1.42-1.42l-.7.71a1 1 0 101.41 1.41l.71-.7zM12 20a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="block h-5 w-5 dark:hidden"
      >
        <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
      </svg>
    </button>
  );
}
