import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
export const AuthContext = createContext(undefined);
const TOKEN_KEY = "smartshelfx.token";
const USER_KEY = "smartshelfx.user";
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
    });
    const [status, setStatus] = useState(user ? "authenticated" : "unauthenticated");
    useEffect(() => {
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            setStatus("authenticated");
        }
        else {
            localStorage.removeItem(USER_KEY);
            const token = localStorage.getItem(TOKEN_KEY);
            setStatus(token ? "pending" : "unauthenticated");
        }
    }, [user]);
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            return;
        }
        if (user) {
            return;
        }
        const fetchProfile = async () => {
            try {
                const response = await api.get("/auth/me");
                setUser(response.data);
            }
            catch (err) {
                localStorage.removeItem(TOKEN_KEY);
                setStatus("unauthenticated");
            }
        };
        fetchProfile().catch(() => {
            /* swallowed */
        });
    }, [user]);
    const login = async (email, password) => {
        setStatus("pending");
        try {
            const response = await api.post("/auth/login", { email, password });
            localStorage.setItem(TOKEN_KEY, response.data.accessToken);
            setUser(response.data.user);
            setStatus("authenticated");
            return response.data.user;
        }
        catch (error) {
            setStatus("unauthenticated");
            throw error;
        }
    };
    const register = async (payload) => {
        setStatus("pending");
        try {
            const response = await api.post("/auth/register", payload);
            setStatus("unauthenticated");
            return response.data;
        }
        catch (error) {
            setStatus("unauthenticated");
            throw error;
        }
    };
    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setStatus("unauthenticated");
    };
    const value = useMemo(() => ({ user, status, login, logout, register }), [user, status]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
