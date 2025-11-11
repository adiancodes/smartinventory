import { UserRole } from "../types/auth";
interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
    redirectTo?: string;
}
export declare function ProtectedRoute({ allowedRoles, redirectTo }: ProtectedRouteProps): import("react/jsx-runtime").JSX.Element;
export {};
