import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import TopNavbar from "../../components/layout/TopNavbar";
import { fetchUserPurchaseHistory } from "../../api/purchases";
import { PurchaseHistoryResponse } from "../../types/purchase";
import { useAuth } from "../../hooks/useAuth";

export default function UserPurchases() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const purchaseHistoryQuery = useQuery<PurchaseHistoryResponse>({
    queryKey: ["user", "purchase-history"],
    queryFn: fetchUserPurchaseHistory
  });

  const purchaseHistory = purchaseHistoryQuery.data?.purchases ?? [];
  const orderedPurchases = useMemo(
    () =>
      [...purchaseHistory].sort(
        (first, second) => new Date(second.purchasedAt).getTime() - new Date(first.purchasedAt).getTime()
      ),
    [purchaseHistory]
  );
  const totalSpend = purchaseHistoryQuery.data?.totalSpend ?? 0;
  const totalItems = useMemo(
    () => orderedPurchases.reduce((sum, purchase) => sum + purchase.quantity, 0),
    [orderedPurchases]
  );
  const latestPurchase = useMemo(() => (orderedPurchases.length > 0 ? orderedPurchases[0] : null), [orderedPurchases]);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
      }),
    []
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const userNavLinks = useMemo(
    () => [
      { label: "Home", to: "/user/dashboard" },
      { label: "Browse Products", to: "/user/dashboard?section=browse" },
      { label: "Addresses", to: "/user/dashboard?section=addresses" },
      { label: "My Purchases", to: "/user/purchases", isActive: location.pathname === "/user/purchases" },
      { label: "Logout", onClick: handleLogout, variant: "danger" as const }
    ],
    [handleLogout, location.pathname]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <TopNavbar className="py-4" navLinks={userNavLinks} showAuthCTA={false} />
      <main className="flex w-full flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">
            Welcome back{user?.fullName ? ", " : ""}
            {user?.fullName ?? "User"}
          </p>
          <h1 className="text-3xl font-semibold text-midnight dark:text-white">My Purchases</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Review all of your orders, totals, and the warehouses that fulfilled them.
          </p>
        </header>

        <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/40 bg-white/75 p-5 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Total Spend</p>
              <p className="mt-4 text-2xl font-semibold text-midnight dark:text-white">
                {purchaseHistoryQuery.isLoading ? "..." : currencyFormatter.format(totalSpend)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/40 bg-white/75 p-5 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Total Items</p>
              <p className="mt-4 text-2xl font-semibold text-midnight dark:text-white">
                {purchaseHistoryQuery.isLoading ? "..." : totalItems.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/40 bg-white/75 p-5 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Orders Placed</p>
              <p className="mt-4 text-2xl font-semibold text-midnight dark:text-white">
                {purchaseHistoryQuery.isLoading ? "..." : orderedPurchases.length.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/40 bg-white/75 p-5 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Last Updated</p>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                {purchaseHistoryQuery.isLoading
                  ? "Loading..."
                  : latestPurchase
                    ? new Date(latestPurchase.purchasedAt).toLocaleString()
                    : "No purchases yet"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
          {purchaseHistoryQuery.isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading purchases...</p>}
          {purchaseHistoryQuery.isError && !purchaseHistoryQuery.isLoading && (
            <p className="text-sm text-red-500">Unable to load purchase history right now. Please try again later.</p>
          )}
          {!purchaseHistoryQuery.isLoading && orderedPurchases.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You have not placed any orders yet. Browse products to get started.
            </p>
          )}
          {orderedPurchases.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/30 bg-white/90 shadow-inner dark:border-slate-700/50 dark:bg-slate-900/70">
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="border-b border-white/40 bg-white/70 text-xs uppercase tracking-widest text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">SKU</th>
                    <th className="px-4 py-2">Quantity</th>
                    <th className="px-4 py-2">Total Paid</th>
                    <th className="px-4 py-2">Warehouse</th>
                    <th className="px-4 py-2">Purchased At</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-white/20 last:border-none dark:border-slate-800/40">
                      <td className="px-4 py-3 font-medium text-midnight dark:text-slate-100">{purchase.productName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{purchase.productSku}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{purchase.quantity}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{currencyFormatter.format(purchase.totalPrice)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{purchase.warehouseName}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(purchase.purchasedAt).toLocaleString()}</td>
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
