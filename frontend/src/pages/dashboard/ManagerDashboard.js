import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { fetchProducts } from "../../api/products";
import { fetchManagerSalesSummary } from "../../api/purchases";
export default function ManagerDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const warehouseName = user?.warehouseName ?? "My Store";
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
    return (_jsxs("div", { className: "flex min-h-screen flex-col bg-ash", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-sky-200 bg-sky-100 px-8 py-4 shadow-sm", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-800", children: "Store Manager Dashboard" }), _jsxs("p", { className: "text-sm text-slate-500", children: ["Welcome, ", user?.fullName] })] }), _jsx("button", { type: "button", onClick: () => {
                            logout();
                            navigate("/login");
                        }, className: "rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white", children: "Logout" })] }), _jsxs("div", { className: "flex flex-1", children: [_jsx("aside", { className: "w-64 bg-midnight text-white", children: _jsxs("nav", { className: "px-6 py-6 space-y-2", children: [_jsx(Link, { to: "/manager/dashboard", className: "block rounded-md bg-sunshine px-4 py-2 text-midnight font-semibold", children: "Dashboard" }), _jsx(Link, { to: "/manager/inventory", className: "block rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-slate-800", children: "Inventory" })] }) }), _jsxs("main", { className: "flex-1 overflow-y-auto p-8", children: [_jsxs("section", { className: "grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-5", children: [_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Total Products"] }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-slate-800", children: totalProducts })] }), _jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Inventory Value"] }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-slate-800", children: currencyFormatter.format(totalInventoryValue) })] }), _jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Low Stock"] }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-amber-600", children: lowStockCount })] }), _jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Out of Stock"] }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-red-600", children: outOfStockCount })] }), _jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsxs("p", { className: "text-xs font-semibold uppercase text-slate-500", children: [warehouseName, ": Sales"] }), salesSummaryQuery.isLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "Loading..." })) : (_jsxs("div", { children: [_jsx("p", { className: "mt-4 text-3xl font-semibold text-slate-800", children: currencyFormatter.format(salesSummary?.totalRevenue ?? 0) }), _jsxs("p", { className: "mt-2 text-xs text-slate-400", children: [(salesSummary?.totalOrders ?? 0).toLocaleString(), " orders \u00B7 ", (salesSummary?.totalItems ?? 0).toLocaleString(), " items"] })] }))] })] }), _jsxs("section", { className: "mt-8 grid grid-cols-1 gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-700", children: ["Low Stock Items (", warehouseName, ")"] }), productsQuery.isLoading && _jsx("p", { className: "mt-4 text-sm text-slate-500", children: "Loading inventory..." }), !productsQuery.isLoading && lowStockItems.length === 0 && (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "No low stock items. Well done!" })), !productsQuery.isLoading && lowStockItems.length > 0 && (_jsx("ul", { className: "mt-4 space-y-2 text-sm text-slate-600", children: lowStockItems.map((product) => (_jsxs("li", { className: "flex items-center justify-between rounded-md bg-amber-50 px-3 py-2", children: [_jsx("span", { className: "font-medium text-slate-700", children: product.name }), _jsxs("span", { className: "text-xs uppercase text-amber-600", children: ["Stock: ", product.currentStock, " / Reorder: ", product.reorderLevel] })] }, product.id))) }))] }), _jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-700", children: "Store Widget" }), _jsx("p", { className: "mt-4 text-sm text-slate-500", children: "Purchase history - coming soon." })] })] })] })] })] }));
}
