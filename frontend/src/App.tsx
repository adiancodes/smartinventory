import { Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard";
import ManagerInventory from "./pages/dashboard/ManagerInventory";
import ManagerRestock from "./pages/dashboard/ManagerRestock";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminInventory from "./pages/dashboard/AdminInventory";
import AdminSales from "./pages/dashboard/AdminSales";
import AdminDemandForecast from "./pages/dashboard/AdminDemandForecast";
import AdminRestock from "./pages/dashboard/AdminRestock";
import AdminAnalytics from "./pages/dashboard/AdminAnalytics";
import UserDashboard from "./pages/dashboard/UserDashboard";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import UnauthorizedPage from "./pages/Unauthorized";
import LandingPage from "./pages/landing/LandingPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
  <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}> 
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/inventory" element={<ManagerInventory />} />
          <Route path="/manager/restock" element={<ManagerRestock />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}> 
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/sales" element={<AdminSales />} />
          <Route path="/admin/forecast" element={<AdminDemandForecast />} />
          <Route path="/admin/restock" element={<AdminRestock />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["USER"]} />}> 
          <Route path="/user/dashboard" element={<UserDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
