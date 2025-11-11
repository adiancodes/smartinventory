import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ProductManagement from "../../components/products/ProductManagement";

export default function ManagerInventory() {
  const { user } = useAuth();
  const warehouseName = user?.warehouseName ?? "My Store";

  return (
    <div className="flex min-h-screen flex-col bg-ash">
      <header className="flex items-center justify-between bg-white px-8 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{warehouseName} Inventory</h1>
          <p className="text-sm text-slate-500">Manage products for your warehouse.</p>
        </div>
        <Link className="text-sm font-semibold text-slate-500 hover:text-slate-800" to="/manager/dashboard">
          Back to Dashboard
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">My Store Inventory</h2>
            <p className="text-sm text-slate-500">Review stock levels, pricing, and auto-restock settings for every item.</p>
          </div>
          <ProductManagement mode="MANAGER" />
        </div>
      </main>
    </div>
  );
}
