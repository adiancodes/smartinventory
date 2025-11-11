import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct, deleteProduct, fetchProducts, updateProduct } from "../../api/products";
import { fetchWarehouses } from "../../api/warehouses";
const stockStatusOptions = ["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];
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
}).refine((values) => values.maxStockLevel >= values.reorderLevel, {
    message: "Max stock level must be greater than or equal to min stock level",
    path: ["maxStockLevel"]
});
export default function ProductManagement({ mode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        category: "",
        vendor: "",
        stockStatus: "ALL",
        warehouseId: "ALL"
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formError, setFormError] = useState(null);
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
    const currencyFormatter = useMemo(() => new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }), []);
    const createMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            closeModal();
        },
        onError: (error) => {
            setFormError(error.response?.data?.message ?? "Failed to create product");
        }
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateProduct(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            closeModal();
        },
        onError: (error) => {
            setFormError(error.response?.data?.message ?? "Failed to update product");
        }
    });
    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        }
    });
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
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
        }
        else {
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
    const openEditModal = (product) => {
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
    const onSubmit = async (values) => {
        if (mode === "ADMIN" && (!values.warehouseId || Number.isNaN(values.warehouseId))) {
            setFormError("Select the warehouse for this product");
            return;
        }
        if (mode === "MANAGER" && !managerWarehouseId) {
            setFormError("No warehouse assigned. Contact the administrator.");
            return;
        }
        const payload = {
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
        }
        else {
            await createMutation.mutateAsync(payload);
        }
    };
    const handleDelete = async (id) => {
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: mode === "ADMIN" ? (_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-end md:justify-between", children: [_jsxs("div", { className: "grid flex-1 grid-cols-1 gap-4 md:grid-cols-4", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "category-filter", children: "Category" }), _jsx("input", { id: "category-filter", className: "input", placeholder: "All", value: filters.category, onChange: (event) => setFilters((prev) => ({ ...prev, category: event.target.value })) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "vendor-filter", children: "Vendor" }), _jsx("input", { id: "vendor-filter", className: "input", placeholder: "All", value: filters.vendor, onChange: (event) => setFilters((prev) => ({ ...prev, vendor: event.target.value })) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "stock-filter", children: "Stock Status" }), _jsx("select", { id: "stock-filter", className: "input", value: filters.stockStatus, onChange: (event) => setFilters((prev) => ({ ...prev, stockStatus: event.target.value })), children: stockStatusOptions.map((option) => (_jsx("option", { value: option, children: option === "ALL" ? "All" : option.replace("_", " ") }, option))) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "warehouse-filter", children: "Warehouse" }), _jsxs("select", { id: "warehouse-filter", className: "input", value: filters.warehouseId, onChange: (event) => setFilters((prev) => ({ ...prev, warehouseId: event.target.value })), children: [_jsx("option", { value: "ALL", children: "All" }), warehouses.map((warehouse) => (_jsxs("option", { value: warehouse.id, children: [warehouse.name, " (", warehouse.locationCode, ")"] }, warehouse.id)))] })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600", onClick: () => setFilters({ category: "", vendor: "", stockStatus: "ALL", warehouseId: "ALL" }), children: "Reset Filters" }), _jsx("button", { type: "button", className: "rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white", onClick: openCreateModal, children: "Add Product" })] })] })) : (_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-end md:justify-between", children: [_jsxs("div", { className: "flex w-full flex-col gap-1 md:max-w-md", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "manager-search", children: "Search Inventory" }), _jsx("input", { id: "manager-search", className: "input", placeholder: "Search my store by name, SKU...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] }), _jsx("button", { type: "button", className: "rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white", onClick: openCreateModal, children: "Add New Product" })] })) }), _jsxs("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: [!hasManagerWarehouse && (_jsx("p", { className: "text-sm text-red-500", children: "Your account is not attached to a warehouse. Contact the administrator." })), hasManagerWarehouse && isLoadingProducts && _jsx("p", { children: "Loading products..." }), hasManagerWarehouse && productsQuery.isError && (_jsx("p", { className: "text-sm text-red-500", children: "Unable to load products." })), hasManagerWarehouse && noProductsAvailable && (_jsx("p", { className: "text-sm text-slate-500", children: mode === "ADMIN" ? "No products found for the selected filters." : "No products in your store yet." })), hasManagerWarehouse && noSearchResults && (_jsx("p", { className: "text-sm text-slate-500", children: "No products match your search." })), hasManagerWarehouse && displayProducts.length > 0 && (_jsx("div", { className: "overflow-x-auto", children: mode === "MANAGER" ? (_jsxs("table", { className: "w-full table-auto text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500", children: [_jsx("th", { className: "px-4 py-2", children: "Product" }), _jsx("th", { className: "px-4 py-2", children: "SKU" }), _jsx("th", { className: "px-4 py-2", children: "Category" }), _jsx("th", { className: "px-4 py-2", children: "Quantity" }), _jsx("th", { className: "px-4 py-2", children: "Status" }), _jsx("th", { className: "px-4 py-2", children: "Price (\u20B9)" }), _jsx("th", { className: "px-4 py-2", children: "Auto-Restock" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Actions" })] }) }), _jsx("tbody", { children: displayProducts.map((product) => {
                                        const outOfStock = product.currentStock === 0;
                                        const lowStock = !outOfStock && product.lowStock;
                                        const statusLabel = outOfStock ? "Out of Stock" : lowStock ? "Low Stock" : "In Stock";
                                        const statusClass = outOfStock
                                            ? "bg-red-100 text-red-600"
                                            : lowStock
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-emerald-100 text-emerald-700";
                                        return (_jsxs("tr", { className: "border-b last:border-none", children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-800", children: product.name }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: product.sku }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: product.category }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: product.currentStock }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`, children: statusLabel }) }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: currencyFormatter.format(product.price ?? 0) }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: product.autoRestockEnabled ? "Enabled" : "Disabled" }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600", onClick: () => openEditModal(product), children: "Edit" }), _jsx("button", { type: "button", className: "rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600", onClick: () => handleDelete(product.id), children: "Delete" })] }) })] }, product.id));
                                    }) })] })) : (_jsxs("table", { className: "w-full table-auto text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500", children: [_jsx("th", { className: "px-4 py-2", children: "Product" }), _jsx("th", { className: "px-4 py-2", children: "SKU" }), _jsx("th", { className: "px-4 py-2", children: "Category" }), _jsx("th", { className: "px-4 py-2", children: "Vendor" }), _jsx("th", { className: "px-4 py-2", children: "Current Stock" }), _jsx("th", { className: "px-4 py-2", children: "Reorder Level" }), _jsx("th", { className: "px-4 py-2", children: "Unit Price" }), _jsx("th", { className: "px-4 py-2", children: "Total Value" }), _jsx("th", { className: "px-4 py-2", children: "Status" }), _jsx("th", { className: "px-4 py-2", children: "Warehouse" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Actions" })] }) }), _jsx("tbody", { children: displayProducts.map((product) => {
                                        const outOfStock = product.currentStock === 0;
                                        const lowStock = !outOfStock && product.lowStock;
                                        const statusLabel = outOfStock ? "Out of Stock" : lowStock ? "Low Stock" : "Healthy";
                                        const statusClass = outOfStock
                                            ? "bg-red-100 text-red-600"
                                            : lowStock
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-emerald-100 text-emerald-700";
                                        return (_jsxs("tr", { className: "border-b last:border-none", children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-800", children: product.name }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: product.sku }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: product.category }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: product.vendor }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: product.currentStock }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: product.reorderLevel }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: currencyFormatter.format(product.price ?? 0) }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: currencyFormatter.format(product.totalValue ?? 0) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`, children: statusLabel }) }), _jsxs("td", { className: "px-4 py-3 text-slate-600", children: [product.warehouseName, _jsx("span", { className: "ml-2 text-xs text-slate-400", children: product.warehouseCode })] }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600", onClick: () => openEditModal(product), children: "Edit" }), _jsx("button", { type: "button", className: "rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600", onClick: () => handleDelete(product.id), children: "Delete" })] }) })] }, product.id));
                                    }) })] })) }))] }), isModalOpen && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4", children: _jsxs("div", { className: "w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-800", children: formTitle }), _jsx("button", { type: "button", className: "text-sm text-slate-500 hover:text-slate-800", onClick: closeModal, children: "Close" })] }), _jsxs("form", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "name", children: "Product Name" }), _jsx("input", { id: "name", className: "input", ...register("name") }), errors.name && _jsx("span", { className: "text-xs text-red-500", children: errors.name.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "sku", children: "SKU (Product ID)" }), _jsx("input", { id: "sku", className: "input", ...register("sku") }), errors.sku && _jsx("span", { className: "text-xs text-red-500", children: errors.sku.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "category", children: "Category" }), _jsx("input", { id: "category", className: "input", ...register("category") }), errors.category && _jsx("span", { className: "text-xs text-red-500", children: errors.category.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "vendor", children: "Supplier" }), _jsx("input", { id: "vendor", className: "input", ...register("vendor") }), errors.vendor && _jsx("span", { className: "text-xs text-red-500", children: errors.vendor.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "currentStock", children: "Current Quantity" }), _jsx("input", { id: "currentStock", type: "number", className: "input", ...register("currentStock") }), errors.currentStock && _jsx("span", { className: "text-xs text-red-500", children: errors.currentStock.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "price", children: "Price (\u20B9)" }), _jsx("input", { id: "price", type: "number", step: "0.01", className: "input", ...register("price") }), errors.price && _jsx("span", { className: "text-xs text-red-500", children: errors.price.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "reorderLevel", children: "Min Stock Level" }), _jsx("input", { id: "reorderLevel", type: "number", className: "input", ...register("reorderLevel") }), errors.reorderLevel && _jsx("span", { className: "text-xs text-red-500", children: errors.reorderLevel.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "maxStockLevel", children: "Max Stock Level" }), _jsx("input", { id: "maxStockLevel", type: "number", className: "input", ...register("maxStockLevel") }), errors.maxStockLevel && _jsx("span", { className: "text-xs text-red-500", children: errors.maxStockLevel.message })] }), mode === "ADMIN" && (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "warehouseId", children: "Warehouse" }), _jsxs("select", { id: "warehouseId", className: "input", disabled: isLoadingWarehouses, ...register("warehouseId", {
                                                setValueAs: (value) => (value === "" ? undefined : Number(value))
                                            }), children: [_jsx("option", { value: "", children: "Select" }), warehouses.map((warehouse) => (_jsxs("option", { value: warehouse.id, children: [warehouse.name, " (", warehouse.locationCode, ")"] }, warehouse.id)))] }), errors.warehouseId && _jsx("span", { className: "text-xs text-red-500", children: errors.warehouseId.message })] })), _jsxs("div", { className: "col-span-full flex items-center gap-2 pt-2", children: [_jsx("input", { id: "autoRestockEnabled", type: "checkbox", className: "h-4 w-4 rounded border-slate-300 text-midnight focus:ring-midnight", ...register("autoRestockEnabled") }), _jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "autoRestockEnabled", children: "Enable Auto-Restock" })] }), formError && (_jsx("div", { className: "col-span-full rounded-md bg-red-100 px-3 py-2 text-sm text-red-600", children: formError })), _jsxs("div", { className: "col-span-full mt-2 flex justify-end gap-3", children: [_jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600", onClick: closeModal, children: "Cancel" }), _jsx("button", { type: "submit", disabled: isSubmitting || createMutation.isPending || updateMutation.isPending, className: "rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70", children: isSubmitting || createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Product" })] })] })] }) }))] }));
}
