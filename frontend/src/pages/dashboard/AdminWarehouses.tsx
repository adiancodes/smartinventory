import { useQuery } from "@tanstack/react-query";
import { fetchWarehouses } from "../../api/warehouses";
import { WarehouseSummary } from "../../types/product";
import { AdminTopNav } from "../../components/layout/AdminTopNav";

export default function AdminWarehouses() {
  const { data: warehouses = [], isLoading, isError } = useQuery({
    queryKey: ["admin", "warehouses"],
    queryFn: fetchWarehouses
  });

  return (
    <div className="min-h-screen bg-ash">
      <AdminTopNav />
      <main className="mx-auto max-w-7xl px-10 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Warehouses</h1>
          <p className="mt-2 text-sm text-slate-500">All active warehouses with their codes and locations.</p>
        </header>
        <section className="rounded-xl bg-white p-6 shadow-md">
          {isLoading && <p className="text-sm text-slate-500">Loading warehouses...</p>}
          {isError && <p className="text-sm text-red-500">Failed to load warehouses.</p>}
          {!isLoading && !isError && warehouses.length === 0 && (
            <p className="text-sm text-slate-500">No warehouses found.</p>
          )}
          {!isLoading && !isError && warehouses.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((warehouse: WarehouseSummary) => (
                    <tr key={warehouse.id} className="border-b last:border-none">
                      <td className="px-4 py-3 font-medium text-slate-800">{warehouse.name}</td>
            <td className="px-4 py-3 text-slate-600">{warehouse.locationCode}</td>
            <td className="px-4 py-3 text-slate-600">{warehouse.active ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
