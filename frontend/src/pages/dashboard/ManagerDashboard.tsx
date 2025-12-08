import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { fetchProducts } from "../../api/products";
import { fetchManagerPurchaseHistory, fetchManagerSalesSummary } from "../../api/purchases";
import { Product } from "../../types/product";
import type { WarehousePurchaseHistoryResponse } from "../../types/purchase";

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const warehouseName = user?.warehouseName ?? "My Store";

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
    <div className="flex min-h-screen flex-col bg-ash">
      <header className="flex items-center justify-between border-b border-sky-200 bg-sky-100 px-8 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Store Manager Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome, {user?.fullName}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Logout
        </button>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 bg-midnight text-white">
          <nav className="px-6 py-6 space-y-2">
            <Link to="/manager/dashboard" className="block rounded-md bg-sunshine px-4 py-2 text-midnight font-semibold">
              Dashboard
            </Link>
            <Link
              to="/manager/inventory"
              className="block rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Inventory
            </Link>
            <Link
              to="/manager/restock"
              className="block rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Restock
            </Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">{warehouseName}: Total Products</p>
              <p className="mt-4 text-3xl font-semibold text-slate-800">{totalProducts}</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">{warehouseName}: Inventory Value</p>
              <p className="mt-4 text-3xl font-semibold text-slate-800">{currencyFormatter.format(totalInventoryValue)}</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">{warehouseName}: Low Stock</p>
              <p className="mt-4 text-3xl font-semibold text-amber-600">{lowStockCount}</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">{warehouseName}: Out of Stock</p>
              <p className="mt-4 text-3xl font-semibold text-red-600">{outOfStockCount}</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
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
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
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
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700">Store Widget</h2>
              {purchaseHistoryQuery.isLoading ? (
                <p className="mt-4 text-sm text-slate-500">Loading purchase history...</p>
              ) : !purchaseHistory || purchaseHistory.purchases.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No purchase activity recorded yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      {historyTotals.totalOrders.toLocaleString()} orders
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      {historyTotals.totalItems.toLocaleString()} items sold
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      {currencyFormatter.format(historyTotals.totalRevenue)} revenue
                    </span>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600">
                    {purchaseHistory.purchases.slice(0, 8).map((purchase) => (
                      <li key={purchase.purchaseId} className="rounded-lg border border-slate-200 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{purchase.productName}</p>
                            <p className="text-xs text-slate-400">SKU {purchase.productSku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-midnight">
                              {currencyFormatter.format(purchase.totalPrice)}
                            </p>
                            <p className="text-xs text-slate-500">Qty {purchase.quantity}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap justify-between text-xs text-slate-500">
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
    </div>
  );
}
