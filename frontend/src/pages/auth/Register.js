import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
const registerObject = z.object({
    fullName: z.string().min(3),
    companyName: z.string().optional(),
    officialEmail: z.string().email(),
    contactNumber: z.string().optional(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    role: z.enum(["ADMIN", "MANAGER", "USER"]),
    warehouseLocationCode: z.string().optional(),
    warehouseLocationName: z.string().optional()
});
const registerSchema = registerObject
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
})
    .superRefine((data, ctx) => {
    if (data.role !== "ADMIN") {
        if (!data.warehouseLocationName || data.warehouseLocationName.trim().length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["warehouseLocationName"],
                message: "Warehouse location is required"
            });
        }
        if (!data.warehouseLocationCode || data.warehouseLocationCode.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["warehouseLocationCode"],
                message: "Warehouse code is required"
            });
        }
    }
});
export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: "USER" }
    });
    const selectedRole = watch("role");
    const onSubmit = async (values) => {
        try {
            setError(null);
            await registerUser({
                fullName: values.fullName,
                companyName: values.companyName,
                officialEmail: values.officialEmail,
                contactNumber: values.contactNumber,
                password: values.password,
                role: values.role,
                warehouseLocationCode: values.role !== "ADMIN" ? values.warehouseLocationCode?.trim() : undefined,
                warehouseLocationName: values.warehouseLocationName?.trim()
            });
            navigate("/login");
        }
        catch (err) {
            setError(err.response?.data?.message ?? "Registration failed");
        }
    };
    return (_jsxs("div", { className: "flex min-h-screen", children: [_jsxs("div", { className: "flex flex-1 flex-col justify-center bg-blue-600 px-16 text-white", children: [_jsx("h2", { className: "mb-6 text-4xl font-bold uppercase tracking-widest", children: "Information" }), _jsx("p", { className: "mb-6 max-w-md text-sm leading-relaxed", children: "Welcome to SmartShelfX. Join us to revolutionize your inventory management with AI-powered forecasting and automated restocking." }), _jsx("p", { className: "text-sm", children: "Already have an account?" }), _jsx(Link, { to: "/login", className: "mt-4 inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600", children: "Have an Account" })] }), _jsx("div", { className: "flex flex-1 items-center justify-center bg-blue-50 p-12", children: _jsxs("div", { className: "w-full max-w-2xl", children: [_jsx("h2", { className: "mb-6 text-center text-3xl font-semibold uppercase", children: "Register Form" }), _jsxs("form", { className: "grid grid-cols-2 gap-6", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { className: "col-span-2 grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold", htmlFor: "fullName", children: "Full Name" }), _jsx("input", { id: "fullName", ...register("fullName"), className: "input" }), errors.fullName && _jsx("span", { className: "text-xs text-red-500", children: errors.fullName.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold", htmlFor: "companyName", children: "Company Name" }), _jsx("input", { id: "companyName", ...register("companyName"), className: "input" })] })] }), _jsxs("div", { className: "col-span-2 grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold", htmlFor: "officialEmail", children: "Official Email ID" }), _jsx("input", { id: "officialEmail", type: "email", ...register("officialEmail"), className: "input" }), errors.officialEmail && _jsx("span", { className: "text-xs text-red-500", children: errors.officialEmail.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold", htmlFor: "contactNumber", children: "Contact Number" }), _jsx("input", { id: "contactNumber", ...register("contactNumber"), className: "input" })] })] }), _jsxs("div", { className: "col-span-2 grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold", htmlFor: "password", children: "Password" }), _jsx("input", { id: "password", type: "password", ...register("password"), className: "input" }), errors.password && _jsx("span", { className: "text-xs text-red-500", children: errors.password.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold", htmlFor: "confirmPassword", children: "Confirm Password" }), _jsx("input", { id: "confirmPassword", type: "password", ...register("confirmPassword"), className: "input" }), errors.confirmPassword && _jsx("span", { className: "text-xs text-red-500", children: errors.confirmPassword.message })] })] }), _jsxs("div", { className: "col-span-2 grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold", htmlFor: "role", children: "Role" }), _jsxs("select", { id: "role", ...register("role"), className: "input", children: [_jsx("option", { value: "USER", children: "User" }), _jsx("option", { value: "MANAGER", children: "Warehouse Manager" }), _jsx("option", { value: "ADMIN", children: "Admin" })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold", htmlFor: "warehouseLocationName", children: "Warehouse Location" }), _jsx("input", { id: "warehouseLocationName", ...register("warehouseLocationName"), className: "input" }), errors.warehouseLocationName && (_jsx("span", { className: "text-xs text-red-500", children: errors.warehouseLocationName.message }))] })] }), selectedRole !== "ADMIN" && (_jsx("div", { className: "col-span-2", children: _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-sm font-semibold", htmlFor: "warehouseLocationCode", children: "Warehouse Code" }), _jsx("input", { id: "warehouseLocationCode", ...register("warehouseLocationCode"), className: "input" })] }) })), _jsx("div", { className: "col-span-2", children: _jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", required: true, className: "h-4 w-4" }), " I agree to the Terms and Conditions"] }) }), error && _jsx("div", { className: "col-span-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-600", children: error }), _jsx("div", { className: "col-span-2", children: _jsx("button", { type: "submit", disabled: isSubmitting, className: "w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-70", children: isSubmitting ? "Creating..." : "Register" }) })] })] }) })] }));
}
