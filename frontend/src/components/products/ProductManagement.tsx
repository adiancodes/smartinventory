import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct, deleteProduct, fetchProducts, updateProduct } from "../../api/products";
import { fetchWarehouses } from "../../api/warehouses";
import { Product, ProductPayload, StockStatus, WarehouseSummary } from "../../types/product";

const stockStatusOptions: Array<"ALL" | StockStatus> = ["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

const productSchema = z.object({
  name: z.string().min(2, "Enter a product name"),
  sku: z.string().min(2, "Enter a SKU"),
  category: z.string().min(2, "Enter a category"),
  vendor: z.string().min(2, "Enter a vendor"),
  reorderLevel: z.coerce.number().min(0, "Reorder level cannot be negative"),
  maxStockLevel: z.coerce.number().min(0, "Max stock level cannot be negative"),
  currentStock: z.coerce.number().min(0, "Current stock cannot be negative"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  autoRestockEnabled: z.boolean(),
  warehouseId: z.number().int().positive().optional()
}).refine(
  (values) => values.maxStockLevel >= values.reorderLevel,
  {
    message: "Max stock level must be greater than or equal to min stock level",
    path: ["maxStockLevel"]
  }
);

type ProductFormValues = z.infer<typeof productSchema>;

type ProductManagementMode = "ADMIN" | "MANAGER";

interface ProductManagementProps {
  mode: ProductManagementMode;
}

type ProductFiltersState = {
  category: string;
  vendor: string;
  stockStatus: "ALL" | StockStatus;
  warehouseId: string;
};

export default function ProductManagement({ mode }: ProductManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProductFiltersState>({
    category: "",
    vendor: "",
    stockStatus: "ALL",
    warehouseId: "ALL"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const managerWarehouseId = user?.warehouseId ?? null;

  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
    enabled: mode === "ADMIN"
  });

  const normalizedFilters = useMemo(() => {
    const category = filters.category.trim() || undefined;
    const vendor = filters.vendor.trim() || undefined;
    const stockStatus = filters.stockStatus === "ALL" ? undefined : filters.stockStatus;
    const warehouseId = mode === "ADMIN" && filters.warehouseId !== "ALL"
      ? Number(filters.warehouseId)
      : mode === "MANAGER"
        ? managerWarehouseId ?? undefined
        : undefined;

    return { category, vendor, stockStatus, warehouseId };
  }, [filters, mode, managerWarehouseId]);

  const productsQuery = useQuery({
    queryKey: ["products", mode, normalizedFilters, managerWarehouseId],
    queryFn: () => fetchProducts(normalizedFilters),
    enabled: mode === "ADMIN" || Boolean(managerWarehouseId)
  });

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
      }),
    []
  );

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message ?? "Failed to create product");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductPayload }) => updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message ?? "Failed to update product");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      vendor: "",
      reorderLevel: 0,
      currentStock: 0,
      price: 0,
      maxStockLevel: 100,
      autoRestockEnabled: false,
      warehouseId: undefined
    }
  });

  const openCreateModal = () => {
    setFormError(null);
    setEditingProduct(null);
    if (mode === "ADMIN" && warehouses.length === 1) {
      reset({
        name: "",
        sku: "",
        category: "",
        vendor: "",
        reorderLevel: 0,
        currentStock: 0,
        price: 0,
        maxStockLevel: 100,
        autoRestockEnabled: false,
        warehouseId: warehouses[0].id
      });
    } else {
      reset({
        name: "",
        sku: "",
        category: "",
        vendor: "",
        reorderLevel: 0,
        currentStock: 0,
        price: 0,
        maxStockLevel: 100,
        autoRestockEnabled: false,
        warehouseId: undefined
      });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFormError(null);
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      category: product.category,
      vendor: product.vendor,
      reorderLevel: product.reorderLevel,
      currentStock: product.currentStock,
      price: product.price,
      maxStockLevel: product.maxStockLevel || product.reorderLevel,
      autoRestockEnabled: product.autoRestockEnabled,
      warehouseId: product.warehouseId
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
    reset();
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (mode === "ADMIN" && (!values.warehouseId || Number.isNaN(values.warehouseId))) {
      setFormError("Select the warehouse for this product");
      return;
    }

    if (mode === "MANAGER" && !managerWarehouseId) {
      setFormError("No warehouse assigned. Contact the administrator.");
      return;
    }

    const payload: ProductPayload = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      category: values.category.trim(),
      vendor: values.vendor.trim(),
      reorderLevel: values.reorderLevel,
      maxStockLevel: values.maxStockLevel,
      currentStock: values.currentStock,
      price: values.price,
      autoRestockEnabled: values.autoRestockEnabled,
      warehouseId: mode === "ADMIN" ? values.warehouseId : undefined
    };

    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this product? This action cannot be undone.");
    if (!confirmed) {
      return;
    }
    await deleteMutation.mutateAsync(id);
  };

  const products = productsQuery.data ?? [];
  const displayProducts = useMemo(() => {
    if (mode !== "MANAGER") {
      return products;
    }

    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      return products;
    }

    return products.filter((product) => {
      return [product.name, product.sku, product.category, product.vendor]
        .some((value) => value?.toLowerCase().includes(normalizedTerm));
    });
  }, [mode, products, searchTerm]);
  const isLoadingProducts = productsQuery.isLoading;
  const hasManagerWarehouse = mode === "MANAGER" ? Boolean(managerWarehouseId) : true;
  const formTitle = editingProduct ? "Edit Product" : "Add Product";
  const noProductsAvailable = !isLoadingProducts && products.length === 0;
  const noSearchResults = mode === "MANAGER"
    ? !isLoadingProducts && products.length > 0 && displayProducts.length === 0
    : false;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40">
        {mode === "ADMIN" ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
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
                  Stock Status
                </label>
                <select
                  id="stock-filter"
                  className="input"
                  value={filters.stockStatus}
                  onChange={(event) => setFilters((prev) => ({ ...prev, stockStatus: event.target.value as ProductFiltersState["stockStatus"] }))}
                >
                  {stockStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "ALL" ? "All" : option.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="warehouse-filter">
                  Warehouse
                </label>
                <select
                  id="warehouse-filter"
                  className="input"
                  value={filters.warehouseId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, warehouseId: event.target.value }))}
                >
                  <option value="ALL">All</option>
                  {warehouses.map((warehouse: WarehouseSummary) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.locationCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-full border border-white/70 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/80 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() =>
                  setFilters({ category: "", vendor: "", stockStatus: "ALL", warehouseId: "ALL" })
                }
              >
                Reset Filters
              </button>
              <button
                type="button"
                className="rounded-full bg-midnight px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
                onClick={openCreateModal}
              >
                Add Product
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex w-full flex-col gap-1 md:max-w-md">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="manager-search">
                Search Inventory
              </label>
              <input
                id="manager-search"
                className="input"
                placeholder="Search my store by name, SKU..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="rounded-full bg-midnight px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
              onClick={openCreateModal}
            >
              Add New Product
            </button>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/40 bg-white/85 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-slate-900/40">
        {!hasManagerWarehouse && (
          <p className="text-sm text-red-500">Your account is not attached to a warehouse. Contact the administrator.</p>
        )}

        {hasManagerWarehouse && isLoadingProducts && <p>Loading products...</p>}
        {hasManagerWarehouse && productsQuery.isError && (
          <p className="text-sm text-red-500">Unable to load products.</p>
        )}
        {hasManagerWarehouse && noProductsAvailable && (
          <p className="text-sm text-slate-500">
            {mode === "ADMIN" ? "No products found for the selected filters." : "No products in your store yet."}
          </p>
        )}
        {hasManagerWarehouse && noSearchResults && (
          <p className="text-sm text-slate-500">No products match your search.</p>
        )}

        {hasManagerWarehouse && displayProducts.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-white/30 bg-white/90 shadow-inner dark:border-slate-700/50 dark:bg-slate-900/70">
            {mode === "MANAGER" ? (
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="border-b border-white/40 bg-white/70 text-xs uppercase tracking-widest text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">SKU</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Quantity</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Price (₹)</th>
                    <th className="px-4 py-2">Auto-Restock</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProducts.map((product) => {
                    const outOfStock = product.currentStock === 0;
                    const lowStock = !outOfStock && product.lowStock;
                    const statusLabel = outOfStock ? "Out of Stock" : lowStock ? "Low Stock" : "In Stock";
                    const statusClass = outOfStock
                      ? "bg-red-100 text-red-600"
                      : lowStock
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700";

                    return (
                      <tr key={product.id} className="border-b last:border-none">
                        <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                        <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                        <td className="px-4 py-3 text-slate-600">{product.category}</td>
                        <td className="px-4 py-3 text-slate-600">{product.currentStock}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{currencyFormatter.format(product.price ?? 0)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {product.autoRestockEnabled ? "Enabled" : "Disabled"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="rounded-full border border-slate-300/80 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60"
                              onClick={() => openEditModal(product)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-red-300/80 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400/70 dark:text-red-300 dark:hover:bg-red-500/20"
                              onClick={() => handleDelete(product.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="border-b border-white/40 bg-white/70 text-xs uppercase tracking-widest text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">SKU</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Vendor</th>
                    <th className="px-4 py-2">Current Stock</th>
                    <th className="px-4 py-2">Reorder Level</th>
                    <th className="px-4 py-2">Unit Price</th>
                    <th className="px-4 py-2">Total Value</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Warehouse</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProducts.map((product) => {
                    const outOfStock = product.currentStock === 0;
                    const lowStock = !outOfStock && product.lowStock;
                    const statusLabel = outOfStock ? "Out of Stock" : lowStock ? "Low Stock" : "Healthy";
                    const statusClass = outOfStock
                      ? "bg-red-100 text-red-600"
                      : lowStock
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700";

                    return (
                      <tr key={product.id} className="border-b last:border-none">
                        <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                        <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                        <td className="px-4 py-3 text-slate-600">{product.category}</td>
                        <td className="px-4 py-3 text-slate-600">{product.vendor}</td>
                        <td className="px-4 py-3 text-slate-600">{product.currentStock}</td>
                        <td className="px-4 py-3 text-slate-600">{product.reorderLevel}</td>
                        <td className="px-4 py-3 text-slate-600">{currencyFormatter.format(product.price ?? 0)}</td>
                        <td className="px-4 py-3 text-slate-600">{currencyFormatter.format(product.totalValue ?? 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {product.warehouseName}
                          <span className="ml-2 text-xs text-slate-400">{product.warehouseCode}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="rounded-full border border-slate-300/80 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60"
                              onClick={() => openEditModal(product)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-red-300/80 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400/70 dark:text-red-300 dark:hover:bg-red-500/20"
                              onClick={() => handleDelete(product.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/30 bg-white/95 p-8 shadow-2xl transition dark:border-slate-700/60 dark:bg-slate-900/90">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-midnight dark:text-white">{formTitle}</h2>
              <button
                type="button"
                className="rounded-full border border-transparent px-3 py-1 text-sm text-slate-500 transition hover:border-slate-200 hover:text-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="name">
                  Product Name
                </label>
                <input id="name" className="input" {...register("name")} />
                {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="sku">
                  SKU (Product ID)
                </label>
                <input id="sku" className="input" {...register("sku")} />
                {errors.sku && <span className="text-xs text-red-500">{errors.sku.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="category">
                  Category
                </label>
                <input id="category" className="input" {...register("category")} />
                {errors.category && <span className="text-xs text-red-500">{errors.category.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="vendor">
                  Supplier
                </label>
                <input id="vendor" className="input" {...register("vendor")} />
                {errors.vendor && <span className="text-xs text-red-500">{errors.vendor.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="currentStock">
                  Current Quantity
                </label>
                <input id="currentStock" type="number" className="input" {...register("currentStock")} />
                {errors.currentStock && <span className="text-xs text-red-500">{errors.currentStock.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="price">
                  Price (₹)
                </label>
                <input id="price" type="number" step="0.01" className="input" {...register("price")} />
                {errors.price && <span className="text-xs text-red-500">{errors.price.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="reorderLevel">
                  Min Stock Level
                </label>
                <input id="reorderLevel" type="number" className="input" {...register("reorderLevel")} />
                {errors.reorderLevel && <span className="text-xs text-red-500">{errors.reorderLevel.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="maxStockLevel">
                  Max Stock Level
                </label>
                <input id="maxStockLevel" type="number" className="input" {...register("maxStockLevel")} />
                {errors.maxStockLevel && <span className="text-xs text-red-500">{errors.maxStockLevel.message}</span>}
              </div>
              {mode === "ADMIN" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="warehouseId">
                    Warehouse
                  </label>
                  <select
                    id="warehouseId"
                    className="input"
                    disabled={isLoadingWarehouses}
                    {...register("warehouseId", {
                      setValueAs: (value: string) => (value === "" ? undefined : Number(value))
                    })}
                  >
                    <option value="">Select</option>
                    {warehouses.map((warehouse: WarehouseSummary) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.locationCode})
                      </option>
                    ))}
                  </select>
                  {errors.warehouseId && <span className="text-xs text-red-500">{errors.warehouseId.message}</span>}
                </div>
              )}
              <div className="col-span-full flex items-center gap-2 pt-2">
                <input
                  id="autoRestockEnabled"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-midnight focus:ring-midnight dark:border-slate-600 dark:text-amber-400 dark:focus:ring-amber-400"
                  {...register("autoRestockEnabled")}
                />
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="autoRestockEnabled">
                  Enable Auto-Restock
                </label>
              </div>
              {formError && (
                <div className="col-span-full rounded-md bg-red-100 px-3 py-2 text-sm text-red-600">{formError}</div>
              )}
              <div className="col-span-full mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full border border-slate-300/80 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                  className="rounded-full bg-midnight px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
                >
                  {isSubmitting || createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
