import { useThemeMode } from "../../context/ThemeContext";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, toggle } = useThemeMode();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-2 rounded-full border border-midnight/30 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-midnight shadow-sm transition hover:bg-midnight hover:text-white dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700 ${className}`.trim()}
      aria-label="Toggle theme"
    >
      {mode === "dark" ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2m0 18v2m11-11h-2M5 12H3m16.95 6.95-1.41-1.41M7.46 7.46 6.05 6.05m12.9 0-1.41 1.41M7.46 16.54l-1.41 1.41" />
        </svg>
      )}
      <span>{mode === "dark" ? "Night" : "Day"} Mode</span>
    </button>
  );
}
