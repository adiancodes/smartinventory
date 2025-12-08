import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, Cell } from "recharts";
import { AdminTopNav } from "../../components/layout/AdminTopNav";
import { fetchWarehouses } from "../../api/warehouses";
import { downloadAnalyticsExcel, downloadAnalyticsPdf, fetchAnalyticsDashboard } from "../../api/analytics";
const STATUS_COLOR_MAP = {
    Healthy: "#2563eb",
    "Low Stock": "#f97316",
    "Out of Stock": "#ef4444"
};
const STATUS_COLORS = Object.values(STATUS_COLOR_MAP);
function toMonthLabel(year, month) {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
function extractFilename(contentDisposition, fallback = "analytics-dashboard") {
    if (!contentDisposition) {
        return `${fallback}.dat`;
    }
    const match = /filename=\"?([^\";]+)\"?/i.exec(contentDisposition);
    if (match && match[1]) {
        return match[1];
    }
    return `${fallback}.dat`;
}
async function triggerDownload(fetcher, fallbackName) {
    try {
        const response = await fetcher();
        const blob = response.data;
        const disposition = response.headers["content-disposition"];
        const filename = extractFilename(disposition, fallbackName);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
    catch (error) {
        const message = error.response?.data?.message ?? "Unable to download file";
        window.alert(message);
    }
}
export default function AdminAnalytics() {
    const [selectedWarehouse, setSelectedWarehouse] = useState("ALL");
    const warehouseQuery = useQuery({
        queryKey: ["warehouses", "analytics"],
        queryFn: fetchWarehouses
    });
    const warehouseId = selectedWarehouse !== "ALL" ? Number(selectedWarehouse) : undefined;
    const dashboardQuery = useQuery({
        queryKey: ["analytics", { warehouseId }],
        queryFn: () => fetchAnalyticsDashboard(warehouseId)
    });
    const dashboard = dashboardQuery.data;
    const pieSourceData = useMemo(() => {
        if (!dashboard) {
            return [];
        }
        return dashboard.statusDistribution.map((slice) => ({
            name: slice.key,
            value: slice.productCount,
            count: slice.productCount,
            units: slice.totalUnits
        }));
    }, [dashboard]);
    const pieData = useMemo(() => pieSourceData.filter((slice) => slice.value > 0), [pieSourceData]);
    const pieLegend = useMemo(() => pieSourceData.map((slice) => ({
        value: slice.name,
        type: "square",
        color: STATUS_COLOR_MAP[slice.name] ?? STATUS_COLORS[0]
    })), [pieSourceData]);
    const quantityChartData = useMemo(() => {
        if (!dashboard) {
            return [];
        }
        return dashboard.monthlyQuantityTrend.map((point) => ({
            month: toMonthLabel(point.year, point.month),
            restocked: point.restockedQuantity,
            sold: point.soldQuantity
        }));
    }, [dashboard]);
    const financialChartData = useMemo(() => {
        if (!dashboard) {
            return [];
        }
        return dashboard.monthlyFinancials.map((point) => ({
            month: toMonthLabel(point.year, point.month),
            restockSpend: point.restockSpend,
            salesRevenue: point.salesRevenue
        }));
    }, [dashboard]);
    const restockDemandData = useMemo(() => {
        if (!dashboard) {
            return [];
        }
        return dashboard.restockDemandComparison.map((point) => ({
            product: `${point.productName} (${point.productSku})`,
            restocked: point.restockedQuantity,
            sold: point.soldQuantity
        }));
    }, [dashboard]);
    const currencyFormatter = useMemo(() => new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }), []);
    const dateTimeFormatter = useMemo(() => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }), []);
    const totalRestockValue = dashboard?.monthlyFinancials.reduce((sum, point) => sum + point.restockSpend, 0) ?? 0;
    const totalSalesValue = dashboard?.monthlyFinancials.reduce((sum, point) => sum + point.salesRevenue, 0) ?? 0;
    return (_jsxs("div", { className: "min-h-screen bg-ash", children: [_jsx(AdminTopNav, {}), _jsxs("main", { className: "w-full px-10 py-8", children: [_jsxs("header", { className: "flex flex-col gap-3 md:flex-row md:items-end md:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "Analytics & Reports" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Interactive insights across inventory, restocks, and sales. Switch scope to drill into a warehouse." })] }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center", children: [_jsxs("div", { className: "flex flex-col gap-1 text-sm", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "warehouse-select", children: "Scope" }), _jsxs("select", { id: "warehouse-select", className: "input", value: selectedWarehouse, onChange: (event) => setSelectedWarehouse(event.target.value), children: [_jsx("option", { value: "ALL", children: "All Warehouses" }), warehouseQuery.data?.map((warehouse) => (_jsxs("option", { value: warehouse.id, children: [warehouse.name, " (", warehouse.locationCode, ")"] }, warehouse.id)))] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100", onClick: () => triggerDownload(() => downloadAnalyticsPdf(warehouseId), "analytics-dashboard.pdf"), children: "Export PDF" }), _jsx("button", { type: "button", className: "rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900", onClick: () => triggerDownload(() => downloadAnalyticsExcel(warehouseId), "analytics-dashboard.xlsx"), children: "Export Excel" })] })] })] }), dashboardQuery.isLoading ? (_jsx("p", { className: "mt-8 text-sm text-slate-500", children: "Loading analytics..." })) : dashboardQuery.isError ? (_jsx("p", { className: "mt-8 text-sm text-red-500", children: "Failed to load analytics dashboard." })) : dashboard ? (_jsxs("div", { className: "mt-8 space-y-8", children: [_jsxs("section", { className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5", children: [_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: "Scope" }), _jsx("p", { className: "mt-3 text-lg font-semibold text-slate-800", children: dashboard.scopeLabel }), _jsxs("p", { className: "mt-1 text-xs text-slate-400", children: ["Updated ", dateTimeFormatter.format(new Date(dashboard.generatedAt))] })] }), _jsx(StatCard, { label: "Total Products", value: dashboard.inventoryStatus.totalProducts.toLocaleString() }), _jsx(StatCard, { label: "Inventory Units", value: dashboard.inventoryStatus.totalUnits.toLocaleString() }), _jsx(StatCard, { label: "Low Stock", value: dashboard.inventoryStatus.lowStockProducts.toLocaleString(), intent: "warning" }), _jsx(StatCard, { label: "Out of Stock", value: dashboard.inventoryStatus.outOfStockProducts.toLocaleString(), intent: "danger" })] }), _jsxs("section", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx(SectionHeader, { title: "Inventory Status Mix", subtitle: "Pie chart capturing product distribution across health bands." }), pieData.length === 0 ? (_jsx(EmptyState, { message: "No inventory data yet." })) : (_jsx("div", { className: "mt-6 h-72", children: _jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(RechartsTooltip, { formatter: (value, _name, payload) => [`${value} products`, payload?.name] }), _jsx(Legend, {}), _jsx(Pie, { dataKey: "value", data: pieData, outerRadius: 110, label: ({ name, value }) => `${name} (${value})`, children: pieData.map((entry, index) => (_jsx(Cell, { fill: STATUS_COLORS[index % STATUS_COLORS.length] }, entry.name))) })] }) }) }))] }), _jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx(SectionHeader, { title: "Restock vs Demand", subtitle: "Bar chart comparison of quantities restocked versus sold." }), quantityChartData.length === 0 ? (_jsx(EmptyState, { message: "No monthly signals yet." })) : (_jsx("div", { className: "mt-6 h-72", children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: quantityChartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 12 } }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(RechartsTooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "restocked", fill: "#2563eb", name: "Restocked", radius: [4, 4, 0, 0] }), _jsx(Bar, { dataKey: "sold", fill: "#f97316", name: "Sold", radius: [4, 4, 0, 0] })] }) }) }))] })] }), _jsxs("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx(SectionHeader, { title: "Purchases vs Sales", subtitle: "Monthly spend on purchase orders versus realised sales revenue." }), financialChartData.length === 0 ? (_jsx(EmptyState, { message: "No financial data computed yet." })) : (_jsx("div", { className: "mt-6 h-80", children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: financialChartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 12 } }), _jsx(YAxis, { tickFormatter: (value) => currencyFormatter.format(value).replace(/^₹\s?/, "₹ "), tick: { fontSize: 12 } }), _jsx(RechartsTooltip, { formatter: (value) => currencyFormatter.format(value) }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "restockSpend", fill: "#0f172a", name: "Restock Spend", radius: [4, 4, 0, 0] }), _jsx(Bar, { dataKey: "salesRevenue", fill: "#16a34a", name: "Sales Revenue", radius: [4, 4, 0, 0] })] }) }) })), _jsxs("div", { className: "mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg bg-slate-50 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: "Total Restock Spend" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-slate-800", children: currencyFormatter.format(totalRestockValue) })] }), _jsxs("div", { className: "rounded-lg bg-slate-50 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: "Total Sales Revenue" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-slate-800", children: currencyFormatter.format(totalSalesValue) })] })] })] }), _jsxs("section", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx(SectionHeader, { title: "Top Restocked Items", subtitle: "Most frequently replenished products from purchase orders." }), dashboard.topRestockedItems.length === 0 ? (_jsx(EmptyState, { message: "No restock activity captured." })) : (_jsx("ul", { className: "mt-4 space-y-3 text-sm text-slate-600", children: dashboard.topRestockedItems.map((item) => (_jsxs("li", { className: "flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-800", children: item.productName }), _jsxs("p", { className: "text-xs text-slate-400", children: ["SKU ", item.productSku] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm font-semibold text-slate-700", children: [item.totalQuantity.toLocaleString(), " units"] }), _jsxs("p", { className: "text-xs text-slate-400", children: [item.orderCount.toLocaleString(), " purchase orders"] })] })] }, item.productSku))) }))] }), _jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx(SectionHeader, { title: "Restock vs Demand by Product", subtitle: "Side-by-side bars tracking restocked versus sold units." }), restockDemandData.length === 0 ? (_jsx(EmptyState, { message: "No overlapping data for restock and demand." })) : (_jsx("div", { className: "mt-6 h-72", children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: restockDemandData, layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: false }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { type: "category", dataKey: "product", width: 180, tick: { fontSize: 11 } }), _jsx(RechartsTooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "restocked", fill: "#2563eb", name: "Restocked", radius: [0, 4, 4, 0] }), _jsx(Bar, { dataKey: "sold", fill: "#16a34a", name: "Sold", radius: [0, 4, 4, 0] })] }) }) }))] })] })] })) : null] })] }));
}
function StatCard({ label, value, intent = "default" }) {
    const tone = intent === "danger" ? "text-red-600" : intent === "warning" ? "text-amber-600" : "text-slate-800";
    const accent = intent === "danger" ? "bg-red-50" : intent === "warning" ? "bg-amber-50" : "bg-slate-50";
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: label }), _jsx("p", { className: `mt-3 text-3xl font-semibold ${tone}`, children: value }), _jsx("div", { className: `mt-3 h-1.5 w-14 rounded-full ${accent}` })] }));
}
function SectionHeader({ title, subtitle }) {
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-700", children: title }), subtitle && _jsx("p", { className: "text-sm text-slate-500", children: subtitle })] }));
}
function EmptyState({ message }) {
    return _jsx("p", { className: "mt-6 text-sm text-slate-500", children: message });
}
