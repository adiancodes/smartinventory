import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminTopNav } from "../../components/layout/AdminTopNav";
import {
  fetchAdminSalesSummary,
  fetchAdminSalesByWarehouse,
  fetchAdminProductSalesForWarehouse
} from "../../api/purchases";
import { WarehouseProductSales, WarehouseSalesSummary } from "../../types/purchase";

export default function AdminSales() {
  const totalSalesQuery = useQuery({
    queryKey: ["admin", "sales", "summary"],
    queryFn: fetchAdminSalesSummary
  });

  const salesByWarehouseQuery = useQuery({
    queryKey: ["admin", "sales", "warehouses"],
    queryFn: fetchAdminSalesByWarehouse
  });

  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseSalesSummary | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const summary = totalSalesQuery.data;
  const salesByWarehouse = salesByWarehouseQuery.data ?? [];

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
      }),
    []
  );

  const maxRevenue = useMemo(() => {
    if (!salesByWarehouse.length) {
      return 0;
    }
    return Math.max(...salesByWarehouse.map((warehouse) => Number(warehouse.totalRevenue ?? 0)));
  }, [salesByWarehouse]);

  const warehouseProductsQuery = useQuery({
    queryKey: ["admin", "sales", "warehouses", selectedWarehouse?.warehouseId, "products"],
    queryFn: () => fetchAdminProductSalesForWarehouse(selectedWarehouse!.warehouseId),
    enabled: isDetailsOpen && selectedWarehouse !== null
  });

  const storeItems = warehouseProductsQuery.data ?? [];

  const handleStoreClick = (warehouse: WarehouseSalesSummary) => {
    setSelectedWarehouse(warehouse);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedWarehouse(null);
  };

  return (
    <div className="min-h-screen bg-ash">
      <AdminTopNav />
      <main className="mx-auto max-w-7xl px-10 py-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Sales Intelligence</h1>
            <p className="text-sm text-slate-500">Monitor revenue trends and performance by warehouse.</p>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Revenue</p>
            {totalSalesQuery.isLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading...</p>
            ) : (
              <p className="mt-4 text-3xl font-semibold text-slate-800">
                {currencyFormatter.format(summary?.totalRevenue ?? 0)}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase text-slate-500">Orders</p>
            {totalSalesQuery.isLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading...</p>
            ) : (
              <p className="mt-4 text-3xl font-semibold text-slate-800">{summary?.totalOrders ?? 0}</p>
            )}
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase text-slate-500">Products Sold</p>
            {totalSalesQuery.isLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading...</p>
            ) : (
              <p className="mt-4 text-3xl font-semibold text-slate-800">{summary?.totalItems ?? 0}</p>
            )}
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase text-slate-500">Active Stores</p>
            {salesByWarehouseQuery.isLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading...</p>
            ) : (
              <p className="mt-4 text-3xl font-semibold text-slate-800">{salesByWarehouse.length}</p>
            )}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-xl bg-white p-6 shadow-md lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700">Sales by Warehouse</h2>
              <span className="text-xs uppercase text-slate-400">Past all time</span>
            </div>
            {salesByWarehouseQuery.isLoading ? (
              <p className="mt-6 text-sm text-slate-500">Loading chart...</p>
            ) : salesByWarehouse.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No sales recorded yet.</p>
            ) : (
              <div className="mt-8 flex items-end gap-6 overflow-x-auto pb-4">
                {salesByWarehouse.map((warehouse) => {
                  const revenue = Number(warehouse.totalRevenue ?? 0);
                  const height = maxRevenue > 0 ? Math.max((revenue / maxRevenue) * 240, 8) : 8;
                  return (
                    <div key={warehouse.warehouseId} className="flex flex-col items-center gap-3 text-sm">
                      <div
                        className="flex h-60 w-14 items-end rounded-lg bg-sky-100"
                        role="presentation"
                      >
                        <div
                          className="w-full rounded-lg bg-midnight"
                          style={{ height: `${height}px` }}
                          title={`${warehouse.warehouseName}: ${currencyFormatter.format(revenue)}`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="max-w-[5rem] truncate text-xs font-semibold text-slate-700">
                          {warehouse.warehouseName}
                        </p>
                        <p className="text-[10px] text-slate-400">{warehouse.totalItems} items</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-700">Store Breakdown</h2>
            {salesByWarehouseQuery.isLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading stores...</p>
            ) : salesByWarehouse.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No sales available.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {salesByWarehouse.map((warehouse) => (
                  <li key={warehouse.warehouseId}>
                    <button
                      type="button"
                      onClick={() => handleStoreClick(warehouse)}
                      className="flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-sky-200 hover:bg-sky-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{warehouse.warehouseName}</p>
                        <p className="text-xs uppercase text-slate-400">{warehouse.warehouseCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-midnight">
                          {currencyFormatter.format(Number(warehouse.totalRevenue ?? 0))}
                        </p>
                        <p className="text-xs text-slate-500">
                          {warehouse.totalItems} items · {warehouse.totalOrders} orders
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      {isDetailsOpen && selectedWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{selectedWarehouse.warehouseName}</h3>
                <p className="text-sm text-slate-500">
                  Code {selectedWarehouse.warehouseCode} · {selectedWarehouse.totalOrders} orders ·
                  {" "}
                  {selectedWarehouse.totalItems} items ·
                  {" "}
                  {currencyFormatter.format(Number(selectedWarehouse.totalRevenue ?? 0))}
                </p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>

            {warehouseProductsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading product sales…</p>
            ) : warehouseProductsQuery.isError ? (
              <p className="text-sm text-red-500">Unable to load product sales for this store.</p>
            ) : storeItems.length === 0 ? (
              <p className="text-sm text-slate-500">No products sold from this store yet.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full table-auto text-left text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">Orders</th>
                      <th className="px-4 py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeItems.map((item: WarehouseProductSales) => (
                      <tr key={item.productId} className="border-b last:border-none">
                        <td className="px-4 py-3 font-medium text-slate-800">{item.productName}</td>
                        <td className="px-4 py-3 text-slate-500">{item.productSku}</td>
                        <td className="px-4 py-3 text-slate-600">{item.totalQuantity}</td>
                        <td className="px-4 py-3 text-slate-600">{item.totalOrders}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {currencyFormatter.format(Number(item.totalRevenue ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
