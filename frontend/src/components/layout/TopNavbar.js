import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";
export default function TopNavbar({ primaryAction, secondaryAction, showAuthCTA = true, className = "", navLinks = [] }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isActiveLink = (to) => {
        if (location.pathname === to) {
            return true;
        }
        return to !== "/" && location.pathname.startsWith(`${to}/`);
    };
    const getNavItemClasses = (active, variant) => {
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
    return (_jsx("header", { className: `sticky top-0 z-40 flex w-full justify-center backdrop-blur-md ${className}`, children: _jsxs("div", { className: "flex w-full flex-wrap items-center justify-between gap-3 rounded-full border border-white/40 bg-white/40 px-4 py-3 text-sm shadow-lg shadow-white/20 transition dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-slate-900/30 sm:flex-nowrap sm:gap-6 sm:px-6", children: [_jsxs("div", { className: "flex items-center gap-4 sm:gap-6", children: [_jsx(Link, { to: "/", className: "text-lg font-semibold text-midnight transition hover:text-midnight/80 dark:text-slate-100", children: "SmartShelfX" }), navLinks.length > 0 && (_jsx("nav", { className: "flex flex-wrap items-center gap-2 font-medium text-slate-700 dark:text-slate-300", children: navLinks.map((link) => {
                                const active = typeof link.isActive === "boolean" ? link.isActive : Boolean(link.to && isActiveLink(link.to));
                                const key = link.to ?? link.label;
                                if (link.onClick && !link.to) {
                                    return (_jsx("button", { type: "button", onClick: link.onClick, className: getNavItemClasses(active, link.variant ?? "default"), children: link.label }, key));
                                }
                                if (link.to) {
                                    return (_jsx(Link, { to: link.to, className: getNavItemClasses(active, link.variant ?? "default"), "aria-current": active ? "page" : undefined, children: link.label }, key));
                                }
                                return null;
                            }) }))] }), _jsxs("div", { className: "flex items-center gap-2 sm:gap-3", children: [_jsx(ThemeToggle, {}), showAuthCTA && (_jsxs("nav", { className: "flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 sm:text-sm", children: [secondaryAction && (_jsx(Link, { to: secondaryAction.to, className: "rounded-full border border-midnight/40 px-4 py-2 transition hover:bg-midnight hover:text-white dark:border-slate-500 dark:hover:bg-slate-700", children: secondaryAction.label })), primaryAction && (_jsx(Link, { to: primaryAction.to, className: "rounded-full bg-sunshine px-4 py-2 font-semibold text-midnight shadow-sm transition hover:bg-sunshine/80 dark:bg-amber-400 dark:text-slate-900", children: primaryAction.label })), !primaryAction && !secondaryAction && user && (_jsx("button", { type: "button", onClick: logout, className: "rounded-full border border-red-400 px-4 py-2 text-red-500 transition hover:bg-red-500 hover:text-white dark:text-red-300 dark:hover:bg-red-400 dark:hover:text-slate-900", children: "Logout" }))] }))] })] }) }));
}
