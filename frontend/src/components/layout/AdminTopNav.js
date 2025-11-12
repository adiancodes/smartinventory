import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
export function AdminTopNav() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const handleLogout = () => {
        logout();
        navigate("/login");
    };
    return (_jsx("header", { className: "sticky top-0 z-40 border-b border-sky-200 bg-sky-100/95 backdrop-blur", children: _jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-6 py-4", children: [_jsxs("div", { className: "flex items-center gap-6", children: [_jsx("span", { className: "text-lg font-bold text-midnight", children: "SmartShelfX Admin" }), _jsxs("nav", { className: "flex items-center gap-4 text-sm font-semibold text-slate-600", children: [_jsx(Link, { to: "/admin/dashboard", className: "rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight", children: "Home" }), _jsx(Link, { to: "/admin/inventory", className: "rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight", children: "Inventory" }), _jsx(Link, { to: "/admin/sales", className: "rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight", children: "Sales" }), _jsx(Link, { to: "/admin/analytics", className: "rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight", children: "Analytics" }), _jsx(Link, { to: "/admin/forecast", className: "rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight", children: "Forecast" }), _jsx(Link, { to: "/admin/restock", className: "rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight", children: "Restock" })] })] }), _jsx("button", { type: "button", onClick: handleLogout, className: "rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50", children: "Logout" })] }) }));
}
