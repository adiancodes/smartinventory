import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function InputField({ id, label, type = "text", placeholder, error, register }) {
    return (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: id, className: "text-sm font-semibold text-slate-700", children: label }), _jsx("input", { id: id, type: type, placeholder: placeholder, className: "rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/60", ...register }), error && _jsx("span", { className: "text-xs text-red-500", children: error.message })] }));
}
