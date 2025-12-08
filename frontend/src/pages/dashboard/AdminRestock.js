import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AdminTopNav } from "../../components/layout/AdminTopNav";
import { RestockModule } from "../../components/restock/RestockModule";
export default function AdminRestock() {
    return (_jsxs("div", { className: "min-h-screen bg-ash", children: [_jsx(AdminTopNav, {}), _jsxs("main", { className: "w-full px-10 py-8", children: [_jsxs("header", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "Auto-Restock & Purchase Orders" }), _jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Forecast-driven recommendations prioritized by velocity, with quick purchase-order workflows." })] }), _jsx(RestockModule, { mode: "ADMIN" })] })] }));
}
