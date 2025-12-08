import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
const ThemeContext = createContext(undefined);
const STORAGE_KEY = "smartshelfx.theme";
function getInitialTheme() {
    if (typeof window === "undefined") {
        return "light";
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
        return stored;
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
}
export function ThemeProvider({ children }) {
    const [mode, setModeState] = useState(getInitialTheme);
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove(mode === "dark" ? "light" : "dark");
        root.classList.add(mode);
        if (mode === "dark") {
            root.classList.add("dark");
        }
        else {
            root.classList.remove("dark");
        }
        window.localStorage.setItem(STORAGE_KEY, mode);
    }, [mode]);
    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!mq) {
            return;
        }
        const handler = (event) => {
            setModeState(event.matches ? "dark" : "light");
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    const value = useMemo(() => ({
        mode,
        toggle: () => setModeState((prev) => (prev === "dark" ? "light" : "dark")),
        setMode: setModeState
    }), [mode]);
    return _jsx(ThemeContext.Provider, { value: value, children: children });
}
export function useThemeMode() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useThemeMode must be used inside ThemeProvider");
    }
    return ctx;
}
