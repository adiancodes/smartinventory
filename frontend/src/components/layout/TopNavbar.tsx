import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";

type NavLinkItem = {
  label: string;
  to?: string;
  onClick?: () => void;
  isActive?: boolean;
  variant?: "default" | "danger";
};

interface TopNavbarProps {
  primaryAction?: { label: string; to: string };
  secondaryAction?: { label: string; to: string };
  showAuthCTA?: boolean;
  className?: string;
  navLinks?: Array<NavLinkItem>;
}

export default function TopNavbar({
  primaryAction,
  secondaryAction,
  showAuthCTA = true,
  className = "",
  navLinks = []
}: TopNavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActiveLink = (to: string) => {
    if (location.pathname === to) {
      return true;
    }
    return to !== "/" && location.pathname.startsWith(`${to}/`);
  };

  const getNavItemClasses = (active: boolean, variant: NavLinkItem["variant"]) => {
    if (variant === "danger") {
      return [
        "rounded-full border border-red-400 px-4 py-2 text-red-500 transition hover:bg-red-500 hover:text-white",
        "dark:border-red-400/70 dark:text-red-300 dark:hover:bg-red-400 dark:hover:text-slate-900"
      ].join(" ");
    }

    return [
      "rounded-full px-4 py-2 transition",
      active
        ? "bg-sunshine text-midnight shadow-sm dark:bg-amber-400 dark:text-slate-900"
        : "text-slate-600 hover:bg-white/60 hover:text-midnight dark:text-slate-300 dark:hover:bg-slate-800/60"
    ].join(" ");
  };

  return (
    <header className={`sticky top-0 z-40 flex w-full justify-center backdrop-blur-md ${className}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-full border border-white/40 bg-white/40 px-4 py-3 text-sm shadow-lg shadow-white/20 transition dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-slate-900/30 sm:flex-nowrap sm:gap-6 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="text-lg font-semibold text-midnight transition hover:text-midnight/80 dark:text-slate-100">
            SmartShelfX
          </Link>
          {navLinks.length > 0 && (
            <nav className="flex flex-wrap items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
              {navLinks.map((link) => {
                const active = typeof link.isActive === "boolean" ? link.isActive : Boolean(link.to && isActiveLink(link.to));
                const key = link.to ?? link.label;

                if (link.onClick && !link.to) {
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={link.onClick}
                      className={getNavItemClasses(active, link.variant ?? "default")}
                    >
                      {link.label}
                    </button>
                  );
                }

                if (link.to) {
                  return (
                    <Link
                      key={key}
                      to={link.to}
                      className={getNavItemClasses(active, link.variant ?? "default")}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                }

                return null;
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {showAuthCTA && (
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 sm:text-sm">
              {secondaryAction && (
                <Link
                  to={secondaryAction.to}
                  className="rounded-full border border-midnight/40 px-4 py-2 transition hover:bg-midnight hover:text-white dark:border-slate-500 dark:hover:bg-slate-700"
                >
                  {secondaryAction.label}
                </Link>
              )}
              {primaryAction && (
                <Link
                  to={primaryAction.to}
                  className="rounded-full bg-sunshine px-4 py-2 font-semibold text-midnight shadow-sm transition hover:bg-sunshine/80 dark:bg-amber-400 dark:text-slate-900"
                >
                  {primaryAction.label}
                </Link>
              )}
              {!primaryAction && !secondaryAction && user && (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-red-400 px-4 py-2 text-red-500 transition hover:bg-red-500 hover:text-white dark:text-red-300 dark:hover:bg-red-400 dark:hover:text-slate-900"
                >
                  Logout
                </button>
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
