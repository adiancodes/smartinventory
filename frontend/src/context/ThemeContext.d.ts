import { ReactNode } from "react";
export type ThemeMode = "light" | "dark";
interface ThemeContextValue {
    mode: ThemeMode;
    toggle: () => void;
    setMode: (mode: ThemeMode) => void;
}
export declare function ThemeProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useThemeMode(): ThemeContextValue;
export {};
