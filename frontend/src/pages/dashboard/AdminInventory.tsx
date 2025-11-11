import ProductManagement from "../../components/products/ProductManagement";
import { AdminTopNav } from "../../components/layout/AdminTopNav";

export default function AdminInventory() {
  return (
    <div className="min-h-screen bg-ash">
      <AdminTopNav />
      <main className="mx-auto max-w-7xl px-10 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Inventory Management</h1>
          <p className="mt-2 text-sm text-slate-500">Administer products across every warehouse.</p>
        </header>
        <ProductManagement mode="ADMIN" />
      </main>
    </div>
  );
}
