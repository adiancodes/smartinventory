import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function AdminTopNav() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sky-200 bg-sky-100/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-midnight">SmartShelfX Admin</span>
          <nav className="flex items-center gap-4 text-sm font-semibold text-slate-600">
            <Link
              to="/admin/dashboard"
              className="rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight"
            >
              Home
            </Link>
            <Link
              to="/admin/inventory"
              className="rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight"
            >
              Inventory
            </Link>
            <Link
              to="/admin/sales"
              className="rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight"
            >
              Sales
            </Link>
            <Link
              to="/admin/forecast"
              className="rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight"
            >
              Forecast
            </Link>
            <Link
              to="/admin/restock"
              className="rounded-md px-3 py-1 hover:bg-sky-200 hover:text-midnight"
            >
              Restock
            </Link>
          </nav>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
