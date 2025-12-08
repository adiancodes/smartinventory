import { RestockModule } from "../../components/restock/RestockModule";
import { useAuth } from "../../hooks/useAuth";
import TopNavbar from "../../components/layout/TopNavbar";

export default function ManagerRestock() {
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
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/40 bg-white/75 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
          <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-midnight dark:text-white">{warehouseName} · Auto-Restock</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Review AI suggestions, consolidate purchase orders, and keep every shelf stocked automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
              <span className="hidden sm:inline">Smart recommendations refresh every 24 hours.</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
          <RestockModule mode="MANAGER" />
        </section>
      </main>
    </div>
  );
}
