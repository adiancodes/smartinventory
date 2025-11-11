import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRestockSuggestions, createPurchaseOrder } from "../../api/restock";
import { fetchWarehouses } from "../../api/warehouses";
import { fetchProductCategories, fetchProducts } from "../../api/products";
import { useAuth } from "../../hooks/useAuth";
import type { Product, StockStatus, WarehouseSummary } from "../../types/product";
import {
  PurchaseOrderPayload,
  RestockSuggestion
} from "../../types/restock";
import type { RestockSuggestionFilters } from "../../types/restock";

interface RestockModuleProps {
  mode: "ADMIN" | "MANAGER";
}

type StockStatusFilter = "ALL" | StockStatus;

type FilterState = {
  warehouseId: string;
  category: string;
  stockStatus: StockStatusFilter;
  autoOnly: boolean;
};

export function RestockModule({ mode }: RestockModuleProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = mode === "ADMIN";
  const [filters, setFilters] = useState<FilterState>(() => ({
    warehouseId: mode === "ADMIN" ? "ALL" : String(user?.warehouseId ?? ""),
    category: "ALL",
    stockStatus: "ALL",
    autoOnly: false
  }));
  const [selectedSuggestion, setSelectedSuggestion] = useState<RestockSuggestion | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  useEffect(() => {
    if (mode === "MANAGER" && user?.warehouseId) {
      setFilters((prev) => ({ ...prev, warehouseId: String(user.warehouseId) }));
    }
  }, [mode, user?.warehouseId]);

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
    enabled: mode === "ADMIN"
  });

  const normalizedFilters = useMemo<RestockSuggestionFilters>(() => {
    const warehouseId = mode === "ADMIN"
      ? filters.warehouseId !== "ALL" && filters.warehouseId !== ""
        ? Number(filters.warehouseId)
        : undefined
      : user?.warehouseId ?? undefined;

    const category = filters.category !== "ALL" ? filters.category : undefined;
    const stockStatus = filters.stockStatus !== "ALL" ? filters.stockStatus : undefined;
    const autoOnly = filters.autoOnly ? true : undefined;

    return { warehouseId, category, stockStatus, autoOnly };
  }, [filters, mode, user?.warehouseId]);

  const manualWarehouseId = useMemo<number | undefined>(() => {
    if (isAdmin) {
      if (filters.warehouseId === "ALL" || filters.warehouseId === "") {
        return undefined;
      }
      return Number(filters.warehouseId);
    }
    return user?.warehouseId ?? undefined;
  }, [filters.warehouseId, isAdmin, user?.warehouseId]);

  const manualWarehouseName = useMemo(() => {
    if (isAdmin) {
      if (!manualWarehouseId) {
        return "";
      }
      const match = warehouses.find((warehouse) => warehouse.id === manualWarehouseId);
      return match ? `${match.name} (${match.locationCode})` : "Selected Warehouse";
    }
    return user?.warehouseName ?? "";
  }, [isAdmin, manualWarehouseId, user?.warehouseName, warehouses]);

  const manualButtonDisabled = isAdmin ? !manualWarehouseId : !user?.warehouseId;
  const manualDisabledMessage = isAdmin && !manualWarehouseId
    ? "Select a warehouse above to enable manual purchase orders."
    : mode === "MANAGER" && !user?.warehouseId
      ? "Your account is not linked to a warehouse yet. Contact the administrator to enable manual purchase orders."
      : "";

  const categoriesQuery = useQuery({
    queryKey: ["product-categories", normalizedFilters.warehouseId ?? "ALL"],
    queryFn: () => fetchProductCategories(normalizedFilters.warehouseId),
    enabled: mode === "ADMIN" || Boolean(normalizedFilters.warehouseId),
    staleTime: 5 * 60 * 1000
  });

  const suggestionsQuery = useQuery({
    queryKey: ["restock", "suggestions", mode, normalizedFilters],
    queryFn: () => fetchRestockSuggestions(normalizedFilters),
    enabled: mode === "ADMIN" || Boolean(user?.warehouseId)
  });

  const manualProductsQuery = useQuery({
    queryKey: ["manual-purchase-order", manualWarehouseId ?? "ALL"],
    queryFn: () => fetchProducts({ warehouseId: manualWarehouseId ?? undefined }),
    enabled: manualModalOpen && Boolean(manualWarehouseId),
    staleTime: 5 * 60 * 1000
  });

  const createOrderMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restock", "suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setSelectedSuggestion(null);
      setManualModalOpen(false);
    }
  });

  const suggestions = suggestionsQuery.data ?? [];
  const activeVendorSuggestions = useMemo(() => {
    if (!selectedSuggestion) {
      return [];
    }
    return suggestions.filter((suggestion) =>
      suggestion.vendor === selectedSuggestion.vendor &&
      suggestion.warehouseId === selectedSuggestion.warehouseId
    );
  }, [selectedSuggestion, suggestions]);

  const handleOpenModal = (suggestion: RestockSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleCloseModal = () => {
    setSelectedSuggestion(null);
  };

  const handleOpenManualModal = () => {
    if (manualButtonDisabled) {
      return;
    }
    if (manualWarehouseId) {
      queryClient.prefetchQuery({
        queryKey: ["manual-purchase-order", manualWarehouseId],
        queryFn: () => fetchProducts({ warehouseId: manualWarehouseId })
      }).catch(() => {
        // Prefetch errors surface via modal query; no-op here.
      });
    }
    setManualModalOpen(true);
  };

  const handleCreatePurchaseOrder = async (payload: PurchaseOrderPayload) => {
    await createOrderMutation.mutateAsync(payload);
    window.alert("Purchase order created successfully.");
  };

  const stockStatusOptions: StockStatusFilter[] = ["ALL", "LOW_STOCK", "OUT_OF_STOCK"];
  const categories = categoriesQuery.data ?? [];
  const summaryCount = suggestions.length;
  const selectedWarehouseName = useMemo(() => {
    if (!isAdmin) {
      return user?.warehouseName ?? "";
    }
    if (filters.warehouseId === "ALL" || !filters.warehouseId) {
      return "All Warehouses";
    }
    const selected = warehouses.find((warehouse) => String(warehouse.id) === filters.warehouseId);
    return selected ? selected.name : "Selected Warehouse";
  }, [filters.warehouseId, isAdmin, user?.warehouseName, warehouses]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
            {isAdmin && (
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
                  <option value="ALL">All Warehouses</option>
                  {warehouses.map((warehouse: WarehouseSummary) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.locationCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="category-filter">
                Category
              </label>
              <select
                id="category-filter"
                className="input"
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
              >
                <option value="ALL">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="stock-filter">
                Stock Risk
              </label>
              <select
                id="stock-filter"
                className="input"
                value={filters.stockStatus}
                onChange={(event) => setFilters((prev) => ({ ...prev, stockStatus: event.target.value as StockStatusFilter }))}
              >
                {stockStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "All" : option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-midnight focus:ring-midnight"
                checked={filters.autoOnly}
                onChange={(event) => setFilters((prev) => ({ ...prev, autoOnly: event.target.checked }))}
              />
              Auto-Restock Enabled Only
            </label>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
              onClick={() => setFilters({
                warehouseId: mode === "ADMIN" ? "ALL" : String(user?.warehouseId ?? ""),
                category: "ALL",
                stockStatus: "ALL",
                autoOnly: false
              })}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Manual Purchase Order</h2>
            <p className="text-sm text-slate-500">
              Build a purchase order from any product in your catalog.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={manualButtonDisabled}
            onClick={handleOpenManualModal}
          >
            New Purchase Order
          </button>
        </div>
        {manualDisabledMessage && (
          <p className="mt-4 text-sm text-slate-500">{manualDisabledMessage}</p>
        )}
        {manualModalOpen && manualProductsQuery.isLoading && (
          <p className="mt-4 text-sm text-slate-500">Loading products...</p>
        )}
        {manualModalOpen && manualProductsQuery.isError && (
          <p className="mt-4 text-sm text-red-500">Unable to load products right now.</p>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Suggested Restock</h2>
            <p className="text-sm text-slate-500">
              {selectedWarehouseName} · {summaryCount} recommendation{summaryCount === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Prioritized by days until stockout and demand velocity
          </p>
        </div>

        {mode === "MANAGER" && !user?.warehouseId ? (
          <p className="py-6 text-sm text-red-500">
            Your account is not linked to a warehouse yet. Contact the administrator to enable auto-restock insights.
          </p>
        ) : (
          <>
            {suggestionsQuery.isLoading && (
              <p className="py-6 text-sm text-slate-500">Evaluating inventory signals...</p>
            )}

            {suggestionsQuery.isError && (
              <p className="py-6 text-sm text-red-500">Unable to load restock recommendations right now.</p>
            )}

            {!suggestionsQuery.isLoading && suggestions.length === 0 && (
              <p className="py-6 text-sm text-slate-500">No restock actions detected for the selected filters.</p>
            )}

            {!suggestionsQuery.isLoading && suggestions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Warehouse</th>
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2">Reorder Level</th>
                  <th className="px-4 py-2">Suggested Qty</th>
                  <th className="px-4 py-2">Days to Stockout</th>
                  <th className="px-4 py-2">Auto</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((suggestion) => {
                  const stockBadgeClass = suggestion.currentStock === 0
                    ? "bg-red-100 text-red-600"
                    : suggestion.currentStock <= suggestion.reorderLevel
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700";

                  const daysValue = Number(suggestion.projectedDaysUntilStockout ?? 0);
                  const daysLabel = daysValue === 0 ? "Now" : `${daysValue.toFixed(1)} days`;

                  return (
                    <tr key={`${suggestion.productId}-${suggestion.warehouseId}`} className="border-b last:border-none">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{suggestion.productName}</div>
                        <div className="text-xs text-slate-500">SKU: {suggestion.productSku} · {suggestion.category}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{suggestion.warehouseName}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stockBadgeClass}`}>
                          {suggestion.currentStock} units
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{suggestion.reorderLevel}</td>
                      <td className="px-4 py-3 text-slate-600">{suggestion.suggestedReorderQuantity}</td>
                      <td className="px-4 py-3 text-slate-600">{daysLabel}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {suggestion.autoRestockEnabled ? (
                          <span className="rounded-full bg-midnight/10 px-3 py-1 text-xs font-semibold text-midnight">
                            Enabled
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 w-64">
                        <span className="block text-xs leading-5 text-slate-500">{suggestion.recommendationReason}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-md bg-midnight px-4 py-2 text-xs font-semibold text-white shadow-sm"
                          onClick={() => handleOpenModal(suggestion)}
                        >
                          Generate PO
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            )}
          </>
        )}
      </section>

      <PurchaseOrderModal
        open={Boolean(selectedSuggestion)}
        context="suggestion"
        mode={mode}
        suggestion={selectedSuggestion}
        warehouses={warehouses}
        warehouseId={selectedSuggestion?.warehouseId ?? null}
        warehouseName={selectedSuggestion?.warehouseName ?? ""}
        availableSuggestions={activeVendorSuggestions}
        submitting={createOrderMutation.isPending}
        onSubmit={handleCreatePurchaseOrder}
        onClose={handleCloseModal}
      />

      <PurchaseOrderModal
        open={manualModalOpen}
        context="manual"
        mode={mode}
        warehouses={warehouses}
        warehouseId={manualWarehouseId ?? null}
        warehouseName={manualWarehouseName}
        productCatalog={manualProductsQuery.data ?? []}
        submitting={createOrderMutation.isPending}
        catalogLoading={manualProductsQuery.isLoading}
        catalogErrored={manualProductsQuery.isError}
        onSubmit={handleCreatePurchaseOrder}
        onClose={() => setManualModalOpen(false)}
      />
    </div>
  );
}

interface PurchaseOrderModalProps {
  open: boolean;
  context: "suggestion" | "manual";
  mode: "ADMIN" | "MANAGER";
  suggestion?: RestockSuggestion | null;
  warehouses: WarehouseSummary[];
  warehouseId: number | null;
  warehouseName?: string;
  availableSuggestions?: RestockSuggestion[];
  productCatalog?: Product[];
  submitting: boolean;
  catalogLoading?: boolean;
  catalogErrored?: boolean;
  onSubmit: (payload: PurchaseOrderPayload) => Promise<void>;
  onClose: () => void;
}

type DraftItem = {
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
};

function PurchaseOrderModal({
  open,
  context,
  mode,
  suggestion,
  warehouses,
  warehouseId,
  warehouseName: warehouseNameProp,
  availableSuggestions = [],
  productCatalog = [],
  submitting,
  catalogLoading = false,
  catalogErrored = false,
  onSubmit,
  onClose
}: PurchaseOrderModalProps) {
  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorContactPreference, setVendorContactPreference] = useState("EMAIL");
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);

    setVendorEmail("");
    setVendorPhone("");
    setVendorContactPreference("EMAIL");
    setNotes("");
    setSendEmail(true);
    setSendSms(false);
    setExpectedDate(defaultDate.toISOString().slice(0, 10));
    setFormError(null);

    if (context === "suggestion" && suggestion) {
      setVendorName(suggestion.vendor);
      setItems([
        {
          productId: suggestion.productId,
          productName: suggestion.productName,
          productSku: suggestion.productSku,
          quantity: suggestion.suggestedReorderQuantity,
          unitPrice: Number(suggestion.unitPrice ?? 0)
        }
      ]);
    } else {
      setVendorName("");
      setItems([]);
    }
  }, [open, context, suggestion]);

  useEffect(() => {
    if (!open) {
      setItems([]);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  if (context === "suggestion" && !suggestion) {
    return null;
  }

  const resolvedWarehouseName = (() => {
    if (warehouseNameProp && warehouseNameProp.trim()) {
      return warehouseNameProp;
    }
    if (context === "suggestion" && suggestion) {
      if (mode === "ADMIN") {
        const warehouse = warehouses.find((item) => item.id === suggestion.warehouseId);
        return warehouse ? `${warehouse.name} (${warehouse.locationCode})` : "Selected Warehouse";
      }
      return suggestion.warehouseName;
    }
    if (warehouseId) {
      const warehouse = warehouses.find((item) => item.id === warehouseId);
      if (warehouse) {
        return `${warehouse.name} (${warehouse.locationCode})`;
      }
    }
    return "Select a warehouse";
  })();

  const handleItemChange = (index: number, key: keyof DraftItem, value: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value } as DraftItem;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddItem = (productId: number) => {
    if (context === "suggestion") {
      const candidate = availableSuggestions.find((item) => item.productId === productId);
      if (!candidate) {
        return;
      }
      setItems((prev) => {
        if (prev.some((item) => item.productId === candidate.productId)) {
          return prev;
        }
        return [
          ...prev,
          {
            productId: candidate.productId,
            productName: candidate.productName,
            productSku: candidate.productSku,
            quantity: candidate.suggestedReorderQuantity,
            unitPrice: Number(candidate.unitPrice ?? 0)
          }
        ];
      });
      if (!vendorName.trim() && candidate.vendor) {
        setVendorName(candidate.vendor);
      }
    } else {
      const candidate = productCatalog.find((item) => item.id === productId);
      if (!candidate) {
        return;
      }
      setItems((prev) => {
        if (prev.some((item) => item.productId === candidate.id)) {
          return prev;
        }
        const initialQuantity = candidate.reorderLevel > 0 ? candidate.reorderLevel : 1;
        const initialUnitPrice = candidate.price && candidate.price > 0 ? candidate.price : 1;
        return [
          ...prev,
          {
            productId: candidate.id,
            productName: candidate.name,
            productSku: candidate.sku,
            quantity: initialQuantity,
            unitPrice: Number(initialUnitPrice)
          }
        ];
      });
      if (!vendorName.trim() && candidate.vendor) {
        setVendorName(candidate.vendor);
      }
    }
  };

  const suggestionAdditions = context === "suggestion"
    ? availableSuggestions.filter((item) => !items.some((draft) => draft.productId === item.productId))
    : [];

  const manualAdditions = context === "manual"
    ? productCatalog.filter((product) => !items.some((draft) => draft.productId === product.id))
    : [];

  const additionOptions = context === "suggestion" ? suggestionAdditions : manualAdditions;
  const additionLabel = context === "suggestion" ? "Add Suggested Item" : "Add Product";

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vendorName.trim()) {
      setFormError("Enter the vendor name");
      return;
    }
    if (items.length === 0) {
      setFormError("Add at least one item to the purchase order");
      return;
    }
    if (items.some((item) => item.quantity <= 0)) {
      setFormError("Quantity must be greater than zero");
      return;
    }
    if (items.some((item) => item.unitPrice <= 0)) {
      setFormError("Unit price must be greater than zero");
      return;
    }
    if (!warehouseId) {
      setFormError("Select a warehouse before generating a purchase order.");
      return;
    }

    const payload: PurchaseOrderPayload = {
      vendorName: vendorName.trim(),
      vendorEmail: vendorEmail.trim() || undefined,
      vendorPhone: vendorPhone.trim() || undefined,
      vendorContactPreference: vendorContactPreference,
      notes: notes.trim() || undefined,
      warehouseId,
      expectedDeliveryDate: expectedDate ? new Date(`${expectedDate}T00:00:00`).toISOString() : undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Math.round(item.quantity),
        unitPrice: Number(item.unitPrice.toFixed(2))
      })),
      sendEmail,
      sendSms
    };

    try {
      setFormError(null);
      await onSubmit(payload);
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? "Failed to create purchase order";
      setFormError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Generate Purchase Order</h3>
            <p className="text-sm text-slate-500">{resolvedWarehouseName}</p>
          </div>
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-slate-800"
            onClick={onClose}
          >
            Close
          </button>
        </header>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="vendorName">
                Vendor Name
              </label>
              <input
                id="vendorName"
                className="input"
                value={vendorName}
                onChange={(event) => setVendorName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="contactPreference">
                Preferred Contact
              </label>
              <select
                id="contactPreference"
                className="input"
                value={vendorContactPreference}
                onChange={(event) => setVendorContactPreference(event.target.value)}
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="vendorEmail">
                Vendor Email
              </label>
              <input
                id="vendorEmail"
                className="input"
                placeholder="vendor@example.com"
                value={vendorEmail}
                onChange={(event) => setVendorEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="vendorPhone">
                Vendor Phone
              </label>
              <input
                id="vendorPhone"
                className="input"
                placeholder="+91 98765 43210"
                value={vendorPhone}
                onChange={(event) => setVendorPhone(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="expectedDate">
                Expected Delivery
              </label>
              <input
                id="expectedDate"
                type="date"
                className="input"
                value={expectedDate}
                onChange={(event) => setExpectedDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="notes">
                Notes
              </label>
              <input
                id="notes"
                className="input"
                placeholder="Optional instructions"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
              <h4 className="text-sm font-semibold text-slate-600">Order Items</h4>
              {additionOptions.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <label htmlFor="addItem" className="text-xs uppercase text-slate-500">{additionLabel}</label>
                  <select
                    id="addItem"
                    className="input"
                    defaultValue=""
                    disabled={context === "manual" && (catalogLoading || catalogErrored)}
                    onChange={(event) => {
                      const productId = Number(event.target.value);
                      if (productId) {
                        handleAddItem(productId);
                        event.target.value = "";
                      }
                    }}
                  >
                    <option value="">Select</option>
                    {context === "suggestion"
                      ? suggestionAdditions.map((item) => (
                          <option key={item.productId} value={item.productId}>
                            {item.productName} · Suggest {item.suggestedReorderQuantity}
                          </option>
                        ))
                      : manualAdditions.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} · SKU {product.sku}
                          </option>
                        ))}
                  </select>
                </div>
              )}
            </div>
            {context === "manual" && catalogLoading && (
              <p className="px-4 py-3 text-sm text-slate-500">Fetching product catalog...</p>
            )}
            {context === "manual" && catalogErrored && (
              <p className="px-4 py-3 text-sm text-red-500">
                Unable to load products for this warehouse. Try again later.
              </p>
            )}
            <div className="divide-y">
              {items.map((item, index) => (
                <div key={item.productId} className="grid grid-cols-1 gap-4 px-4 py-3 md:grid-cols-5 md:items-center">
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-slate-700">{item.productName}</p>
                    <p className="text-xs text-slate-400">SKU: {item.productSku}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase text-slate-500">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      className="input"
                      value={item.quantity}
                      onChange={(event) => handleItemChange(index, "quantity", Number(event.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase text-slate-500">Unit Price</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      className="input"
                      value={item.unitPrice}
                      onChange={(event) => handleItemChange(index, "unitPrice", Number(event.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <p className="text-sm font-semibold text-slate-600">
                      {(item.quantity * item.unitPrice).toFixed(2)}
                    </p>
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-500"
                        onClick={() => handleRemoveItem(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="px-4 py-5 text-sm text-slate-500">No items added yet.</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-midnight focus:ring-midnight"
                  checked={sendEmail}
                  onChange={(event) => setSendEmail(event.target.checked)}
                />
                Email vendor
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-midnight focus:ring-midnight"
                  checked={sendSms}
                  onChange={(event) => setSendSms(event.target.checked)}
                />
                SMS vendor
              </label>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-slate-400">Order Total</p>
              <p className="text-xl font-semibold text-slate-800">₹ {totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {formError && (
            <div className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm text-red-600">{formError}</div>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Generating..." : "Create Purchase Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
