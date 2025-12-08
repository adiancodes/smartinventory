import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Cell
} from "recharts";
import { AxiosError } from "axios";
import { AdminTopNav } from "../../components/layout/AdminTopNav";
import { fetchWarehouses } from "../../api/warehouses";
import {
  downloadAnalyticsExcel,
  downloadAnalyticsPdf,
  fetchAnalyticsDashboard
} from "../../api/analytics";
import type { StatusSlice } from "../../types/analytics";
const STATUS_COLOR_MAP: Record<string, string> = {
  Healthy: "#2563eb",
  "Low Stock": "#f97316",
  "Out of Stock": "#ef4444"
};
const STATUS_COLORS = Object.values(STATUS_COLOR_MAP);
function toMonthLabel(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function extractFilename(contentDisposition?: string, fallback = "analytics-dashboard") {
  if (!contentDisposition) {
    return `${fallback}.dat`;
  }
  const match = /filename=\"?([^\";]+)\"?/i.exec(contentDisposition);
  if (match && match[1]) {
    return match[1];
  }
  return `${fallback}.dat`;
}

async function triggerDownload(fetcher: () => Promise<any>, fallbackName: string) {
  try {
    const response = await fetcher();
    const blob: Blob = response.data;
    const disposition: string | undefined = response.headers["content-disposition"];
    const filename = extractFilename(disposition, fallbackName);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    const message = (error as AxiosError<{ message?: string }>).response?.data?.message ?? "Unable to download file";
    window.alert(message);
  }
}

export default function AdminAnalytics() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("ALL");
  const warehouseQuery = useQuery({
    queryKey: ["warehouses", "analytics"],
    queryFn: fetchWarehouses
  });
  const warehouseId = selectedWarehouse !== "ALL" ? Number(selectedWarehouse) : undefined;
  const dashboardQuery = useQuery({
    queryKey: ["analytics", { warehouseId }],
    queryFn: () => fetchAnalyticsDashboard(warehouseId)
  });
  const dashboard = dashboardQuery.data;

  type PieDatum = {
    name: string;
    value: number;
    count: number;
    units: number;
  };

  const pieSourceData = useMemo<PieDatum[]>(() => {
    if (!dashboard) {
      return [];
    }
    return dashboard.statusDistribution.map((slice: StatusSlice) => ({
      name: slice.key,
      value: slice.productCount,
      count: slice.productCount,
      units: slice.totalUnits
    }));
  }, [dashboard]);

  const pieData = useMemo(() => pieSourceData.filter((slice) => slice.value > 0), [pieSourceData]);

  const pieLegend = useMemo(
    () =>
      pieSourceData.map((slice) => ({
        value: slice.name,
        type: "square" as const,
        color: STATUS_COLOR_MAP[slice.name] ?? STATUS_COLORS[0]
      })),
    [pieSourceData]
  );

  const quantityChartData = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    return dashboard.monthlyQuantityTrend.map((point) => ({
      month: toMonthLabel(point.year, point.month),
      restocked: point.restockedQuantity,
      sold: point.soldQuantity
    }));
  }, [dashboard]);

  const financialChartData = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    return dashboard.monthlyFinancials.map((point) => ({
      month: toMonthLabel(point.year, point.month),
      restockSpend: point.restockSpend,
      salesRevenue: point.salesRevenue
    }));
  }, [dashboard]);

  const restockDemandData = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    return dashboard.restockDemandComparison.map((point) => ({
      product: `${point.productName} (${point.productSku})`,
      restocked: point.restockedQuantity,
      sold: point.soldQuantity
    }));
  }, [dashboard]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }), []);

  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    []
  );

  const totalRestockValue = dashboard?.monthlyFinancials.reduce((sum, point) => sum + point.restockSpend, 0) ?? 0;
  const totalSalesValue = dashboard?.monthlyFinancials.reduce((sum, point) => sum + point.salesRevenue, 0) ?? 0;

  return (
    <div className="min-h-screen bg-ash">
      <AdminTopNav />
      <main className="w-full px-10 py-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Analytics & Reports</h1>
            <p className="mt-1 text-sm text-slate-500">
              Interactive insights across inventory, restocks, and sales. Switch scope to drill into a warehouse.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1 text-sm">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="warehouse-select">
                Scope
              </label>
              <select
                id="warehouse-select"
                className="input"
                value={selectedWarehouse}
                onChange={(event) => setSelectedWarehouse(event.target.value)}
              >
                <option value="ALL">All Warehouses</option>
                {warehouseQuery.data?.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.locationCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => triggerDownload(() => downloadAnalyticsPdf(warehouseId), "analytics-dashboard.pdf")}
              >
                Export PDF
              </button>
              <button
                type="button"
                className="rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900"
                onClick={() => triggerDownload(() => downloadAnalyticsExcel(warehouseId), "analytics-dashboard.xlsx")}
              >
                Export Excel
              </button>
            </div>
          </div>
        </header>

        {dashboardQuery.isLoading ? (
          <p className="mt-8 text-sm text-slate-500">Loading analytics...</p>
        ) : dashboardQuery.isError ? (
          <p className="mt-8 text-sm text-red-500">Failed to load analytics dashboard.</p>
        ) : dashboard ? (
          <div className="mt-8 space-y-8">
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">Scope</p>
                <p className="mt-3 text-lg font-semibold text-slate-800">{dashboard.scopeLabel}</p>
                <p className="mt-1 text-xs text-slate-400">Updated {dateTimeFormatter.format(new Date(dashboard.generatedAt))}</p>
              </div>
              <StatCard label="Total Products" value={dashboard.inventoryStatus.totalProducts.toLocaleString()} />
              <StatCard label="Inventory Units" value={dashboard.inventoryStatus.totalUnits.toLocaleString()} />
              <StatCard label="Low Stock" value={dashboard.inventoryStatus.lowStockProducts.toLocaleString()} intent="warning" />
              <StatCard label="Out of Stock" value={dashboard.inventoryStatus.outOfStockProducts.toLocaleString()} intent="danger" />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <SectionHeader title="Inventory Status Mix" subtitle="Pie chart capturing product distribution across health bands." />
                {pieData.length === 0 ? (
                  <EmptyState message="No inventory data yet." />
                ) : (
                  <div className="mt-6 h-72">
                    <ResponsiveContainer>
                      <PieChart>
                        <RechartsTooltip formatter={(value, _name, payload) => [`${value} products`, payload?.name]} />
                        <Legend />
                        <Pie
                          dataKey="value"
                          data={pieData}
                          outerRadius={110}
                          label={({ name, value }) => `${name} (${value})`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <SectionHeader title="Restock vs Demand" subtitle="Bar chart comparison of quantities restocked versus sold." />
                {quantityChartData.length === 0 ? (
                  <EmptyState message="No monthly signals yet." />
                ) : (
                  <div className="mt-6 h-72">
                    <ResponsiveContainer>
                      <BarChart data={quantityChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="restocked" fill="#2563eb" name="Restocked" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="sold" fill="#f97316" name="Sold" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm">
              <SectionHeader title="Purchases vs Sales" subtitle="Monthly spend on purchase orders versus realised sales revenue." />
              {financialChartData.length === 0 ? (
                <EmptyState message="No financial data computed yet." />
              ) : (
                <div className="mt-6 h-80">
                  <ResponsiveContainer>
                    <BarChart data={financialChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value: number) => currencyFormatter.format(value).replace(/^₹\s?/, "₹ ")} tick={{ fontSize: 12 }} />
                      <RechartsTooltip formatter={(value: number) => currencyFormatter.format(value)} />
                      <Legend />
                      <Bar dataKey="restockSpend" fill="#0f172a" name="Restock Spend" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="salesRevenue" fill="#16a34a" name="Sales Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Total Restock Spend</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{currencyFormatter.format(totalRestockValue)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Total Sales Revenue</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{currencyFormatter.format(totalSalesValue)}</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <SectionHeader title="Top Restocked Items" subtitle="Most frequently replenished products from purchase orders." />
                {dashboard.topRestockedItems.length === 0 ? (
                  <EmptyState message="No restock activity captured." />
                ) : (
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {dashboard.topRestockedItems.map((item) => (
                      <li key={item.productSku} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-800">{item.productName}</p>
                          <p className="text-xs text-slate-400">SKU {item.productSku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-700">{item.totalQuantity.toLocaleString()} units</p>
                          <p className="text-xs text-slate-400">{item.orderCount.toLocaleString()} purchase orders</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <SectionHeader title="Restock vs Demand by Product" subtitle="Side-by-side bars tracking restocked versus sold units." />
                {restockDemandData.length === 0 ? (
                  <EmptyState message="No overlapping data for restock and demand." />
                ) : (
                  <div className="mt-6 h-72">
                    <ResponsiveContainer>
                      <BarChart data={restockDemandData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="product" width={180} tick={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="restocked" fill="#2563eb" name="Restocked" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="sold" fill="#16a34a" name="Sold" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  intent?: "default" | "warning" | "danger";
}

function StatCard({ label, value, intent = "default" }: StatCardProps) {
  const tone = intent === "danger" ? "text-red-600" : intent === "warning" ? "text-amber-600" : "text-slate-800";
  const accent = intent === "danger" ? "bg-red-50" : intent === "warning" ? "bg-amber-50" : "bg-slate-50";
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
      <div className={`mt-3 h-1.5 w-14 rounded-full ${accent}`} />
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="mt-6 text-sm text-slate-500">{message}</p>;
}
