import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminTopNav } from "../../components/layout/AdminTopNav";
import { fetchDemandForecast } from "../../api/forecast";
function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}
function formatWeekLabel(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
        month: "short",
        day: "numeric"
    }).format(date);
}
function ForecastLineChart({ item }) {
    const history = item.history ?? [];
    const lastHistoryDate = history.length > 0 ? new Date(history[history.length - 1].weekStart) : new Date();
    const forecastDate = addDays(lastHistoryDate, 7).toISOString();
    const points = [
        ...history,
        { weekStart: forecastDate, quantity: item.forecastQuantity }
    ];
    const maxValue = points.reduce((acc, point) => Math.max(acc, point.quantity), 0);
    const chartHeight = 220;
    const chartWidth = 620;
    const padding = 28;
    const span = Math.max(points.length - 1, 1);
    const polylinePoints = points
        .map((point, index) => {
        const x = (index / span) * (chartWidth - padding * 2) + padding;
        const safeMax = maxValue === 0 ? 1 : maxValue;
        const normalized = point.quantity / safeMax;
        const y = chartHeight - padding - normalized * (chartHeight - padding * 2);
        return `${x},${y}`;
    })
        .join(" ");
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-md", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "Demand trend" }), _jsx("p", { className: "text-sm text-slate-500", children: "Historical weekly sales with next week forecast." })] }), _jsxs("div", { className: "text-right text-sm text-slate-500", children: [_jsxs("p", { children: ["Forecast: ", _jsxs("span", { className: "font-semibold text-midnight", children: [item.forecastQuantity.toFixed(1), " units"] })] }), item.recommendedReorder > 0 && (_jsxs("p", { className: "text-xs text-red-500", children: ["Reorder suggestion: ", item.recommendedReorder, " units"] }))] })] }), points.length === 0 ? (_jsx("p", { className: "mt-6 text-sm text-slate-500", children: "No demand history recorded for this product yet." })) : (_jsxs("div", { className: "mt-8", children: [_jsxs("svg", { viewBox: `0 0 ${chartWidth} ${chartHeight}`, role: "img", className: "h-64 w-full text-midnight", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "forecastGradient", x1: "0", x2: "0", y1: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#1d3557", stopOpacity: "0.25" }), _jsx("stop", { offset: "100%", stopColor: "#1d3557", stopOpacity: "0" })] }) }), _jsx("rect", { x: padding, y: padding, width: chartWidth - padding * 2, height: chartHeight - padding * 2, className: "fill-sky-50" }), _jsx("polyline", { points: polylinePoints, fill: "none", stroke: "url(#forecastGradient)", strokeWidth: 6, strokeLinejoin: "round", strokeLinecap: "round", opacity: 0.5 }), _jsx("polyline", { points: polylinePoints, fill: "none", stroke: "#1d3557", strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" }), points.map((point, index) => {
                                const x = (index / span) * (chartWidth - padding * 2) + padding;
                                const safeMax = maxValue === 0 ? 1 : maxValue;
                                const normalized = point.quantity / safeMax;
                                const y = chartHeight - padding - normalized * (chartHeight - padding * 2);
                                const isForecast = index === points.length - 1;
                                return (_jsx("g", { children: _jsx("circle", { cx: x, cy: y, r: isForecast ? 6 : 4, className: isForecast ? "fill-red-500" : "fill-midnight" }) }, `${point.weekStart}-${index}`));
                            })] }), _jsx("div", { className: "mt-3 flex justify-between px-6 text-xs font-medium uppercase tracking-wide text-slate-400", children: points.map((point) => (_jsx("span", { className: "min-w-[3rem] text-center", children: formatWeekLabel(point.weekStart) }, point.weekStart))) })] }))] }));
}
export default function AdminDemandForecast() {
    const forecastQuery = useQuery({
        queryKey: ["admin", "demand", "forecast"],
        queryFn: fetchDemandForecast,
        staleTime: 5 * 60 * 1000
    });
    const [selectedProductId, setSelectedProductId] = useState(null);
    useEffect(() => {
        if (forecastQuery.data && forecastQuery.data.length > 0 && selectedProductId === null) {
            setSelectedProductId(forecastQuery.data[0].productId);
        }
    }, [forecastQuery.data, selectedProductId]);
    const selectedItem = useMemo(() => {
        if (!forecastQuery.data) {
            return null;
        }
        return forecastQuery.data.find((item) => item.productId === selectedProductId) ?? null;
    }, [forecastQuery.data, selectedProductId]);
    const topPerformer = forecastQuery.data?.[0];
    return (_jsxs("div", { className: "min-h-screen bg-ash", children: [_jsx(AdminTopNav, {}), _jsxs("main", { className: "w-full px-10 py-8", children: [_jsx("header", { className: "flex flex-col gap-2 md:flex-row md:items-end md:justify-between", children: _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "Demand Forecasting" }), _jsx("p", { className: "text-sm text-slate-500", children: "AI-backed weekly demand prediction with proactive stockout alerts." })] }) }), forecastQuery.isLoading ? (_jsx("p", { className: "mt-10 text-sm text-slate-500", children: "Crunching numbers..." })) : forecastQuery.isError ? (_jsx("p", { className: "mt-10 text-sm text-red-500", children: "Could not load demand forecast. Please try again." })) : forecastQuery.data?.length === 0 ? (_jsx("p", { className: "mt-10 text-sm text-slate-500", children: "No products available for forecasting yet." })) : (_jsxs(_Fragment, { children: [topPerformer && (_jsxs("section", { className: "mt-8 rounded-2xl border border-slate-200 bg-white shadow-md", children: [_jsxs("div", { className: "flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-slate-400", children: "Top Demand Product" }), _jsx("h2", { className: "text-xl font-semibold text-slate-800", children: topPerformer.productName }), _jsxs("p", { className: "text-sm text-slate-500", children: ["SKU ", topPerformer.productSku] })] }), _jsxs("div", { className: "flex flex-wrap gap-4 text-sm", children: [_jsxs("div", { className: "rounded-lg bg-sky-50 px-4 py-2", children: [_jsx("p", { className: "text-xs uppercase text-slate-500", children: "Forecast (Next Period)" }), _jsxs("p", { className: "text-lg font-semibold text-midnight", children: [topPerformer.forecastQuantity.toFixed(1), " units"] })] }), _jsxs("div", { className: "rounded-lg bg-sky-50 px-4 py-2", children: [_jsx("p", { className: "text-xs uppercase text-slate-500", children: "Current Stock" }), _jsx("p", { className: "text-lg font-semibold text-midnight", children: topPerformer.currentStock })] }), _jsxs("div", { className: "rounded-lg bg-sky-50 px-4 py-2", children: [_jsx("p", { className: "text-xs uppercase text-slate-500", children: "Action" }), _jsx("p", { className: "text-lg font-semibold text-midnight", children: topPerformer.action })] })] })] }), _jsx("div", { className: "px-6 py-4 text-xs text-slate-500", children: "This product has the highest units sold to date and leads the current demand leaderboard." })] })), _jsxs("div", { className: "mt-8 grid grid-cols-1 gap-6 xl:grid-cols-5", children: [_jsx("div", { className: "xl:col-span-3", children: selectedItem ? (_jsx(ForecastLineChart, { item: selectedItem })) : (_jsx("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-md", children: _jsx("p", { className: "text-sm text-slate-500", children: "Select a product to view its forecast." }) })) }), _jsx("div", { className: "xl:col-span-2", children: selectedItem && (_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-md", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "Inventory insight" }), _jsxs("p", { className: "mt-1 text-sm text-slate-500", children: ["SKU ", selectedItem.productSku] }), _jsxs("div", { className: "mt-4 grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { className: "rounded-xl bg-sky-50 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: "Current Stock" }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-midnight", children: selectedItem.currentStock })] }), _jsxs("div", { className: "rounded-xl bg-sky-50 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: "Forecast (7d)" }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-midnight", children: selectedItem.forecastQuantity.toFixed(1) })] }), _jsxs("div", { className: "rounded-xl bg-sky-50 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: "Reorder Level" }), _jsx("p", { className: "mt-2 text-2xl font-semibold text-midnight", children: selectedItem.reorderLevel })] }), _jsxs("div", { className: "rounded-xl bg-sky-50 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: "Status" }), _jsx("p", { className: `mt-2 text-2xl font-semibold ${selectedItem.atRisk ? "text-red-500" : "text-green-600"}`, children: selectedItem.atRisk ? "At Risk" : "Healthy" })] })] }), _jsxs("div", { className: "mt-6 rounded-xl border border-slate-200 bg-white p-4", children: [_jsx("p", { className: "text-sm font-semibold text-slate-700", children: "Recommended Action" }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: selectedItem.action }), selectedItem.recommendedReorder > 0 && (_jsxs("p", { className: "mt-1 text-xs text-red-500", children: ["Reorder at least ", selectedItem.recommendedReorder, " units to stay ahead of demand."] }))] })] })) })] })] })), !forecastQuery.isLoading && forecastQuery.data && forecastQuery.data.length > 0 && (_jsxs("section", { className: "mt-10 rounded-2xl border border-slate-200 bg-white shadow-md", children: [_jsx("header", { className: "flex items-center justify-between border-b border-slate-200 px-6 py-4", children: _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "Forecast summary" }), _jsx("p", { className: "text-sm text-slate-500", children: "Tap a row to inspect the trend." })] }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full table-auto text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-slate-50 text-xs uppercase tracking-wider text-slate-500", children: [_jsx("th", { className: "px-6 py-3", children: "SKU" }), _jsx("th", { className: "px-6 py-3", children: "Forecast (7d)" }), _jsx("th", { className: "px-6 py-3", children: "Current Stock" }), _jsx("th", { className: "px-6 py-3", children: "Action" })] }) }), _jsx("tbody", { children: forecastQuery.data.map((item, index) => {
                                                const isSelected = item.productId === selectedProductId;
                                                return (_jsxs("tr", { onClick: () => setSelectedProductId(item.productId), className: `cursor-pointer border-b last:border-none transition ${isSelected ? "bg-sky-50" : "hover:bg-slate-50"}`, children: [_jsxs("td", { className: "px-6 py-4", children: [_jsx("p", { className: "font-semibold text-slate-800", children: item.productSku }), _jsx("p", { className: "text-xs text-slate-500", children: item.productName }), index === 0 && (_jsx("span", { className: "mt-1 inline-flex items-center rounded-full bg-midnight px-2 py-0.5 text-[11px] font-semibold text-white", children: "Top demand" }))] }), _jsxs("td", { className: "px-6 py-4", children: [_jsxs("p", { className: "font-semibold text-slate-800", children: [item.forecastQuantity.toFixed(1), " units"] }), item.atRisk && (_jsx("span", { className: "mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600", children: "At risk" }))] }), _jsxs("td", { className: "px-6 py-4", children: [_jsx("p", { className: "font-semibold text-slate-800", children: item.currentStock }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Reorder level: ", item.reorderLevel] })] }), _jsxs("td", { className: "px-6 py-4", children: [_jsx("p", { className: "font-semibold text-slate-800", children: item.action }), item.recommendedReorder > 0 && (_jsxs("p", { className: "text-xs text-red-500", children: ["Reorder +", item.recommendedReorder, " units"] }))] })] }, item.productId));
                                            }) })] }) })] }))] })] }));
}
