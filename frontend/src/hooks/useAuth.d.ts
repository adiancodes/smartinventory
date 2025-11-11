export declare function useAuth(): {
    user: import("../types/auth").UserProfile | null;
    status: "idle" | "pending" | "authenticated" | "unauthenticated";
    login: (email: string, password: string) => Promise<import("../types/auth").UserProfile>;
    register: (payload: import("../context/AuthContext").RegisterPayload) => Promise<import("../types/auth").UserProfile>;
    logout: () => void;
};
