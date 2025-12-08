import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { fetchProducts } from "../../api/products";
import { fetchManagerPurchaseHistory, fetchManagerSalesSummary } from "../../api/purchases";
import TopNavbar from "../../components/layout/TopNavbar";
export default function ManagerDashboard() {
    const { user } = useAuth();
    const warehouseName = user?.warehouseName ?? "My Store";
    const navLinks = [
        { label: "Dashboard", to: "/manager/dashboard" },
        { label: "Inventory", to: "/manager/inventory" },
        { label: "Restock", to: "/manager/restock" }
    ];
    const productsQuery = useQuery({
        queryKey: ["manager", "products", user?.warehouseId],
        queryFn: () => fetchProducts({ warehouseId: user?.warehouseId ?? undefined }),
        enabled: Boolean(user?.warehouseId)
    });
    const salesSummaryQuery = useQuery({
        queryKey: ["manager", "sales-summary", user?.warehouseId],
        queryFn: fetchManagerSalesSummary,
        enabled: Boolean(user?.warehouseId)
    });
    const salesSummary = salesSummaryQuery.data;
    const purchaseHistoryQuery = useQuery({
        queryKey: ["manager", "purchase-history", user?.warehouseId],
        queryFn: fetchManagerPurchaseHistory,
        enabled: Boolean(user?.warehouseId)
    });
    const purchaseHistory = purchaseHistoryQuery.data;
    const currencyFormatter = useMemo(() => new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }), []);
    const { totalProducts, lowStockCount, outOfStockCount, lowStockItems, totalInventoryValue } = useMemo(() => {
        const products = productsQuery.data ?? [];
        const totalValue = products.reduce((sum, product) => sum + (product.totalValue ?? 0), 0);
        const lowItems = products.filter((product) => product.currentStock > 0 && product.lowStock);
        const outItems = products.filter((product) => product.currentStock === 0);
        return {
            totalProducts: products.length,
            lowStockCount: lowItems.length,
            outOfStockCount: outItems.length,
            lowStockItems: lowItems,
            totalInventoryValue: totalValue
        };
    }, [productsQuery.data]);
    const historyTotals = useMemo(() => {
        if (!purchaseHistory) {
            return { totalOrders: 0, totalItems: 0, totalRevenue: 0 };
        }
        return {
            totalOrders: purchaseHistory.totalOrders,
            totalItems: purchaseHistory.totalItems,
            totalRevenue: purchaseHistory.totalRevenue
        };
    }, [purchaseHistory]);
    const historyFormatter = useMemo(() => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }), []);
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950", children: [_jsx(TopNavbar, { className: "py-4", navLinks: navLinks }), _jsxs("main", { className: "flex w-full flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8", children: [_jsxs("section", { className: "rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: [_jsxs("div", { className: "flex flex-col gap-4 border-b border-white/40 pb-6 text-sm dark:border-slate-700/60 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs uppercase tracking-widest text-slate-500 dark:text-slate-300", children: "Manager workspace" }), _jsx("h1", { className: "mt-2 text-2xl font-semibold text-midnight dark:text-white", children: "Store Manager Dashboard" }), _jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-300", children: ["Welcome, ", user?.fullName] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300", children: [_jsx("span", { className: "rounded-full bg-white/70 px-3 py-1 dark:bg-slate-800/60", children: warehouseName }), _jsx("span", { className: "rounded-full bg-white/70 px-3 py-1 dark:bg-slate-800/60", children: productsQuery.isLoading ? "Syncing products" : `${productsQuery.data?.length ?? 0} products` })] })] }), _jsxs("div", { className: "mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4", children: [_jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Total Products"] }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-slate-800", children: totalProducts })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Inventory Value"] }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-slate-800", children: currencyFormatter.format(totalInventoryValue) })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Low Stock"] }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-amber-600", children: lowStockCount })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Out of Stock"] }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-red-600", children: outOfStockCount })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition md:col-span-2 xl:col-span-1 dark:border-slate-700/60 dark:bg-slate-900/80", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Sales"] }), salesSummaryQuery.isLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "Loading..." })) : (_jsxs("div", { children: [_jsx("p", { className: "mt-4 text-3xl font-semibold text-slate-800", children: currencyFormatter.format(salesSummary?.totalRevenue ?? 0) }), _jsxs("p", { className: "mt-2 text-xs text-slate-400", children: [(salesSummary?.totalOrders ?? 0).toLocaleString(), " orders \u00B7 ", (salesSummary?.totalItems ?? 0).toLocaleString(), " items"] })] }))] })] })] }), _jsxs("section", { className: "grid grid-cols-1 gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/90 p-6 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80", children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-700", children: ["Low Stock Items (", warehouseName, ")"] }), productsQuery.isLoading && _jsx("p", { className: "mt-4 text-sm text-slate-500", children: "Loading inventory..." }), !productsQuery.isLoading && lowStockItems.length === 0 && (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "No low stock items. Well done!" })), !productsQuery.isLoading && lowStockItems.length > 0 && (_jsx("ul", { className: "mt-4 space-y-2 text-sm text-slate-600", children: lowStockItems.map((product) => (_jsxs("li", { className: "flex items-center justify-between rounded-md bg-amber-50 px-3 py-2", children: [_jsx("span", { className: "font-medium text-slate-700", children: product.name }), _jsxs("span", { className: "text-xs uppercase text-amber-600", children: ["Stock: ", product.currentStock, " / Reorder: ", product.reorderLevel] })] }, product.id))) }))] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/90 p-6 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-700", children: "Store Widget" }), purchaseHistoryQuery.isLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "Loading purchase history..." })) : !purchaseHistory || purchaseHistory.purchases.length === 0 ? (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "No purchase activity recorded yet." })) : (_jsxs("div", { className: "mt-4 space-y-4", children: [_jsxs("div", { className: "flex flex-wrap gap-3 text-xs text-slate-500", children: [_jsxs("span", { className: "rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200", children: [historyTotals.totalOrders.toLocaleString(), " orders"] }), _jsxs("span", { className: "rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200", children: [historyTotals.totalItems.toLocaleString(), " items sold"] }), _jsxs("span", { className: "rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200", children: [currencyFormatter.format(historyTotals.totalRevenue), " revenue"] })] }), _jsx("ul", { className: "space-y-3 text-sm text-slate-600 dark:text-slate-300", children: purchaseHistory.purchases.slice(0, 8).map((purchase) => (_jsxs("li", { className: "rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-800 dark:text-slate-100", children: purchase.productName }), _jsxs("p", { className: "text-xs text-slate-400 dark:text-slate-400", children: ["SKU ", purchase.productSku] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm font-semibold text-midnight dark:text-amber-300", children: currencyFormatter.format(purchase.totalPrice) }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["Qty ", purchase.quantity] })] })] }), _jsxs("div", { className: "mt-2 flex flex-wrap justify-between text-xs text-slate-500 dark:text-slate-400", children: [_jsx("span", { children: purchase.buyerName ?? "Customer" }), _jsx("span", { children: historyFormatter.format(new Date(purchase.purchasedAt)) })] })] }, purchase.purchaseId))) })] }))] })] })] })] }));
}
