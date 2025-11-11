import { AdminTopNav } from "../../components/layout/AdminTopNav";
import { RestockModule } from "../../components/restock/RestockModule";

export default function AdminRestock() {
  return (
    <div className="min-h-screen bg-ash">
      <AdminTopNav />
      <main className="mx-auto max-w-7xl px-10 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Auto-Restock & Purchase Orders</h1>
          <p className="mt-2 text-sm text-slate-500">
            Forecast-driven recommendations prioritized by velocity, with quick purchase-order workflows.
          </p>
        </header>
        <RestockModule mode="ADMIN" />
      </main>
    </div>
  );
}
