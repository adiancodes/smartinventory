import { ReactNode } from "react";
import { UserProfile } from "../types/auth";
type AuthStatus = "idle" | "pending" | "authenticated" | "unauthenticated";
type AuthContextType = {
    user: UserProfile | null;
    status: AuthStatus;
    login: (email: string, password: string) => Promise<UserProfile>;
    register: (payload: RegisterPayload) => Promise<UserProfile>;
    logout: () => void;
};
export interface RegisterPayload {
    fullName: string;
    companyName?: string;
    officialEmail: string;
    contactNumber?: string;
    password: string;
    role: "ADMIN" | "MANAGER" | "USER";
    warehouseLocationCode?: string;
    warehouseLocationName?: string;
}
export declare const AuthContext: import("react").Context<AuthContextType | undefined>;
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
