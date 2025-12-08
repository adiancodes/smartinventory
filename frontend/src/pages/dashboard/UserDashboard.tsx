import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FieldErrors, UseFormRegister, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useAuth } from "../../hooks/useAuth";
import { fetchProducts } from "../../api/products";
import { fetchUserAddresses, updateUserAddresses } from "../../api/addresses";
import { fetchUserPurchaseHistory, purchaseProduct } from "../../api/purchases";
import { Product, StockStatus } from "../../types/product";
import { UserAddressesResponse } from "../../types/address";
import { PurchaseHistoryResponse } from "../../types/purchase";
import TopNavbar from "../../components/layout/TopNavbar";

const stockStatusOptions: Array<"ALL" | StockStatus> = ["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

const baseAddressSchema = z.object({
  line1: z.string().min(3, "Line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required")
});

const addressFormSchema = z.object({
  delivery: baseAddressSchema,
  billing: baseAddressSchema
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

type UserSection = "HOME" | "BROWSE" | "ADDRESS";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<UserSection>("HOME");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [reorderStatus, setReorderStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [addressFeedback, setAddressFeedback] = useState<string | null>(null);
  const [addressErrorMessage, setAddressErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ category: string; vendor: string; stockStatus: "ALL" | StockStatus }>(
    { category: "", vendor: "", stockStatus: "ALL" }
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
      }),
    []
  );

  const normalizedFilters = useMemo(() => {
    return {
      category: filters.category.trim() || undefined,
      vendor: filters.vendor.trim() || undefined,
      stockStatus: filters.stockStatus === "ALL" ? undefined : filters.stockStatus
    };
  }, [filters]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get("section");
    let nextSection: UserSection = "HOME";

    if (sectionParam === "browse") {
      nextSection = "BROWSE";
    } else if (sectionParam === "addresses") {
      nextSection = "ADDRESS";
    }

    if (activeSection !== nextSection) {
      setActiveSection(nextSection);
    }
  }, [location.search, activeSection]);

  const productsQuery = useQuery({
    queryKey: ["user", "catalog", normalizedFilters],
    queryFn: () => fetchProducts(normalizedFilters)
  });

  const products = productsQuery.data ?? [];

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return products.filter((product) =>
      [product.name, product.sku, product.category, product.vendor]
        .some((value) => value?.toLowerCase().includes(normalizedTerm))
    );
  }, [products, searchTerm]);

  const newArrivals = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [products]);

  const addressesQuery = useQuery<UserAddressesResponse>({
    queryKey: ["user", "addresses"],
    queryFn: fetchUserAddresses
  });

  const purchaseHistoryQuery = useQuery<PurchaseHistoryResponse>({
    queryKey: ["user", "purchase-history"],
    queryFn: fetchUserPurchaseHistory
  });

  const purchaseMutation = useMutation({
    mutationFn: purchaseProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "purchase-history"] });
      queryClient.invalidateQueries({ queryKey: ["user", "catalog"] });
    }
  });

  const addressMutation = useMutation({
    mutationFn: updateUserAddresses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "addresses"] });
      setAddressFeedback("Addresses saved successfully.");
      setAddressErrorMessage(null);
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ message?: string }>;
      setAddressFeedback(null);
      setAddressErrorMessage(axiosError.response?.data?.message ?? "Failed to save addresses");
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      delivery: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: ""
      },
      billing: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: ""
      }
    }
  });

  useEffect(() => {
    if (!addressesQuery.data) {
      return;
    }
    reset({
      delivery: {
        line1: addressesQuery.data.delivery?.line1 ?? "",
        line2: addressesQuery.data.delivery?.line2 ?? "",
        city: addressesQuery.data.delivery?.city ?? "",
        state: addressesQuery.data.delivery?.state ?? "",
        postalCode: addressesQuery.data.delivery?.postalCode ?? "",
        country: addressesQuery.data.delivery?.country ?? ""
      },
      billing: {
        line1: addressesQuery.data.billing?.line1 ?? "",
        line2: addressesQuery.data.billing?.line2 ?? "",
        city: addressesQuery.data.billing?.city ?? "",
        state: addressesQuery.data.billing?.state ?? "",
        postalCode: addressesQuery.data.billing?.postalCode ?? "",
        country: addressesQuery.data.billing?.country ?? ""
      }
    });
  }, [addressesQuery.data, reset]);

  useEffect(() => {
    if (selectedProduct) {
      setPurchaseQuantity(1);
      setPurchaseError(null);
    }
  }, [selectedProduct]);

  const closeProductModal = () => {
    setSelectedProduct(null);
    setPurchaseError(null);
    setPurchaseQuantity(1);
  };

  const onPurchase = async () => {
    if (!selectedProduct) {
      return;
    }
    if (purchaseQuantity < 1) {
      setPurchaseError("Quantity must be at least 1");
      return;
    }
    if (purchaseQuantity > selectedProduct.currentStock) {
      setPurchaseError("Not enough stock available");
      return;
    }
    setPurchaseError(null);
    try {
      await purchaseMutation.mutateAsync({ productId: selectedProduct.id, quantity: purchaseQuantity });
      setPurchaseSuccess("Your order has been placed successfully.");
      closeProductModal();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setPurchaseError(axiosError.response?.data?.message ?? "Unable to complete purchase right now");
    }
  };

  const onSubmitAddresses = async (values: AddressFormValues) => {
    setPurchaseSuccess(null);
    setAddressFeedback(null);
    setAddressErrorMessage(null);
    const payload = {
      delivery: {
        line1: values.delivery.line1.trim(),
        line2: values.delivery.line2?.trim() ?? "",
        city: values.delivery.city.trim(),
        state: values.delivery.state.trim(),
        postalCode: values.delivery.postalCode.trim(),
        country: values.delivery.country.trim()
      },
      billing: {
        line1: values.billing.line1.trim(),
        line2: values.billing.line2?.trim() ?? "",
        city: values.billing.city.trim(),
        state: values.billing.state.trim(),
        postalCode: values.billing.postalCode.trim(),
        country: values.billing.country.trim()
      }
    };
    await addressMutation.mutateAsync(payload);
  };

  const purchaseHistory = purchaseHistoryQuery.data?.purchases ?? [];
  const totalSpend = purchaseHistoryQuery.data?.totalSpend ?? 0;
  const totalItemsPurchased = useMemo(
    () => purchaseHistory.reduce((sum, purchase) => sum + purchase.quantity, 0),
    [purchaseHistory]
  );
  const lastPurchase = useMemo(() => {
    if (purchaseHistory.length === 0) {
      return null;
    }
    return [...purchaseHistory].sort(
      (first, second) => new Date(second.purchasedAt).getTime() - new Date(first.purchasedAt).getTime()
    )[0];
  }, [purchaseHistory]);
  const lastPurchaseTimestamp = useMemo(
    () => (lastPurchase ? new Date(lastPurchase.purchasedAt).toLocaleString() : null),
    [lastPurchase]
  );

  const addressSectionBusy = addressMutation.isPending || isSubmitting;

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const handleReorderLast = useCallback(async () => {
    if (!lastPurchase) {
      return;
    }
    setReorderStatus(null);
    try {
      await purchaseMutation.mutateAsync({ productId: lastPurchase.productId, quantity: lastPurchase.quantity });
      setReorderStatus({ type: "success", message: `Reordered ${lastPurchase.productName}.` });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setReorderStatus({
        type: "error",
        message: axiosError.response?.data?.message ?? "Unable to reorder right now"
      });
    }
  }, [lastPurchase, purchaseMutation]);

  const userNavLinks = useMemo(
    () => [
      { label: "Home", to: "/user/dashboard", isActive: activeSection === "HOME" },
      { label: "Browse Products", to: "/user/dashboard?section=browse", isActive: activeSection === "BROWSE" },
      { label: "Addresses", to: "/user/dashboard?section=addresses", isActive: activeSection === "ADDRESS" },
      { label: "My Purchases", to: "/user/purchases" },
      { label: "Logout", onClick: handleLogout, variant: "danger" as const }
    ],
    [activeSection, handleLogout]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <TopNavbar className="py-4" showAuthCTA={false} navLinks={userNavLinks} />
      <main className="flex w-full flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Welcome back</p>
              <h1 className="mt-2 text-2xl font-semibold text-midnight dark:text-white">{user?.fullName ?? "User"}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">{user?.email}</p>
            </div>
          </div>
        </section>

        {activeSection === "HOME" && (
          <div className="space-y-8">
            <header className="space-y-2">
              <h2 className="text-3xl font-semibold text-midnight dark:text-white">Account Overview</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Review your profile details and purchase history at a glance.
              </p>
            </header>

            {reorderStatus && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  reorderStatus.type === "success"
                    ? "border-emerald-300/60 bg-emerald-100/60 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200"
                    : "border-red-300/70 bg-red-100/70 text-red-600 dark:border-red-400/60 dark:bg-red-500/20 dark:text-red-200"
                }`}
              >
                {reorderStatus.message}
              </div>
            )}

            <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Total Money Spent</p>
                  <p className="mt-4 text-3xl font-semibold text-midnight dark:text-white">
                    {purchaseHistoryQuery.isLoading ? "..." : currencyFormatter.format(totalSpend ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Total Items Bought</p>
                  <p className="mt-4 text-3xl font-semibold text-midnight dark:text-white">
                    {purchaseHistoryQuery.isLoading ? "..." : totalItemsPurchased.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Last Item Bought</p>
                  {purchaseHistoryQuery.isLoading ? (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading recent purchase...</p>
                  ) : lastPurchase ? (
                    <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <div>
                        <p className="text-base font-semibold text-midnight dark:text-white">{lastPurchase.productName}</p>
                        <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Qty {lastPurchase.quantity}</p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{lastPurchaseTimestamp}</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No purchases recorded yet.</p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Reorder Last Item</p>
                  {purchaseHistoryQuery.isLoading ? (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading recent purchase...</p>
                  ) : lastPurchase ? (
                    <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                      <div>
                        <p className="text-base font-semibold text-midnight dark:text-white">{lastPurchase.productName}</p>
                        <p className="mt-1 text-xs uppercase text-slate-400 dark:text-slate-500">
                          Qty {lastPurchase.quantity} · {currencyFormatter.format(lastPurchase.totalPrice)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="w-full rounded-full bg-midnight px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
                        onClick={handleReorderLast}
                        disabled={purchaseMutation.isPending}
                      >
                        {purchaseMutation.isPending ? "Processing..." : "Order Again"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Place an order to enable quick reorders.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Profile</p>
                  <dl className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    <div>
                      <dt className="text-xs uppercase text-slate-400 dark:text-slate-500">Full Name</dt>
                      <dd className="text-base font-semibold text-midnight dark:text-white">{user?.fullName ?? "--"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-slate-400 dark:text-slate-500">Email</dt>
                      <dd>{user?.email ?? "--"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-slate-400 dark:text-slate-500">Contact</dt>
                      <dd>{user?.contactNumber ?? "Not provided"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-slate-400 dark:text-slate-500">Company</dt>
                      <dd>{user?.companyName ?? "Not provided"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Shipping Address</p>
                  {addressesQuery.isLoading ? (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading address...</p>
                  ) : (
                    <div className="mt-4 space-y-6 text-sm text-slate-600 dark:text-slate-300">
                      <div>
                        <p className="font-semibold text-midnight dark:text-white">Delivery</p>
                        {addressesQuery.data?.delivery ? (
                          <address className="mt-1 space-y-1 not-italic">
                            <p>{addressesQuery.data.delivery.line1}</p>
                            {addressesQuery.data.delivery.line2 && <p>{addressesQuery.data.delivery.line2}</p>}
                            <p>{`${addressesQuery.data.delivery.city}, ${addressesQuery.data.delivery.state}`}</p>
                            <p>{`${addressesQuery.data.delivery.postalCode}, ${addressesQuery.data.delivery.country}`}</p>
                          </address>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">No delivery address saved yet.</p>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-midnight dark:text-white">Billing</p>
                        {addressesQuery.data?.billing ? (
                          <address className="mt-1 space-y-1 not-italic">
                            <p>{addressesQuery.data.billing.line1}</p>
                            {addressesQuery.data.billing.line2 && <p>{addressesQuery.data.billing.line2}</p>}
                            <p>{`${addressesQuery.data.billing.city}, ${addressesQuery.data.billing.state}`}</p>
                            <p>{`${addressesQuery.data.billing.postalCode}, ${addressesQuery.data.billing.country}`}</p>
                          </address>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">No billing address saved yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeSection === "BROWSE" && (
          <div className="space-y-8">
            <header className="space-y-2">
              <h2 className="text-3xl font-semibold text-midnight dark:text-white">Browse Products</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Search across every warehouse, filter items, and place quick orders.
              </p>
            </header>

            {purchaseSuccess && (
              <div className="rounded-2xl border border-emerald-300/60 bg-emerald-100/60 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200">
                {purchaseSuccess}
              </div>
            )}

            <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full flex-col gap-1 lg:max-w-md">
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor="catalog-search">
                    Search
                  </label>
                  <input
                    id="catalog-search"
                    className="input"
                    placeholder="Search by product, SKU, category, vendor"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 lg:max-w-xl">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor="category-filter">
                      Category
                    </label>
                    <input
                      id="category-filter"
                      className="input"
                      placeholder="All"
                      value={filters.category}
                      onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor="vendor-filter">
                      Vendor
                    </label>
                    <input
                      id="vendor-filter"
                      className="input"
                      placeholder="All"
                      value={filters.vendor}
                      onChange={(event) => setFilters((prev) => ({ ...prev, vendor: event.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor="stock-filter">
                      Stock
                    </label>
                    <select
                      id="stock-filter"
                      className="input"
                      value={filters.stockStatus}
                      onChange={(event) => setFilters((prev) => ({ ...prev, stockStatus: event.target.value as "ALL" | StockStatus }))}
                    >
                      {stockStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "ALL" ? "All" : option.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="rounded-full border border-white/50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-midnight dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60"
                  onClick={() => setFilters({ category: "", vendor: "", stockStatus: "ALL" })}
                >
                  Reset filters
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
              {productsQuery.isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading catalog...</p>}
              {productsQuery.isError && (
                <p className="text-sm text-red-500">Unable to load products right now. Please try again later.</p>
              )}
              {!productsQuery.isLoading && filteredProducts.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No products match your search filters.</p>
              )}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="rounded-2xl border border-white/40 bg-white/75 p-5 text-left shadow-lg shadow-sky-200/20 transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:bg-slate-900/80"
                    onClick={() => {
                      setSelectedProduct(product);
                      setPurchaseSuccess(null);
                    }}
                  >
                    <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">{product.category}</p>
                    <h3 className="mt-2 text-lg font-semibold text-midnight dark:text-white">{product.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300">SKU: {product.sku}</p>
                    <p className="mt-3 text-base font-semibold text-midnight dark:text-amber-300">
                      {currencyFormatter.format(product.price ?? 0)}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                      <span>Stock: {product.currentStock}</span>
                      <span>
                        {product.warehouseName}
                        <span className="ml-1 text-slate-400 dark:text-slate-500">{product.warehouseCode}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-midnight dark:text-white">New Arrivals</h3>
                <span className="text-xs uppercase text-slate-400 dark:text-slate-500">Latest additions</span>
              </div>
              {newArrivals.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No recent products yet.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {newArrivals.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-white/40 bg-white/75 p-4 shadow-lg shadow-sky-200/20 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30"
                    >
                      <p className="text-xs uppercase text-slate-400 dark:text-slate-500">{product.category}</p>
                      <p className="mt-1 text-base font-semibold text-midnight dark:text-white">{product.name}</p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">From {product.vendor}</p>
                      <p className="mt-3 text-sm font-semibold text-midnight dark:text-amber-300">
                        {currencyFormatter.format(product.price ?? 0)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeSection === "ADDRESS" && (
          <div className="space-y-8">
            <header className="space-y-2">
              <h2 className="text-3xl font-semibold text-midnight dark:text-white">Manage Addresses</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Update your delivery and billing information used during checkout.
              </p>
            </header>

            <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
              {addressFeedback && (
                <div className="mb-4 rounded-2xl border border-emerald-300/60 bg-emerald-100/60 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200">
                  {addressFeedback}
                </div>
              )}
              {addressErrorMessage && (
                <div className="mb-4 rounded-2xl border border-red-300/70 bg-red-100/70 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-400/60 dark:bg-red-500/20 dark:text-red-200">
                  {addressErrorMessage}
                </div>
              )}
              <form className="grid grid-cols-1 gap-6 lg:grid-cols-2" onSubmit={handleSubmit(onSubmitAddresses)}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-midnight dark:text-white">Delivery Address</h3>
                  <AddressFields
                    prefix="delivery"
                    register={register}
                    errors={errors.delivery as FieldErrors<AddressFormValues["delivery"]> | undefined}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-midnight dark:text-white">Billing Address</h3>
                  <AddressFields
                    prefix="billing"
                    register={register}
                    errors={errors.billing as FieldErrors<AddressFormValues["billing"]> | undefined}
                  />
                </div>
                <div className="col-span-full flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-white/60 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-midnight dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60"
                    onClick={() => addressesQuery.refetch()}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={addressSectionBusy}
                    className="rounded-full bg-midnight px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
                  >
                    {addressSectionBusy ? "Saving..." : "Save Addresses"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/30 bg-white/95 p-8 shadow-2xl transition dark:border-slate-700/60 dark:bg-slate-900/90">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-midnight dark:text-white">{selectedProduct.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300">{selectedProduct.category} · SKU {selectedProduct.sku}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-transparent px-3 py-1 text-sm text-slate-500 transition hover:border-slate-200 hover:text-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                onClick={closeProductModal}
              >
                Close
              </button>
            </div>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <p>Vendor: {selectedProduct.vendor}</p>
              <p>
                Warehouse: {selectedProduct.warehouseName}
                <span className="ml-2 text-xs uppercase text-slate-400 dark:text-slate-500">{selectedProduct.warehouseCode}</span>
              </p>
              <p className="text-lg font-semibold text-midnight dark:text-amber-300">
                {currencyFormatter.format(selectedProduct.price ?? 0)}
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="purchase-quantity">
                  Quantity
                </label>
                <input
                  id="purchase-quantity"
                  type="number"
                  min={1}
                  max={selectedProduct.currentStock}
                  value={purchaseQuantity}
                  onChange={(event) => setPurchaseQuantity(Number(event.target.value))}
                  className="w-24 rounded-md border border-slate-300/80 bg-white/80 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/60"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">In stock: {selectedProduct.currentStock}</span>
              </div>
              {purchaseError && <p className="text-sm text-red-500">{purchaseError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full border border-white/60 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-midnight dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60"
                  onClick={closeProductModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-full bg-midnight px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
                  disabled={purchaseMutation.isPending}
                  onClick={onPurchase}
                >
                  {purchaseMutation.isPending ? "Processing..." : "Buy Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type AddressFieldProps = {
  prefix: "delivery" | "billing";
  register: UseFormRegister<AddressFormValues>;
  errors?: FieldErrors<AddressFormValues["delivery"]>;
};

function AddressFields({ prefix, register, errors }: AddressFieldProps) {
  const makeField = (field: keyof AddressFormValues["delivery"]) => `${prefix}.${field}` as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor={`${prefix}.line1`}>
          Address Line 1
        </label>
        <input id={`${prefix}.line1`} className="input" {...register(makeField("line1"))} />
        {errors?.line1 && <span className="text-xs text-red-500">{errors.line1.message}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor={`${prefix}.line2`}>
          Address Line 2
        </label>
        <input id={`${prefix}.line2`} className="input" {...register(makeField("line2"))} />
        {errors?.line2 && <span className="text-xs text-red-500">{errors.line2.message}</span>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor={`${prefix}.city`}>
            City
          </label>
          <input id={`${prefix}.city`} className="input" {...register(makeField("city"))} />
          {errors?.city && <span className="text-xs text-red-500">{errors.city.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor={`${prefix}.state`}>
            State
          </label>
          <input id={`${prefix}.state`} className="input" {...register(makeField("state"))} />
          {errors?.state && <span className="text-xs text-red-500">{errors.state.message}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor={`${prefix}.postalCode`}>
            Postal Code
          </label>
          <input id={`${prefix}.postalCode`} className="input" {...register(makeField("postalCode"))} />
          {errors?.postalCode && <span className="text-xs text-red-500">{errors.postalCode.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300" htmlFor={`${prefix}.country`}>
            Country
          </label>
          <input id={`${prefix}.country`} className="input" {...register(makeField("country"))} />
          {errors?.country && <span className="text-xs text-red-500">{errors.country.message}</span>}
        </div>
      </div>
    </div>
  );
}
