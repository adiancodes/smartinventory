import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { fetchProducts } from "../../api/products";
import { fetchManagerPurchaseHistory, fetchManagerSalesSummary } from "../../api/purchases";
import { Product } from "../../types/product";
import type { WarehousePurchaseHistoryResponse } from "../../types/purchase";
import TopNavbar from "../../components/layout/TopNavbar";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const warehouseName = user?.warehouseName ?? "My Store";
  const navLinks = [
    { label: "Dashboard", to: "/manager/dashboard" },
    { label: "Inventory", to: "/manager/inventory" },
    { label: "Restock", to: "/manager/restock" }
  ];

  const productsQuery = useQuery({
    queryKey: ["manager", "products", user?.warehouseId],
    queryFn: () => fetchProducts({ warehouseId: user?.warehouseId ?? undefined }),
    enabled: Boolean(user?.warehouseId)
  });
  const salesSummaryQuery = useQuery({
    queryKey: ["manager", "sales-summary", user?.warehouseId],
    queryFn: fetchManagerSalesSummary,
    enabled: Boolean(user?.warehouseId)
  });
  const salesSummary = salesSummaryQuery.data;
  const purchaseHistoryQuery = useQuery<WarehousePurchaseHistoryResponse>({
    queryKey: ["manager", "purchase-history", user?.warehouseId],
    queryFn: fetchManagerPurchaseHistory,
    enabled: Boolean(user?.warehouseId)
  });
  const purchaseHistory = purchaseHistoryQuery.data;

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
      }),
    []
  );

  const { totalProducts, lowStockCount, outOfStockCount, lowStockItems, totalInventoryValue } = useMemo(() => {
    const products: Product[] = productsQuery.data ?? [];
    const totalValue = products.reduce((sum, product) => sum + (product.totalValue ?? 0), 0);
    const lowItems = products.filter((product) => product.currentStock > 0 && product.lowStock);
    const outItems = products.filter((product) => product.currentStock === 0);
    return {
      totalProducts: products.length,
      lowStockCount: lowItems.length,
      outOfStockCount: outItems.length,
      lowStockItems: lowItems,
      totalInventoryValue: totalValue
    };
  }, [productsQuery.data]);

  const historyTotals = useMemo(() => {
    if (!purchaseHistory) {
      return { totalOrders: 0, totalItems: 0, totalRevenue: 0 };
    }
    return {
      totalOrders: purchaseHistory.totalOrders,
      totalItems: purchaseHistory.totalItems,
      totalRevenue: purchaseHistory.totalRevenue
    };
  }, [purchaseHistory]);

  const historyFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <TopNavbar className="py-4" navLinks={navLinks} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
            <div className="flex flex-col gap-4 border-b border-white/40 pb-6 text-sm dark:border-slate-700/60 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-300">Manager workspace</span>
                <h1 className="mt-2 text-2xl font-semibold text-midnight dark:text-white">Store Manager Dashboard</h1>
                <p className="text-sm text-slate-500 dark:text-slate-300">Welcome, {user?.fullName}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="rounded-full bg-white/70 px-3 py-1 dark:bg-slate-800/60">{warehouseName}</span>
                <span className="rounded-full bg-white/70 px-3 py-1 dark:bg-slate-800/60">
                  {productsQuery.isLoading ? "Syncing products" : `${productsQuery.data?.length ?? 0} products`}
                </span>
              </div>
            </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase text-slate-500">{warehouseName}: Total Products</p>
                <p className="mt-4 text-3xl font-semibold text-slate-800">{totalProducts}</p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase text-slate-500">{warehouseName}: Inventory Value</p>
                <p className="mt-4 text-3xl font-semibold text-slate-800">{currencyFormatter.format(totalInventoryValue)}</p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase text-slate-500">{warehouseName}: Low Stock</p>
                <p className="mt-4 text-3xl font-semibold text-amber-600">{lowStockCount}</p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase text-slate-500">{warehouseName}: Out of Stock</p>
                <p className="mt-4 text-3xl font-semibold text-red-600">{outOfStockCount}</p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/90 p-5 shadow-sm transition md:col-span-2 xl:col-span-1 dark:border-slate-700/60 dark:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase text-slate-500">{warehouseName}: Sales</p>
                {salesSummaryQuery.isLoading ? (
                  <p className="mt-4 text-sm text-slate-500">Loading...</p>
                ) : (
                  <div>
                    <p className="mt-4 text-3xl font-semibold text-slate-800">
                      {currencyFormatter.format(salesSummary?.totalRevenue ?? 0)}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {(salesSummary?.totalOrders ?? 0).toLocaleString()} orders · {(salesSummary?.totalItems ?? 0).toLocaleString()} items
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80">
              <h2 className="text-lg font-semibold text-slate-700">Low Stock Items ({warehouseName})</h2>
              {productsQuery.isLoading && <p className="mt-4 text-sm text-slate-500">Loading inventory...</p>}
              {!productsQuery.isLoading && lowStockItems.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">No low stock items. Well done!</p>
              )}
              {!productsQuery.isLoading && lowStockItems.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {lowStockItems.map((product) => (
                    <li key={product.id} className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2">
                      <span className="font-medium text-slate-700">{product.name}</span>
                      <span className="text-xs uppercase text-amber-600">
                        Stock: {product.currentStock} / Reorder: {product.reorderLevel}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/80">
              <h2 className="text-lg font-semibold text-slate-700">Store Widget</h2>
              {purchaseHistoryQuery.isLoading ? (
                <p className="mt-4 text-sm text-slate-500">Loading purchase history...</p>
              ) : !purchaseHistory || purchaseHistory.purchases.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No purchase activity recorded yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {historyTotals.totalOrders.toLocaleString()} orders
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {historyTotals.totalItems.toLocaleString()} items sold
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {currencyFormatter.format(historyTotals.totalRevenue)} revenue
                    </span>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    {purchaseHistory.purchases.slice(0, 8).map((purchase) => (
                      <li key={purchase.purchaseId} className="rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{purchase.productName}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-400">SKU {purchase.productSku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-midnight dark:text-amber-300">
                              {currencyFormatter.format(purchase.totalPrice)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Qty {purchase.quantity}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{purchase.buyerName ?? "Customer"}</span>
                          <span>{historyFormatter.format(new Date(purchase.purchasedAt))}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
      </main>
    </div>
  );
}
