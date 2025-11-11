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
export declare function InputField({ id, label, type, placeholder, error, register }: InputFieldProps): import("react/jsx-runtime").JSX.Element;
export {};
