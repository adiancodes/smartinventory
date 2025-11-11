import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRestockSuggestions, createPurchaseOrder } from "../../api/restock";
import { fetchWarehouses } from "../../api/warehouses";
import { fetchProductCategories } from "../../api/products";
import { useAuth } from "../../hooks/useAuth";
export function RestockModule({ mode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState(() => ({
        warehouseId: mode === "ADMIN" ? "ALL" : String(user?.warehouseId ?? ""),
        category: "ALL",
        stockStatus: "ALL",
        autoOnly: false
    }));
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
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
    const normalizedFilters = useMemo(() => {
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
    const createOrderMutation = useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["restock", "suggestions"] });
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            setSelectedSuggestion(null);
        }
    });
    const suggestions = suggestionsQuery.data ?? [];
    const activeVendorSuggestions = useMemo(() => {
        if (!selectedSuggestion) {
            return [];
        }
        return suggestions.filter((suggestion) => suggestion.vendor === selectedSuggestion.vendor &&
            suggestion.warehouseId === selectedSuggestion.warehouseId);
    }, [selectedSuggestion, suggestions]);
    const handleOpenModal = (suggestion) => {
        setSelectedSuggestion(suggestion);
    };
    const handleCloseModal = () => {
        setSelectedSuggestion(null);
    };
    const handleCreatePurchaseOrder = async (payload) => {
        await createOrderMutation.mutateAsync(payload);
        window.alert("Purchase order created successfully.");
    };
    const stockStatusOptions = ["ALL", "LOW_STOCK", "OUT_OF_STOCK"];
    const categories = categoriesQuery.data ?? [];
    const summaryCount = suggestions.length;
    const isAdmin = mode === "ADMIN";
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
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: _jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { className: "grid flex-1 grid-cols-1 gap-4 md:grid-cols-3", children: [isAdmin && (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "warehouse-filter", children: "Warehouse" }), _jsxs("select", { id: "warehouse-filter", className: "input", value: filters.warehouseId, onChange: (event) => setFilters((prev) => ({ ...prev, warehouseId: event.target.value })), children: [_jsx("option", { value: "ALL", children: "All Warehouses" }), warehouses.map((warehouse) => (_jsxs("option", { value: warehouse.id, children: [warehouse.name, " (", warehouse.locationCode, ")"] }, warehouse.id)))] })] })), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "category-filter", children: "Category" }), _jsxs("select", { id: "category-filter", className: "input", value: filters.category, onChange: (event) => setFilters((prev) => ({ ...prev, category: event.target.value })), children: [_jsx("option", { value: "ALL", children: "All Categories" }), categories.map((category) => (_jsx("option", { value: category, children: category }, category)))] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "stock-filter", children: "Stock Risk" }), _jsx("select", { id: "stock-filter", className: "input", value: filters.stockStatus, onChange: (event) => setFilters((prev) => ({ ...prev, stockStatus: event.target.value })), children: stockStatusOptions.map((option) => (_jsx("option", { value: option, children: option === "ALL" ? "All" : option.replaceAll("_", " ") }, option))) })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-600", children: [_jsx("input", { type: "checkbox", className: "h-4 w-4 rounded border-slate-300 text-midnight focus:ring-midnight", checked: filters.autoOnly, onChange: (event) => setFilters((prev) => ({ ...prev, autoOnly: event.target.checked })) }), "Auto-Restock Enabled Only"] }), _jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600", onClick: () => setFilters({
                                        warehouseId: mode === "ADMIN" ? "ALL" : String(user?.warehouseId ?? ""),
                                        category: "ALL",
                                        stockStatus: "ALL",
                                        autoOnly: false
                                    }), children: "Reset" })] })] }) }), _jsxs("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "Suggested Restock" }), _jsxs("p", { className: "text-sm text-slate-500", children: [selectedWarehouseName, " \u00B7 ", summaryCount, " recommendation", summaryCount === 1 ? "" : "s"] })] }), _jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Prioritized by days until stockout and demand velocity" })] }), mode === "MANAGER" && !user?.warehouseId ? (_jsx("p", { className: "py-6 text-sm text-red-500", children: "Your account is not linked to a warehouse yet. Contact the administrator to enable auto-restock insights." })) : (_jsxs(_Fragment, { children: [suggestionsQuery.isLoading && (_jsx("p", { className: "py-6 text-sm text-slate-500", children: "Evaluating inventory signals..." })), suggestionsQuery.isError && (_jsx("p", { className: "py-6 text-sm text-red-500", children: "Unable to load restock recommendations right now." })), !suggestionsQuery.isLoading && suggestions.length === 0 && (_jsx("p", { className: "py-6 text-sm text-slate-500", children: "No restock actions detected for the selected filters." })), !suggestionsQuery.isLoading && suggestions.length > 0 && (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full table-auto text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b bg-slate-50 text-xs uppercase tracking-wider text-slate-500", children: [_jsx("th", { className: "px-4 py-2", children: "Product" }), _jsx("th", { className: "px-4 py-2", children: "Warehouse" }), _jsx("th", { className: "px-4 py-2", children: "Stock" }), _jsx("th", { className: "px-4 py-2", children: "Reorder Level" }), _jsx("th", { className: "px-4 py-2", children: "Suggested Qty" }), _jsx("th", { className: "px-4 py-2", children: "Days to Stockout" }), _jsx("th", { className: "px-4 py-2", children: "Auto" }), _jsx("th", { className: "px-4 py-2", children: "Reason" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Actions" })] }) }), _jsx("tbody", { children: suggestions.map((suggestion) => {
                                                const stockBadgeClass = suggestion.currentStock === 0
                                                    ? "bg-red-100 text-red-600"
                                                    : suggestion.currentStock <= suggestion.reorderLevel
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-emerald-100 text-emerald-700";
                                                const daysValue = Number(suggestion.projectedDaysUntilStockout ?? 0);
                                                const daysLabel = daysValue === 0 ? "Now" : `${daysValue.toFixed(1)} days`;
                                                return (_jsxs("tr", { className: "border-b last:border-none", children: [_jsxs("td", { className: "px-4 py-3", children: [_jsx("div", { className: "font-medium text-slate-800", children: suggestion.productName }), _jsxs("div", { className: "text-xs text-slate-500", children: ["SKU: ", suggestion.productSku, " \u00B7 ", suggestion.category] })] }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: suggestion.warehouseName }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: _jsxs("span", { className: `rounded-full px-3 py-1 text-xs font-semibold ${stockBadgeClass}`, children: [suggestion.currentStock, " units"] }) }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: suggestion.reorderLevel }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: suggestion.suggestedReorderQuantity }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: daysLabel }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: suggestion.autoRestockEnabled ? (_jsx("span", { className: "rounded-full bg-midnight/10 px-3 py-1 text-xs font-semibold text-midnight", children: "Enabled" })) : (_jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500", children: "Manual" })) }), _jsx("td", { className: "px-4 py-3 text-slate-600 w-64", children: _jsx("span", { className: "block text-xs leading-5 text-slate-500", children: suggestion.recommendationReason }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx("button", { type: "button", className: "rounded-md bg-midnight px-4 py-2 text-xs font-semibold text-white shadow-sm", onClick: () => handleOpenModal(suggestion), children: "Generate PO" }) })] }, `${suggestion.productId}-${suggestion.warehouseId}`));
                                            }) })] }) }))] }))] }), _jsx(PurchaseOrderModal, { open: Boolean(selectedSuggestion), mode: mode, suggestion: selectedSuggestion, warehouses: warehouses, availableSuggestions: activeVendorSuggestions, submitting: createOrderMutation.isPending, onSubmit: handleCreatePurchaseOrder, onClose: handleCloseModal })] }));
}
function PurchaseOrderModal({ open, mode, suggestion, warehouses, availableSuggestions, submitting, onSubmit, onClose }) {
    const [vendorName, setVendorName] = useState("");
    const [vendorEmail, setVendorEmail] = useState("");
    const [vendorPhone, setVendorPhone] = useState("");
    const [vendorContactPreference, setVendorContactPreference] = useState("EMAIL");
    const [notes, setNotes] = useState("");
    const [expectedDate, setExpectedDate] = useState("");
    const [sendEmail, setSendEmail] = useState(true);
    const [sendSms, setSendSms] = useState(false);
    const [items, setItems] = useState([]);
    const [formError, setFormError] = useState(null);
    useEffect(() => {
        if (!open || !suggestion) {
            return;
        }
        setVendorName(suggestion.vendor);
        setVendorEmail("");
        setVendorPhone("");
        setVendorContactPreference("EMAIL");
        setNotes("");
        setSendEmail(true);
        setSendSms(false);
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        setExpectedDate(defaultDate.toISOString().slice(0, 10));
        setItems([
            {
                productId: suggestion.productId,
                productName: suggestion.productName,
                productSku: suggestion.productSku,
                quantity: suggestion.suggestedReorderQuantity,
                unitPrice: Number(suggestion.unitPrice ?? 0)
            }
        ]);
        setFormError(null);
    }, [open, suggestion]);
    useEffect(() => {
        if (!open) {
            setItems([]);
        }
    }, [open]);
    if (!open || !suggestion) {
        return null;
    }
    const warehouseName = (() => {
        if (mode === "ADMIN") {
            const warehouse = warehouses.find((item) => item.id === suggestion.warehouseId);
            return warehouse ? `${warehouse.name} (${warehouse.locationCode})` : "Selected Warehouse";
        }
        return suggestion.warehouseName;
    })();
    const handleItemChange = (index, key, value) => {
        setItems((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [key]: value };
            return next;
        });
    };
    const handleRemoveItem = (index) => {
        setItems((prev) => prev.filter((_, idx) => idx !== index));
    };
    const handleAddSuggestedItem = (productId) => {
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
    };
    const availableAdditions = availableSuggestions.filter((item) => !items.some((draft) => draft.productId === item.productId));
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const handleSubmit = async (event) => {
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
        const payload = {
            vendorName: vendorName.trim(),
            vendorEmail: vendorEmail.trim() || undefined,
            vendorPhone: vendorPhone.trim() || undefined,
            vendorContactPreference: vendorContactPreference,
            notes: notes.trim() || undefined,
            warehouseId: suggestion.warehouseId,
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
        }
        catch (error) {
            const message = error?.response?.data?.message ?? error?.message ?? "Failed to create purchase order";
            setFormError(message);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4", children: _jsxs("div", { className: "w-full max-w-3xl rounded-2xl bg-white shadow-xl", children: [_jsxs("header", { className: "flex items-start justify-between border-b border-slate-200 px-6 py-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-800", children: "Generate Purchase Order" }), _jsx("p", { className: "text-sm text-slate-500", children: warehouseName })] }), _jsx("button", { type: "button", className: "text-sm text-slate-500 hover:text-slate-800", onClick: onClose, children: "Close" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "max-h-[80vh] overflow-y-auto px-6 py-5", children: [_jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "vendorName", children: "Vendor Name" }), _jsx("input", { id: "vendorName", className: "input", value: vendorName, onChange: (event) => setVendorName(event.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "contactPreference", children: "Preferred Contact" }), _jsxs("select", { id: "contactPreference", className: "input", value: vendorContactPreference, onChange: (event) => setVendorContactPreference(event.target.value), children: [_jsx("option", { value: "EMAIL", children: "Email" }), _jsx("option", { value: "SMS", children: "SMS" }), _jsx("option", { value: "BOTH", children: "Both" })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "vendorEmail", children: "Vendor Email" }), _jsx("input", { id: "vendorEmail", className: "input", placeholder: "vendor@example.com", value: vendorEmail, onChange: (event) => setVendorEmail(event.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "vendorPhone", children: "Vendor Phone" }), _jsx("input", { id: "vendorPhone", className: "input", placeholder: "+91 98765 43210", value: vendorPhone, onChange: (event) => setVendorPhone(event.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "expectedDate", children: "Expected Delivery" }), _jsx("input", { id: "expectedDate", type: "date", className: "input", value: expectedDate, onChange: (event) => setExpectedDate(event.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "notes", children: "Notes" }), _jsx("input", { id: "notes", className: "input", placeholder: "Optional instructions", value: notes, onChange: (event) => setNotes(event.target.value) })] })] }), _jsxs("div", { className: "mt-6 rounded-lg border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2", children: [_jsx("h4", { className: "text-sm font-semibold text-slate-600", children: "Order Items" }), availableAdditions.length > 0 && (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("label", { htmlFor: "addItem", className: "text-xs uppercase text-slate-500", children: "Add Suggested Item" }), _jsxs("select", { id: "addItem", className: "input", defaultValue: "", onChange: (event) => {
                                                        const productId = Number(event.target.value);
                                                        if (productId) {
                                                            handleAddSuggestedItem(productId);
                                                            event.target.value = "";
                                                        }
                                                    }, children: [_jsx("option", { value: "", children: "Select" }), availableAdditions.map((item) => (_jsxs("option", { value: item.productId, children: [item.productName, " \u00B7 Suggest ", item.suggestedReorderQuantity] }, item.productId)))] })] }))] }), _jsxs("div", { className: "divide-y", children: [items.map((item, index) => (_jsxs("div", { className: "grid grid-cols-1 gap-4 px-4 py-3 md:grid-cols-5 md:items-center", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("p", { className: "text-sm font-semibold text-slate-700", children: item.productName }), _jsxs("p", { className: "text-xs text-slate-400", children: ["SKU: ", item.productSku] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", children: "Quantity" }), _jsx("input", { type: "number", min: 1, className: "input", value: item.quantity, onChange: (event) => handleItemChange(index, "quantity", Number(event.target.value)) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", children: "Unit Price" }), _jsx("input", { type: "number", min: 0.01, step: 0.01, className: "input", value: item.unitPrice, onChange: (event) => handleItemChange(index, "unitPrice", Number(event.target.value)) })] }), _jsxs("div", { className: "flex items-center justify-between gap-3 md:justify-end", children: [_jsx("p", { className: "text-sm font-semibold text-slate-600", children: (item.quantity * item.unitPrice).toFixed(2) }), items.length > 1 && (_jsx("button", { type: "button", className: "rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-500", onClick: () => handleRemoveItem(index), children: "Remove" }))] })] }, item.productId))), items.length === 0 && (_jsx("p", { className: "px-4 py-5 text-sm text-slate-500", children: "No items added yet." }))] })] }), _jsxs("div", { className: "mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-600", children: [_jsx("input", { type: "checkbox", className: "h-4 w-4 rounded border-slate-300 text-midnight focus:ring-midnight", checked: sendEmail, onChange: (event) => setSendEmail(event.target.checked) }), "Email vendor"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-600", children: [_jsx("input", { type: "checkbox", className: "h-4 w-4 rounded border-slate-300 text-midnight focus:ring-midnight", checked: sendSms, onChange: (event) => setSendSms(event.target.checked) }), "SMS vendor"] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xs uppercase text-slate-400", children: "Order Total" }), _jsxs("p", { className: "text-xl font-semibold text-slate-800", children: ["\u20B9 ", totalAmount.toFixed(2)] })] })] }), formError && (_jsx("div", { className: "mt-4 rounded-md bg-red-100 px-3 py-2 text-sm text-red-600", children: formError })), _jsxs("div", { className: "mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4", children: [_jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600", onClick: onClose, children: "Cancel" }), _jsx("button", { type: "submit", disabled: submitting, className: "rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70", children: submitting ? "Generating..." : "Create Purchase Order" })] })] })] }) }));
}
