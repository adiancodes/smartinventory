import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters")
});
export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(loginSchema)
    });
    const onSubmit = async (values) => {
        try {
            setError(null);
            const profile = await login(values.email, values.password);
            if (profile.role === "ADMIN") {
                navigate("/admin/dashboard");
            }
            else if (profile.role === "MANAGER") {
                navigate("/manager/dashboard");
            }
            else {
                navigate("/user/dashboard");
            }
        }
        catch (err) {
            setError(err.response?.data?.message ?? "Unable to sign in");
        }
    };
    return (_jsxs("div", { className: "flex min-h-screen", children: [_jsx("div", { className: "flex flex-1 flex-col items-center justify-center bg-midnight text-white", children: _jsx("h1", { className: "text-3xl font-semibold", children: "Welcome Back!" }) }), _jsx("div", { className: "flex flex-1 items-center justify-center bg-sunshine", children: _jsxs("div", { className: "w-full max-w-md rounded-2xl bg-white p-10 shadow-lg", children: [_jsx("div", { className: "mb-8 text-center", children: _jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-slate-400", children: "Already Members" }) }), _jsxs("form", { className: "space-y-6", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold text-slate-600", htmlFor: "email", children: "Email" }), _jsx("input", { id: "email", type: "email", placeholder: "Email", ...register("email"), className: "rounded-md border border-slate-200 px-4 py-3 text-slate-900 focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/50" }), errors.email && _jsx("span", { className: "text-xs text-red-500", children: errors.email.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold text-slate-600", htmlFor: "password", children: "Password" }), _jsx("input", { id: "password", type: "password", placeholder: "Enter your password", ...register("password"), className: "rounded-md border border-slate-200 px-4 py-3 text-slate-900 focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/50" }), errors.password && _jsx("span", { className: "text-xs text-red-500", children: errors.password.message })] })] }), error && _jsx("div", { className: "rounded-md bg-red-100 px-3 py-2 text-sm text-red-600", children: error }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70", children: isSubmitting ? "Signing in..." : "Sign in" })] }), _jsxs("div", { className: "mt-6 text-center text-sm text-slate-500", children: [_jsx("p", { children: "Don't have an account yet?" }), _jsx(Link, { to: "/register", className: "font-semibold text-slate-900", children: "Create an account" })] })] }) })] }));
}
