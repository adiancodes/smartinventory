import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { RestockModule } from "../../components/restock/RestockModule";
import { useAuth } from "../../hooks/useAuth";
export default function ManagerRestock() {
    const { user } = useAuth();
    const warehouseName = user?.warehouseName ?? "My Store";
    return (_jsxs("div", { className: "flex min-h-screen flex-col bg-ash", children: [_jsxs("header", { className: "flex items-center justify-between bg-white px-8 py-4 shadow-sm", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-xl font-semibold text-slate-800", children: [warehouseName, " \u00B7 Auto-Restock"] }), _jsx("p", { className: "text-sm text-slate-500", children: "Review AI suggestions and send purchase orders directly to vendors." })] }), _jsx(Link, { className: "text-sm font-semibold text-slate-500 hover:text-slate-800", to: "/manager/dashboard", children: "Back to Dashboard" })] }), _jsx("main", { className: "flex-1 overflow-y-auto p-8", children: _jsx(RestockModule, { mode: "MANAGER" }) })] }));
}
