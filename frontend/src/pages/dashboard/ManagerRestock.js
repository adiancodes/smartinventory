import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RestockModule } from "../../components/restock/RestockModule";
import { useAuth } from "../../hooks/useAuth";
import TopNavbar from "../../components/layout/TopNavbar";
export default function ManagerRestock() {
    const { user } = useAuth();
    const warehouseName = user?.warehouseName ?? "My Store";
    const navLinks = [
        { label: "Dashboard", to: "/manager/dashboard" },
        { label: "Inventory", to: "/manager/inventory" },
        { label: "Restock", to: "/manager/restock" }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950", children: [_jsx(TopNavbar, { className: "py-4", navLinks: navLinks }), _jsxs("main", { className: "flex w-full flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8", children: [_jsx("section", { className: "rounded-3xl border border-white/40 bg-white/75 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: _jsxs("div", { className: "flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-semibold text-midnight dark:text-white", children: [warehouseName, " \u00B7 Auto-Restock"] }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-300", children: "Review AI suggestions, consolidate purchase orders, and keep every shelf stocked automatically." })] }), _jsx("div", { className: "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300", children: _jsx("span", { className: "hidden sm:inline", children: "Smart recommendations refresh every 24 hours." }) })] }) }), _jsx("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: _jsx(RestockModule, { mode: "MANAGER" }) })] })] }));
}
