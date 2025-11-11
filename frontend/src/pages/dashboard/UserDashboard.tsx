import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

type UserSection = "HOME" | "DASHBOARD" | "ADDRESS";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<UserSection>("HOME");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
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

  const addressSectionBusy = addressMutation.isPending || isSubmitting;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-ash lg:h-screen">
      <aside className="flex w-72 flex-col bg-white shadow-xl lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:overflow-y-auto">
        <div className="border-b px-6 py-6">
          <p className="text-xs font-semibold uppercase text-slate-400">Welcome</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">{user?.fullName ?? "User"}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
        <nav className="flex-1 px-4 py-6">
          {[{ key: "HOME", label: "Home" }, { key: "DASHBOARD", label: "Dashboard" }, { key: "ADDRESS", label: "Addresses" }].map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`mb-2 w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive ? "bg-midnight text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setActiveSection(item.key as UserSection)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t px-4 py-6">
          <button
            type="button"
            className="w-full rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

  <main className="flex-1 px-8 py-10 lg:h-screen lg:overflow-y-auto">
        {activeSection === "HOME" && (
          <div className="space-y-8">
            <header>
              <h1 className="text-2xl font-semibold text-slate-800">Account Overview</h1>
              <p className="mt-2 text-sm text-slate-500">Review your profile details and purchase history at a glance.</p>
            </header>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">Profile</p>
                <dl className="mt-4 space-y-3 text-sm text-slate-600">
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Full Name</dt>
                    <dd className="text-base font-semibold text-slate-800">{user?.fullName ?? "--"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Email</dt>
                    <dd>{user?.email ?? "--"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Contact</dt>
                    <dd>{user?.contactNumber ?? "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Company</dt>
                    <dd>{user?.companyName ?? "Not provided"}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">Shipping Address</p>
                {addressesQuery.isLoading ? (
                  <p className="mt-4 text-sm text-slate-500">Loading address...</p>
                ) : (
                  <div className="mt-4 text-sm text-slate-600">
                    {addressesQuery.data?.delivery ? (
                      <address className="not-italic">
                        <p className="font-semibold text-slate-800">Delivery</p>
                        <p>{addressesQuery.data.delivery.line1}</p>
                        {addressesQuery.data.delivery.line2 && <p>{addressesQuery.data.delivery.line2}</p>}
                        <p>{`${addressesQuery.data.delivery.city}, ${addressesQuery.data.delivery.state}`}</p>
                        <p>{`${addressesQuery.data.delivery.postalCode}, ${addressesQuery.data.delivery.country}`}</p>
                      </address>
                    ) : (
                      <p className="text-sm text-slate-500">No delivery address saved yet.</p>
                    )}
                    <div className="mt-6">
                      <p className="font-semibold text-slate-800">Billing</p>
                      {addressesQuery.data?.billing ? (
                        <address className="mt-2 not-italic">
                          <p>{addressesQuery.data.billing.line1}</p>
                          {addressesQuery.data.billing.line2 && <p>{addressesQuery.data.billing.line2}</p>}
                          <p>{`${addressesQuery.data.billing.city}, ${addressesQuery.data.billing.state}`}</p>
                          <p>{`${addressesQuery.data.billing.postalCode}, ${addressesQuery.data.billing.country}`}</p>
                        </address>
                      ) : (
                        <p className="text-sm text-slate-500">No billing address saved yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Purchase History</h2>
                  <p className="text-sm text-slate-500">Track every item you've ordered.</p>
                </div>
                <div className="rounded-lg bg-midnight px-4 py-2 text-sm font-semibold text-white">
                  Total Spend: {currencyFormatter.format(totalSpend ?? 0)}
                </div>
              </div>

              {purchaseHistoryQuery.isLoading && <p className="mt-6 text-sm text-slate-500">Loading history...</p>}
              {!purchaseHistoryQuery.isLoading && purchaseHistory.length === 0 && (
                <p className="mt-6 text-sm text-slate-500">No purchases yet. Explore the catalog to place your first order.</p>
              )}
              {purchaseHistory.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full table-auto text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                        <th className="px-4 py-2">Product</th>
                        <th className="px-4 py-2">SKU</th>
                        <th className="px-4 py-2">Quantity</th>
                        <th className="px-4 py-2">Total Paid</th>
                        <th className="px-4 py-2">Purchased At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory.map((purchase) => (
                        <tr key={purchase.id} className="border-b last:border-none">
                          <td className="px-4 py-3 font-medium text-slate-800">{purchase.productName}</td>
                          <td className="px-4 py-3 text-slate-600">{purchase.productSku}</td>
                          <td className="px-4 py-3 text-slate-600">{purchase.quantity}</td>
                          <td className="px-4 py-3 text-slate-600">{currencyFormatter.format(purchase.totalPrice)}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(purchase.purchasedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {activeSection === "DASHBOARD" && (
          <div className="space-y-8">
            <header>
              <h1 className="text-2xl font-semibold text-slate-800">Browse Products</h1>
              <p className="mt-2 text-sm text-slate-500">Search across every warehouse, filter items, and place quick orders.</p>
            </header>

            {purchaseSuccess && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {purchaseSuccess}
              </div>
            )}

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full flex-col gap-1 lg:max-w-md">
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="catalog-search">
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
                    <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="category-filter">
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
                    <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="vendor-filter">
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
                    <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="stock-filter">
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
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                  onClick={() => setFilters({ category: "", vendor: "", stockStatus: "ALL" })}
                >
                  Reset filters
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              {productsQuery.isLoading && <p className="text-sm text-slate-500">Loading catalog...</p>}
              {productsQuery.isError && (
                <p className="text-sm text-red-500">Unable to load products right now. Please try again later.</p>
              )}
              {!productsQuery.isLoading && filteredProducts.length === 0 && (
                <p className="text-sm text-slate-500">No products match your search filters.</p>
              )}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    onClick={() => {
                      setSelectedProduct(product);
                      setPurchaseSuccess(null);
                    }}
                  >
                    <p className="text-xs font-semibold uppercase text-slate-400">{product.category}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-800">{product.name}</h3>
                    <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                    <p className="mt-3 text-base font-semibold text-midnight">
                      {currencyFormatter.format(product.price ?? 0)}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>Stock: {product.currentStock}</span>
                      <span>
                        {product.warehouseName}
                        <span className="ml-1 text-slate-400">{product.warehouseCode}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">New Arrivals</h2>
                <span className="text-xs uppercase text-slate-400">Latest additions</span>
              </div>
              {newArrivals.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No recent products yet.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {newArrivals.map((product) => (
                    <div key={product.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs uppercase text-slate-400">{product.category}</p>
                      <p className="mt-1 text-base font-semibold text-slate-800">{product.name}</p>
                      <p className="mt-2 text-sm text-slate-500">From {product.vendor}</p>
                      <p className="mt-3 text-sm font-semibold text-midnight">
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
            <header>
              <h1 className="text-2xl font-semibold text-slate-800">Manage Addresses</h1>
              <p className="mt-2 text-sm text-slate-500">Update your delivery and billing information used during checkout.</p>
            </header>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              {addressFeedback && (
                <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {addressFeedback}
                </div>
              )}
              {addressErrorMessage && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {addressErrorMessage}
                </div>
              )}
              <form className="grid grid-cols-1 gap-6 lg:grid-cols-2" onSubmit={handleSubmit(onSubmitAddresses)}>
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800">Delivery Address</h2>
                  <AddressFields
                    prefix="delivery"
                    register={register}
                    errors={errors.delivery as FieldErrors<AddressFormValues["delivery"]> | undefined}
                  />
                </div>
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800">Billing Address</h2>
                  <AddressFields
                    prefix="billing"
                    register={register}
                    errors={errors.billing as FieldErrors<AddressFormValues["billing"]> | undefined}
                  />
                </div>
                <div className="col-span-full flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                    onClick={() => addressesQuery.refetch()}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={addressSectionBusy}
                    className="rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{selectedProduct.name}</h3>
                <p className="text-sm text-slate-500">{selectedProduct.category} · SKU {selectedProduct.sku}</p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                onClick={closeProductModal}
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Vendor: {selectedProduct.vendor}</p>
              <p className="text-sm text-slate-600">
                Warehouse: {selectedProduct.warehouseName}
                <span className="ml-2 text-xs uppercase text-slate-400">{selectedProduct.warehouseCode}</span>
              </p>
              <p className="text-lg font-semibold text-midnight">
                {currencyFormatter.format(selectedProduct.price ?? 0)}
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700" htmlFor="purchase-quantity">
                  Quantity
                </label>
                <input
                  id="purchase-quantity"
                  type="number"
                  min={1}
                  max={selectedProduct.currentStock}
                  value={purchaseQuantity}
                  onChange={(event) => setPurchaseQuantity(Number(event.target.value))}
                  className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <span className="text-xs text-slate-500">In stock: {selectedProduct.currentStock}</span>
              </div>
              {purchaseError && <p className="text-sm text-red-500">{purchaseError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                  onClick={closeProductModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
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
        <label className="text-xs font-semibold uppercase text-slate-500" htmlFor={`${prefix}.line1`}>
          Address Line 1
        </label>
        <input id={`${prefix}.line1`} className="input" {...register(makeField("line1"))} />
        {errors?.line1 && <span className="text-xs text-red-500">{errors.line1.message}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase text-slate-500" htmlFor={`${prefix}.line2`}>
          Address Line 2
        </label>
        <input id={`${prefix}.line2`} className="input" {...register(makeField("line2"))} />
        {errors?.line2 && <span className="text-xs text-red-500">{errors.line2.message}</span>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-slate-500" htmlFor={`${prefix}.city`}>
            City
          </label>
          <input id={`${prefix}.city`} className="input" {...register(makeField("city"))} />
          {errors?.city && <span className="text-xs text-red-500">{errors.city.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-slate-500" htmlFor={`${prefix}.state`}>
            State
          </label>
          <input id={`${prefix}.state`} className="input" {...register(makeField("state"))} />
          {errors?.state && <span className="text-xs text-red-500">{errors.state.message}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-slate-500" htmlFor={`${prefix}.postalCode`}>
            Postal Code
          </label>
          <input id={`${prefix}.postalCode`} className="input" {...register(makeField("postalCode"))} />
          {errors?.postalCode && <span className="text-xs text-red-500">{errors.postalCode.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-slate-500" htmlFor={`${prefix}.country`}>
            Country
          </label>
          <input id={`${prefix}.country`} className="input" {...register(makeField("country"))} />
          {errors?.country && <span className="text-xs text-red-500">{errors.country.message}</span>}
        </div>
      </div>
    </div>
  );
}
