import { useAuth } from "../../hooks/useAuth";
import ProductManagement from "../../components/products/ProductManagement";
import TopNavbar from "../../components/layout/TopNavbar";

export default function ManagerInventory() {
  const { user } = useAuth();
  const warehouseName = user?.warehouseName ?? "My Store";
  const navLinks = [
    { label: "Dashboard", to: "/manager/dashboard" },
    { label: "Inventory", to: "/manager/inventory" },
    { label: "Restock", to: "/manager/restock" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <TopNavbar className="py-4" navLinks={navLinks} />
      <main className="flex w-full flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/40 bg-white/75 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
          <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-midnight dark:text-white">{warehouseName} Inventory</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Manage products, pricing, and replenishment settings across your warehouse.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-midnight dark:text-white">Product Catalog</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Review stock levels, adjust reorder thresholds, and keep SmartShelfX synced with live inventory.
            </p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/90 p-4 shadow-inner dark:border-slate-700/50 dark:bg-slate-900/80">
            <ProductManagement mode="MANAGER" />
          </div>
        </section>
      </main>
    </div>
  );
}
