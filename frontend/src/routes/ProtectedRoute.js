import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export function ProtectedRoute({ allowedRoles, redirectTo = "/login" }) {
    const { user, status } = useAuth();
    if (status === "pending" || status === "idle") {
        return _jsx("div", { className: "flex h-screen items-center justify-center", children: "Loading..." });
    }
    if (!user) {
        return _jsx(Navigate, { to: redirectTo, replace: true });
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return _jsx(Navigate, { to: "/unauthorized", replace: true });
    }
    return _jsx(Outlet, {});
}
