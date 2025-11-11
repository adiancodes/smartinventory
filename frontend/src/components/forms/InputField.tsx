import { HTMLInputTypeAttribute } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface InputFieldProps {
  id: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  error?: FieldError;
  register: UseFormRegisterReturn;
}

export function InputField({ id, label, type = "text", placeholder, error, register }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/60"
        {...register}
      />
      {error && <span className="text-xs text-red-500">{error.message}</span>}
    </div>
  );
}
