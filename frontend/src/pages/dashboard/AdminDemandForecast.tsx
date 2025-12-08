import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminTopNav } from "../../components/layout/AdminTopNav";
import { fetchDemandForecast } from "../../api/forecast";
import { DemandForecastItem, DemandForecastSeriesPoint } from "../../types/forecast";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatWeekLabel(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric"
  }).format(date);
}

interface ForecastLineChartProps {
  item: DemandForecastItem;
}

function ForecastLineChart({ item }: ForecastLineChartProps) {
  const history = item.history ?? [];
  const lastHistoryDate = history.length > 0 ? new Date(history[history.length - 1].weekStart) : new Date();
  const forecastDate = addDays(lastHistoryDate, 7).toISOString();

  const points: DemandForecastSeriesPoint[] = [
    ...history,
    { weekStart: forecastDate, quantity: item.forecastQuantity }
  ];

  const maxValue = points.reduce((acc, point) => Math.max(acc, point.quantity), 0);
  const chartHeight = 220;
  const chartWidth = 620;
  const padding = 28;
  const span = Math.max(points.length - 1, 1);

  const polylinePoints = points
    .map((point, index) => {
      const x = (index / span) * (chartWidth - padding * 2) + padding;
      const safeMax = maxValue === 0 ? 1 : maxValue;
      const normalized = point.quantity / safeMax;
      const y = chartHeight - padding - normalized * (chartHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Demand trend</h2>
          <p className="text-sm text-slate-500">Historical weekly sales with next week forecast.</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>
            Forecast: <span className="font-semibold text-midnight">{item.forecastQuantity.toFixed(1)} units</span>
          </p>
          {item.recommendedReorder > 0 && (
            <p className="text-xs text-red-500">Reorder suggestion: {item.recommendedReorder} units</p>
          )}
        </div>
      </div>

      {points.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No demand history recorded for this product yet.</p>
      ) : (
        <div className="mt-8">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            role="img"
            className="h-64 w-full text-midnight"
          >
            <defs>
              <linearGradient id="forecastGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1d3557" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1d3557" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect
              x={padding}
              y={padding}
              width={chartWidth - padding * 2}
              height={chartHeight - padding * 2}
              className="fill-sky-50"
            />
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="url(#forecastGradient)"
              strokeWidth={6}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.5}
            />
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#1d3557"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((point, index) => {
              const x = (index / span) * (chartWidth - padding * 2) + padding;
              const safeMax = maxValue === 0 ? 1 : maxValue;
              const normalized = point.quantity / safeMax;
              const y = chartHeight - padding - normalized * (chartHeight - padding * 2);
              const isForecast = index === points.length - 1;
              return (
                <g key={`${point.weekStart}-${index}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isForecast ? 6 : 4}
                    className={isForecast ? "fill-red-500" : "fill-midnight"}
                  />
                </g>
              );
            })}
          </svg>
          <div className="mt-3 flex justify-between px-6 text-xs font-medium uppercase tracking-wide text-slate-400">
            {points.map((point) => (
              <span key={point.weekStart} className="min-w-[3rem] text-center">
                {formatWeekLabel(point.weekStart)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDemandForecast() {
  const forecastQuery = useQuery({
    queryKey: ["admin", "demand", "forecast"],
    queryFn: fetchDemandForecast,
    staleTime: 5 * 60 * 1000
  });

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    if (forecastQuery.data && forecastQuery.data.length > 0 && selectedProductId === null) {
      setSelectedProductId(forecastQuery.data[0].productId);
    }
  }, [forecastQuery.data, selectedProductId]);

  const selectedItem = useMemo(() => {
    if (!forecastQuery.data) {
      return null;
    }
    return forecastQuery.data.find((item) => item.productId === selectedProductId) ?? null;
  }, [forecastQuery.data, selectedProductId]);

  const topPerformer = forecastQuery.data?.[0];

  return (
    <div className="min-h-screen bg-ash">
      <AdminTopNav />
      <main className="w-full px-10 py-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Demand Forecasting</h1>
            <p className="text-sm text-slate-500">
              AI-backed weekly demand prediction with proactive stockout alerts.
            </p>
          </div>
        </header>

        {forecastQuery.isLoading ? (
          <p className="mt-10 text-sm text-slate-500">Crunching numbers...</p>
        ) : forecastQuery.isError ? (
          <p className="mt-10 text-sm text-red-500">Could not load demand forecast. Please try again.</p>
        ) : forecastQuery.data?.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">No products available for forecasting yet.</p>
        ) : (
          <>
            {topPerformer && (
              <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-md">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Top Demand Product
                    </p>
                    <h2 className="text-xl font-semibold text-slate-800">{topPerformer.productName}</h2>
                    <p className="text-sm text-slate-500">SKU {topPerformer.productSku}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="rounded-lg bg-sky-50 px-4 py-2">
                      <p className="text-xs uppercase text-slate-500">Forecast (Next Period)</p>
                      <p className="text-lg font-semibold text-midnight">{topPerformer.forecastQuantity.toFixed(1)} units</p>
                    </div>
                    <div className="rounded-lg bg-sky-50 px-4 py-2">
                      <p className="text-xs uppercase text-slate-500">Current Stock</p>
                      <p className="text-lg font-semibold text-midnight">{topPerformer.currentStock}</p>
                    </div>
                    <div className="rounded-lg bg-sky-50 px-4 py-2">
                      <p className="text-xs uppercase text-slate-500">Action</p>
                      <p className="text-lg font-semibold text-midnight">{topPerformer.action}</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 text-xs text-slate-500">
                  This product has the highest units sold to date and leads the current demand leaderboard.
                </div>
              </section>
            )}

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3">
              {selectedItem ? (
                <ForecastLineChart item={selectedItem} />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                  <p className="text-sm text-slate-500">Select a product to view its forecast.</p>
                </div>
              )}
            </div>
            <div className="xl:col-span-2">
              {selectedItem && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                  <h2 className="text-lg font-semibold text-slate-800">Inventory insight</h2>
                  <p className="mt-1 text-sm text-slate-500">SKU {selectedItem.productSku}</p>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl bg-sky-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Current Stock</p>
                      <p className="mt-2 text-2xl font-semibold text-midnight">{selectedItem.currentStock}</p>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Forecast (7d)</p>
                      <p className="mt-2 text-2xl font-semibold text-midnight">
                        {selectedItem.forecastQuantity.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Reorder Level</p>
                      <p className="mt-2 text-2xl font-semibold text-midnight">{selectedItem.reorderLevel}</p>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                      <p className={`mt-2 text-2xl font-semibold ${selectedItem.atRisk ? "text-red-500" : "text-green-600"}`}>
                        {selectedItem.atRisk ? "At Risk" : "Healthy"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">Recommended Action</p>
                    <p className="mt-2 text-sm text-slate-600">{selectedItem.action}</p>
                    {selectedItem.recommendedReorder > 0 && (
                      <p className="mt-1 text-xs text-red-500">
                        Reorder at least {selectedItem.recommendedReorder} units to stay ahead of demand.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            </div>
          </>
        )}

        {!forecastQuery.isLoading && forecastQuery.data && forecastQuery.data.length > 0 && (
          <section className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-md">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Forecast summary</h2>
                <p className="text-sm text-slate-500">Tap a row to inspect the trend.</p>
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Forecast (7d)</th>
                    <th className="px-6 py-3">Current Stock</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastQuery.data.map((item, index) => {
                    const isSelected = item.productId === selectedProductId;
                    return (
                      <tr
                        key={item.productId}
                        onClick={() => setSelectedProductId(item.productId)}
                        className={`cursor-pointer border-b last:border-none transition ${
                          isSelected ? "bg-sky-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{item.productSku}</p>
                          <p className="text-xs text-slate-500">{item.productName}</p>
                          {index === 0 && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-midnight px-2 py-0.5 text-[11px] font-semibold text-white">
                              Top demand
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{item.forecastQuantity.toFixed(1)} units</p>
                          {item.atRisk && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                              At risk
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{item.currentStock}</p>
                          <p className="text-xs text-slate-500">Reorder level: {item.reorderLevel}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{item.action}</p>
                          {item.recommendedReorder > 0 && (
                            <p className="text-xs text-red-500">
                              Reorder +{item.recommendedReorder} units
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
