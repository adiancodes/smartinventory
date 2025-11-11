import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { fetchProducts } from "../../api/products";
import { fetchAdminSalesSummary, fetchAdminSalesByWarehouse } from "../../api/purchases";
import { WarehouseSalesSummary } from "../../types/purchase";
import { Product } from "../../types/product";
import { AdminTopNav } from "../../components/layout/AdminTopNav";

interface ManagerSummary {
  id: number;
  fullName: string;
  email: string;
  warehouseName: string | null;
  warehouseCode: string | null;
}

interface ManagerDetail extends ManagerSummary {
  warehouseLocation?: string | null;
  totalProducts?: number;
  totalValue?: number;
  lowStockCount?: number;
}

export default function AdminDashboard() {
  const managersQuery = useQuery({
    queryKey: ["admin", "managers"],
    queryFn: async () => {
      const response = await api.get<ManagerSummary[]>("/auth/admin/managers");
      return response.data;
    }
  });

  const productsQuery = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => fetchProducts()
  });
  const salesSummaryQuery = useQuery({
    queryKey: ["admin", "sales-summary"],
    queryFn: fetchAdminSalesSummary
  });
  const salesSummary = salesSummaryQuery.data;
  const salesByWarehouseQuery = useQuery({
    queryKey: ["admin", "sales-by-warehouse"],
    queryFn: fetchAdminSalesByWarehouse
  });
  const warehouseSales = salesByWarehouseQuery.data ?? [];

  const products: Product[] = productsQuery.data ?? [];
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
      }),
    []
  );
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<ManagerDetail | null>(null);
  const [isLoadingManagerDetail, setIsLoadingManagerDetail] = useState(false);
  const [managerDetailError, setManagerDetailError] = useState<string | null>(null);
  const { lowStockItems, outOfStockItems, totalInventoryValue } = useMemo(() => {
    const lowItems = products.filter((product: Product) => product.currentStock > 0 && product.lowStock);
    const outItems = products.filter((product: Product) => product.currentStock === 0);
    const totalValue = products.reduce((sum, product) => sum + (product.totalValue ?? 0), 0);
    return { lowStockItems: lowItems, outOfStockItems: outItems, totalInventoryValue: totalValue };
  }, [products]);

  const maxWarehouseRevenue = useMemo(() => {
    if (!warehouseSales.length) {
      return 0;
    }
    return Math.max(...warehouseSales.map((warehouse) => Number(warehouse.totalRevenue ?? 0)));
  }, [warehouseSales]);

  const lowStockCount = lowStockItems.length;
  const outOfStockCount = outOfStockItems.length;

  return (
    <div className="min-h-screen bg-ash">
      <AdminTopNav />
      <main className="mx-auto max-w-7xl px-10 py-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Monitor managers and inventory performance across warehouses.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/sales"
              className="inline-flex items-center justify-center rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900"
            >
              View Sales
            </Link>
            <Link
              to="/admin/forecast"
              className="inline-flex items-center justify-center rounded-md border border-midnight px-4 py-2 text-sm font-semibold text-midnight shadow-sm hover:bg-sky-100"
            >
              Forecast Demand
            </Link>
          </div>
        </header>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Products</p>
            <p className="mt-4 text-3xl font-semibold text-slate-800">{products.length}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase text-slate-500">Inventory Value</p>
            <p className="mt-4 text-3xl font-semibold text-slate-800">{currencyFormatter.format(totalInventoryValue)}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowLowStockModal(true)}
            className="rounded-xl bg-white p-6 text-left shadow-md transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">Low Stock Alerts</p>
            <p className="mt-4 text-3xl font-semibold text-amber-600">{lowStockCount}</p>
            <p className="mt-2 text-xs text-slate-400">Tap to view details</p>
          </button>
          <button
            type="button"
            onClick={() => setShowOutOfStockModal(true)}
            className="rounded-xl bg-white p-6 text-left shadow-md transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">Out of Stock</p>
            <p className="mt-4 text-3xl font-semibold text-red-600">{outOfStockCount}</p>
            <p className="mt-2 text-xs text-slate-400">Tap to view details</p>
          </button>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-xs font-semibold uppercase text-slate-500">Sales</p>
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

        <section className="mt-8 rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-700">Sales by Warehouse</h2>
              <p className="text-sm text-slate-500">Visual snapshot of revenue contribution per store.</p>
            </div>
            <Link className="text-sm font-semibold text-midnight" to="/admin/sales">
              See detailed report
            </Link>
          </div>
          {salesByWarehouseQuery.isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading chart...</p>
          ) : warehouseSales.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No sales recorded yet.</p>
          ) : (
            <div className="mt-6 flex items-end gap-6 overflow-x-auto pb-4">
              {warehouseSales.map((warehouse: WarehouseSalesSummary) => {
                const revenue = Number(warehouse.totalRevenue ?? 0);
                const height = maxWarehouseRevenue > 0 ? Math.max((revenue / maxWarehouseRevenue) * 220, 10) : 10;
                return (
                  <div key={warehouse.warehouseId} className="flex flex-col items-center gap-2 text-sm">
                    <div className="flex h-56 w-12 items-end rounded-lg bg-sky-100">
                      <div
                        className="w-full rounded-lg bg-midnight"
                        style={{ height: `${height}px` }}
                        title={`${warehouse.warehouseName}: ${currencyFormatter.format(revenue)}`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="max-w-[4.5rem] truncate text-xs font-semibold text-slate-700">
                        {warehouse.warehouseName}
                      </p>
                      <p className="text-[10px] text-slate-400">{warehouse.totalItems} items</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

  <section className="mt-8 rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-700">Warehouse Managers</h2>
              <p className="text-sm text-slate-500">Current roster of store leads.</p>
            </div>
          </div>
          {managersQuery.isLoading && <p>Loading managers...</p>}
          {managersQuery.isError && <p className="text-red-500">Failed to load managers.</p>}
          {managersQuery.data && (
            <table className="mt-4 w-full table-auto text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Warehouse</th>
                  <th className="px-4 py-2">Code</th>
                </tr>
              </thead>
              <tbody>
                {managersQuery.data.map((manager) => (
                  <tr
                    key={manager.id}
                    className="cursor-pointer border-b last:border-none transition hover:bg-slate-50"
                    onClick={async () => {
                      setManagerDetailError(null);
                      setSelectedManager({ ...manager });
                      setIsLoadingManagerDetail(true);
                      try {
                        const response = await api.get<ManagerDetail>(`/warehouses/manager/${manager.id}`);
                        setSelectedManager(response.data);
                      } catch (error) {
                        const err = error as AxiosError<{ message?: string }>;
                        setManagerDetailError(err.response?.data?.message ?? "Unable to load manager details");
                      } finally {
                        setIsLoadingManagerDetail(false);
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{manager.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{manager.email}</td>
                    <td className="px-4 py-3 text-slate-600">{manager.warehouseName ?? "--"}</td>
                    <td className="px-4 py-3 text-slate-600">{manager.warehouseCode ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

  <section className="mt-8 rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-700">Inventory Overview</h2>
              <p className="text-sm text-slate-500">All products and their warehouse assignments.</p>
            </div>
            <Link className="text-sm font-semibold text-midnight" to="/admin/inventory">
              Manage Inventory
            </Link>
          </div>
          {productsQuery.isLoading && <p className="mt-4">Loading products...</p>}
          {productsQuery.isError && <p className="mt-4 text-red-500">Failed to load products.</p>}
          {products.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">SKU</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Vendor</th>
                    <th className="px-4 py-2">Stock</th>
                    <th className="px-4 py-2">Warehouse</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 10).map((product: Product) => (
                    <tr key={product.id} className="border-b last:border-none">
                      <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                      <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                      <td className="px-4 py-3 text-slate-600">{product.category}</td>
                      <td className="px-4 py-3 text-slate-600">{product.vendor}</td>
                      <td className="px-4 py-3 text-slate-600">{product.currentStock}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.warehouseName}
                        <span className="ml-2 text-xs text-slate-400">{product.warehouseCode}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {products.length === 0 && !productsQuery.isLoading && (
            <p className="mt-4 text-sm text-slate-500">No products available yet.</p>
          )}
        </section>
      </main>
      {showLowStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Low Stock Products</h3>
                <p className="text-sm text-slate-500">Items at or below reorder levels across warehouses.</p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => setShowLowStockModal(false)}
              >
                Close
              </button>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-slate-500">All products are healthy right now.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full table-auto text-left text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Stock</th>
                      <th className="px-4 py-2">Reorder Level</th>
                      <th className="px-4 py-2">Warehouse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((product) => (
                      <tr key={product.id} className="border-b last:border-none">
                        <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                        <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                        <td className="px-4 py-3 text-slate-600">{product.currentStock}</td>
                        <td className="px-4 py-3 text-slate-600">{product.reorderLevel}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {product.warehouseName}
                          <span className="ml-2 text-xs text-slate-400">{product.warehouseCode}</span>
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

      {showOutOfStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Out of Stock Products</h3>
                <p className="text-sm text-slate-500">Items that require immediate replenishment.</p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => setShowOutOfStockModal(false)}
              >
                Close
              </button>
            </div>
            {outOfStockItems.length === 0 ? (
              <p className="text-sm text-slate-500">No products are fully out of stock.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full table-auto text-left text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Warehouse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outOfStockItems.map((product) => (
                      <tr key={product.id} className="border-b last:border-none">
                        <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                        <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                        <td className="px-4 py-3 text-slate-600">{product.category}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {product.warehouseName}
                          <span className="ml-2 text-xs text-slate-400">{product.warehouseCode}</span>
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

      {selectedManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Store Details</h3>
                <p className="text-sm text-slate-500">Manager: {selectedManager.fullName}</p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setSelectedManager(null);
                  setManagerDetailError(null);
                }}
              >
                Close
              </button>
            </div>
            {isLoadingManagerDetail ? (
              <p className="text-sm text-slate-500">Loading store insights...</p>
            ) : managerDetailError ? (
              <p className="text-sm text-red-500">{managerDetailError}</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Warehouse</p>
                  <p className="mt-2 text-lg font-semibold text-slate-800">{selectedManager.warehouseName ?? "--"}</p>
                  <p className="text-sm text-slate-500">Code: {selectedManager.warehouseCode ?? "--"}</p>
                  {selectedManager.warehouseLocation && selectedManager.warehouseLocation !== selectedManager.warehouseCode && (
                    <p className="text-sm text-slate-500">Location: {selectedManager.warehouseLocation}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500">Total Products</p>
                    <p className="mt-2 text-xl font-semibold text-slate-800">
                      {selectedManager.totalProducts ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500">Inventory Value</p>
                    <p className="mt-2 text-xl font-semibold text-slate-800">
                      {currencyFormatter.format(selectedManager.totalValue ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500">Low Stock</p>
                    <p className="mt-2 text-xl font-semibold text-slate-800">
                      {selectedManager.lowStockCount ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
