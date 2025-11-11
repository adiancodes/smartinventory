import { Link } from "react-router-dom";
import { RestockModule } from "../../components/restock/RestockModule";
import { useAuth } from "../../hooks/useAuth";

export default function ManagerRestock() {
  const { user } = useAuth();
  const warehouseName = user?.warehouseName ?? "My Store";

  return (
    <div className="flex min-h-screen flex-col bg-ash">
      <header className="flex items-center justify-between bg-white px-8 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{warehouseName} · Auto-Restock</h1>
          <p className="text-sm text-slate-500">Review AI suggestions and send purchase orders directly to vendors.</p>
        </div>
        <Link className="text-sm font-semibold text-slate-500 hover:text-slate-800" to="/manager/dashboard">
          Back to Dashboard
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto p-8">
        <RestockModule mode="MANAGER" />
      </main>
    </div>
  );
}
