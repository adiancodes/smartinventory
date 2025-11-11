export type UserRole = "ADMIN" | "MANAGER" | "USER";

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  companyName?: string | null;
  contactNumber?: string | null;
  role: UserRole;
  warehouseId?: number | null;
  warehouseName?: string | null;
  warehouseCode?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: UserProfile;
}
