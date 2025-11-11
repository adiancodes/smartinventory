import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard";
import ManagerInventory from "./pages/dashboard/ManagerInventory";
import ManagerRestock from "./pages/dashboard/ManagerRestock";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminInventory from "./pages/dashboard/AdminInventory";
import AdminSales from "./pages/dashboard/AdminSales";
import AdminDemandForecast from "./pages/dashboard/AdminDemandForecast";
import AdminRestock from "./pages/dashboard/AdminRestock";
import UserDashboard from "./pages/dashboard/UserDashboard";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import UnauthorizedPage from "./pages/Unauthorized";
export default function App() {
    return (_jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/unauthorized", element: _jsx(UnauthorizedPage, {}) }), _jsxs(Route, { element: _jsx(ProtectedRoute, { allowedRoles: ["MANAGER"] }), children: [_jsx(Route, { path: "/manager/dashboard", element: _jsx(ManagerDashboard, {}) }), _jsx(Route, { path: "/manager/inventory", element: _jsx(ManagerInventory, {}) }), _jsx(Route, { path: "/manager/restock", element: _jsx(ManagerRestock, {}) })] }), _jsxs(Route, { element: _jsx(ProtectedRoute, { allowedRoles: ["ADMIN"] }), children: [_jsx(Route, { path: "/admin/dashboard", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "/admin/inventory", element: _jsx(AdminInventory, {}) }), _jsx(Route, { path: "/admin/sales", element: _jsx(AdminSales, {}) }), _jsx(Route, { path: "/admin/forecast", element: _jsx(AdminDemandForecast, {}) }), _jsx(Route, { path: "/admin/restock", element: _jsx(AdminRestock, {}) })] }), _jsx(Route, { element: _jsx(ProtectedRoute, { allowedRoles: ["USER"] }), children: _jsx(Route, { path: "/user/dashboard", element: _jsx(UserDashboard, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }) }));
}
