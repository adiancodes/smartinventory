import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import TopNavbar from "../../components/layout/TopNavbar";
import { fetchUserPurchaseHistory } from "../../api/purchases";
import { useAuth } from "../../hooks/useAuth";
export default function UserPurchases() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const purchaseHistoryQuery = useQuery({
        queryKey: ["user", "purchase-history"],
        queryFn: fetchUserPurchaseHistory
    });
    const purchaseHistory = purchaseHistoryQuery.data?.purchases ?? [];
    const orderedPurchases = useMemo(() => [...purchaseHistory].sort((first, second) => new Date(second.purchasedAt).getTime() - new Date(first.purchasedAt).getTime()), [purchaseHistory]);
    const totalSpend = purchaseHistoryQuery.data?.totalSpend ?? 0;
    const totalItems = useMemo(() => orderedPurchases.reduce((sum, purchase) => sum + purchase.quantity, 0), [orderedPurchases]);
    const latestPurchase = useMemo(() => (orderedPurchases.length > 0 ? orderedPurchases[0] : null), [orderedPurchases]);
    const currencyFormatter = useMemo(() => new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }), []);
    const handleLogout = useCallback(() => {
        logout();
        navigate("/login");
    }, [logout, navigate]);
    const userNavLinks = useMemo(() => [
        { label: "Home", to: "/user/dashboard" },
        { label: "Browse Products", to: "/user/dashboard?section=browse" },
        { label: "Addresses", to: "/user/dashboard?section=addresses" },
        { label: "My Purchases", to: "/user/purchases", isActive: location.pathname === "/user/purchases" },
        { label: "Logout", onClick: handleLogout, variant: "danger" }
    ], [handleLogout, location.pathname]);
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950", children: [_jsx(TopNavbar, { className: "py-4", navLinks: userNavLinks, showAuthCTA: false }), _jsxs("main", { className: "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8", children: [_jsxs("header", { className: "space-y-2", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: ["Welcome back", user?.fullName ? ", " : "", user?.fullName ?? "User"] }), _jsx("h1", { className: "text-3xl font-semibold text-midnight dark:text-white", children: "My Purchases" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: "Review all of your orders, totals, and the warehouses that fulfilled them." })] }), _jsx("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-5 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Total Spend" }), _jsx("p", { className: "mt-4 text-2xl font-semibold text-midnight dark:text-white", children: purchaseHistoryQuery.isLoading ? "..." : currencyFormatter.format(totalSpend) })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-5 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Total Items" }), _jsx("p", { className: "mt-4 text-2xl font-semibold text-midnight dark:text-white", children: purchaseHistoryQuery.isLoading ? "..." : totalItems.toLocaleString() })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-5 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Orders Placed" }), _jsx("p", { className: "mt-4 text-2xl font-semibold text-midnight dark:text-white", children: purchaseHistoryQuery.isLoading ? "..." : orderedPurchases.length.toLocaleString() })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-5 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Last Updated" }), _jsx("p", { className: "mt-4 text-sm text-slate-600 dark:text-slate-300", children: purchaseHistoryQuery.isLoading
                                                ? "Loading..."
                                                : latestPurchase
                                                    ? new Date(latestPurchase.purchasedAt).toLocaleString()
                                                    : "No purchases yet" })] })] }) }), _jsxs("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: [purchaseHistoryQuery.isLoading && _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Loading purchases..." }), purchaseHistoryQuery.isError && !purchaseHistoryQuery.isLoading && (_jsx("p", { className: "text-sm text-red-500", children: "Unable to load purchase history right now. Please try again later." })), !purchaseHistoryQuery.isLoading && orderedPurchases.length === 0 && (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "You have not placed any orders yet. Browse products to get started." })), orderedPurchases.length > 0 && (_jsx("div", { className: "mt-6 overflow-x-auto rounded-2xl border border-white/30 bg-white/90 shadow-inner dark:border-slate-700/50 dark:bg-slate-900/70", children: _jsxs("table", { className: "w-full table-auto text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-white/40 bg-white/70 text-xs uppercase tracking-widest text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300", children: [_jsx("th", { className: "px-4 py-2", children: "Product" }), _jsx("th", { className: "px-4 py-2", children: "SKU" }), _jsx("th", { className: "px-4 py-2", children: "Quantity" }), _jsx("th", { className: "px-4 py-2", children: "Total Paid" }), _jsx("th", { className: "px-4 py-2", children: "Warehouse" }), _jsx("th", { className: "px-4 py-2", children: "Purchased At" })] }) }), _jsx("tbody", { children: orderedPurchases.map((purchase) => (_jsxs("tr", { className: "border-b border-white/20 last:border-none dark:border-slate-800/40", children: [_jsx("td", { className: "px-4 py-3 font-medium text-midnight dark:text-slate-100", children: purchase.productName }), _jsx("td", { className: "px-4 py-3 text-slate-600 dark:text-slate-300", children: purchase.productSku }), _jsx("td", { className: "px-4 py-3 text-slate-600 dark:text-slate-300", children: purchase.quantity }), _jsx("td", { className: "px-4 py-3 text-slate-600 dark:text-slate-300", children: currencyFormatter.format(purchase.totalPrice) }), _jsx("td", { className: "px-4 py-3 text-slate-600 dark:text-slate-300", children: purchase.warehouseName }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-400", children: new Date(purchase.purchasedAt).toLocaleString() })] }, purchase.id))) })] }) }))] })] })] }));
}
