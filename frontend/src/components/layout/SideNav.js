import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
const navItems = [
    { label: "Dashboard", path: "/manager/dashboard", roles: ["MANAGER"] },
    { label: "Inventory", path: "/manager/inventory", roles: ["MANAGER"] },
    { label: "Managers", path: "/admin/managers", roles: ["ADMIN"] },
    { label: "Inventory", path: "/admin/inventory", roles: ["ADMIN"] }
];
export function SideNav() {
    const { user } = useAuth();
    const items = navItems.filter((item) => !user || item.roles.includes(user.role));
    return (_jsxs("aside", { className: "flex h-full w-64 flex-col bg-midnight text-white", children: [_jsx("div", { className: "p-6 text-xl font-bold", children: "SmartShelfX" }), _jsx("nav", { className: "flex-1 space-y-1 px-4", children: items.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `block rounded-md px-4 py-2 text-sm font-medium hover:bg-sunshine hover:text-midnight ${isActive ? "bg-sunshine text-midnight" : "text-white"}`, children: item.label }, item.path))) })] }));
}
