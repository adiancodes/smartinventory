import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../hooks/useAuth";
import { fetchProducts } from "../../api/products";
import { fetchUserAddresses, updateUserAddresses } from "../../api/addresses";
import { fetchUserPurchaseHistory, purchaseProduct } from "../../api/purchases";
const stockStatusOptions = ["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];
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
export default function UserDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeSection, setActiveSection] = useState("HOME");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [purchaseQuantity, setPurchaseQuantity] = useState(1);
    const [purchaseError, setPurchaseError] = useState(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState(null);
    const [addressFeedback, setAddressFeedback] = useState(null);
    const [addressErrorMessage, setAddressErrorMessage] = useState(null);
    const [filters, setFilters] = useState({ category: "", vendor: "", stockStatus: "ALL" });
    const currencyFormatter = useMemo(() => new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }), []);
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
        return products.filter((product) => [product.name, product.sku, product.category, product.vendor]
            .some((value) => value?.toLowerCase().includes(normalizedTerm)));
    }, [products, searchTerm]);
    const newArrivals = useMemo(() => {
        return [...products]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [products]);
    const addressesQuery = useQuery({
        queryKey: ["user", "addresses"],
        queryFn: fetchUserAddresses
    });
    const purchaseHistoryQuery = useQuery({
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
            const axiosError = error;
            setAddressFeedback(null);
            setAddressErrorMessage(axiosError.response?.data?.message ?? "Failed to save addresses");
        }
    });
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
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
        }
        catch (error) {
            const axiosError = error;
            setPurchaseError(axiosError.response?.data?.message ?? "Unable to complete purchase right now");
        }
    };
    const onSubmitAddresses = async (values) => {
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
    return (_jsxs("div", { className: "flex min-h-screen bg-ash lg:h-screen", children: [_jsxs("aside", { className: "flex w-72 flex-col bg-white shadow-xl lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:overflow-y-auto", children: [_jsxs("div", { className: "border-b px-6 py-6", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-400", children: "Welcome" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-slate-800", children: user?.fullName ?? "User" }), _jsx("p", { className: "text-sm text-slate-500", children: user?.email })] }), _jsx("nav", { className: "flex-1 px-4 py-6", children: [{ key: "HOME", label: "Home" }, { key: "DASHBOARD", label: "Dashboard" }, { key: "ADDRESS", label: "Addresses" }].map((item) => {
                            const isActive = activeSection === item.key;
                            return (_jsx("button", { type: "button", className: `mb-2 w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${isActive ? "bg-midnight text-white" : "text-slate-600 hover:bg-slate-100"}`, onClick: () => setActiveSection(item.key), children: item.label }, item.key));
                        }) }), _jsx("div", { className: "border-t px-4 py-6", children: _jsx("button", { type: "button", className: "w-full rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50", onClick: handleLogout, children: "Logout" }) })] }), _jsxs("main", { className: "flex-1 px-8 py-10 lg:h-screen lg:overflow-y-auto", children: [activeSection === "HOME" && (_jsxs("div", { className: "space-y-8", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "Account Overview" }), _jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Review your profile details and purchase history at a glance." })] }), _jsxs("section", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl bg-white p-6 shadow-sm", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: "Profile" }), _jsxs("dl", { className: "mt-4 space-y-3 text-sm text-slate-600", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase text-slate-400", children: "Full Name" }), _jsx("dd", { className: "text-base font-semibold text-slate-800", children: user?.fullName ?? "--" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase text-slate-400", children: "Email" }), _jsx("dd", { children: user?.email ?? "--" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase text-slate-400", children: "Contact" }), _jsx("dd", { children: user?.contactNumber ?? "Not provided" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase text-slate-400", children: "Company" }), _jsx("dd", { children: user?.companyName ?? "Not provided" })] })] })] }), _jsxs("div", { className: "rounded-2xl bg-white p-6 shadow-sm", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500", children: "Shipping Address" }), addressesQuery.isLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "Loading address..." })) : (_jsxs("div", { className: "mt-4 text-sm text-slate-600", children: [addressesQuery.data?.delivery ? (_jsxs("address", { className: "not-italic", children: [_jsx("p", { className: "font-semibold text-slate-800", children: "Delivery" }), _jsx("p", { children: addressesQuery.data.delivery.line1 }), addressesQuery.data.delivery.line2 && _jsx("p", { children: addressesQuery.data.delivery.line2 }), _jsx("p", { children: `${addressesQuery.data.delivery.city}, ${addressesQuery.data.delivery.state}` }), _jsx("p", { children: `${addressesQuery.data.delivery.postalCode}, ${addressesQuery.data.delivery.country}` })] })) : (_jsx("p", { className: "text-sm text-slate-500", children: "No delivery address saved yet." })), _jsxs("div", { className: "mt-6", children: [_jsx("p", { className: "font-semibold text-slate-800", children: "Billing" }), addressesQuery.data?.billing ? (_jsxs("address", { className: "mt-2 not-italic", children: [_jsx("p", { children: addressesQuery.data.billing.line1 }), addressesQuery.data.billing.line2 && _jsx("p", { children: addressesQuery.data.billing.line2 }), _jsx("p", { children: `${addressesQuery.data.billing.city}, ${addressesQuery.data.billing.state}` }), _jsx("p", { children: `${addressesQuery.data.billing.postalCode}, ${addressesQuery.data.billing.country}` })] })) : (_jsx("p", { className: "text-sm text-slate-500", children: "No billing address saved yet." }))] })] }))] })] }), _jsxs("section", { className: "rounded-2xl bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "Purchase History" }), _jsx("p", { className: "text-sm text-slate-500", children: "Track every item you've ordered." })] }), _jsxs("div", { className: "rounded-lg bg-midnight px-4 py-2 text-sm font-semibold text-white", children: ["Total Spend: ", currencyFormatter.format(totalSpend ?? 0)] })] }), purchaseHistoryQuery.isLoading && _jsx("p", { className: "mt-6 text-sm text-slate-500", children: "Loading history..." }), !purchaseHistoryQuery.isLoading && purchaseHistory.length === 0 && (_jsx("p", { className: "mt-6 text-sm text-slate-500", children: "No purchases yet. Explore the catalog to place your first order." })), purchaseHistory.length > 0 && (_jsx("div", { className: "mt-6 overflow-x-auto", children: _jsxs("table", { className: "w-full table-auto text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500", children: [_jsx("th", { className: "px-4 py-2", children: "Product" }), _jsx("th", { className: "px-4 py-2", children: "SKU" }), _jsx("th", { className: "px-4 py-2", children: "Quantity" }), _jsx("th", { className: "px-4 py-2", children: "Total Paid" }), _jsx("th", { className: "px-4 py-2", children: "Purchased At" })] }) }), _jsx("tbody", { children: purchaseHistory.map((purchase) => (_jsxs("tr", { className: "border-b last:border-none", children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-800", children: purchase.productName }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: purchase.productSku }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: purchase.quantity }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: currencyFormatter.format(purchase.totalPrice) }), _jsx("td", { className: "px-4 py-3 text-slate-500", children: new Date(purchase.purchasedAt).toLocaleString() })] }, purchase.id))) })] }) }))] })] })), activeSection === "DASHBOARD" && (_jsxs("div", { className: "space-y-8", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "Browse Products" }), _jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Search across every warehouse, filter items, and place quick orders." })] }), purchaseSuccess && (_jsx("div", { className: "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700", children: purchaseSuccess })), _jsxs("section", { className: "rounded-2xl bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "flex w-full flex-col gap-1 lg:max-w-md", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "catalog-search", children: "Search" }), _jsx("input", { id: "catalog-search", className: "input", placeholder: "Search by product, SKU, category, vendor", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] }), _jsxs("div", { className: "grid w-full grid-cols-1 gap-3 md:grid-cols-3 lg:max-w-xl", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "category-filter", children: "Category" }), _jsx("input", { id: "category-filter", className: "input", placeholder: "All", value: filters.category, onChange: (event) => setFilters((prev) => ({ ...prev, category: event.target.value })) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "vendor-filter", children: "Vendor" }), _jsx("input", { id: "vendor-filter", className: "input", placeholder: "All", value: filters.vendor, onChange: (event) => setFilters((prev) => ({ ...prev, vendor: event.target.value })) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: "stock-filter", children: "Stock" }), _jsx("select", { id: "stock-filter", className: "input", value: filters.stockStatus, onChange: (event) => setFilters((prev) => ({ ...prev, stockStatus: event.target.value })), children: stockStatusOptions.map((option) => (_jsx("option", { value: option, children: option === "ALL" ? "All" : option.replace("_", " ") }, option))) })] })] })] }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx("button", { type: "button", className: "text-sm font-semibold text-slate-500 hover:text-slate-800", onClick: () => setFilters({ category: "", vendor: "", stockStatus: "ALL" }), children: "Reset filters" }) })] }), _jsxs("section", { className: "rounded-2xl bg-white p-6 shadow-sm", children: [productsQuery.isLoading && _jsx("p", { className: "text-sm text-slate-500", children: "Loading catalog..." }), productsQuery.isError && (_jsx("p", { className: "text-sm text-red-500", children: "Unable to load products right now. Please try again later." })), !productsQuery.isLoading && filteredProducts.length === 0 && (_jsx("p", { className: "text-sm text-slate-500", children: "No products match your search filters." })), _jsx("div", { className: "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3", children: filteredProducts.map((product) => (_jsxs("button", { type: "button", className: "rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg", onClick: () => {
                                                setSelectedProduct(product);
                                                setPurchaseSuccess(null);
                                            }, children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-400", children: product.category }), _jsx("h3", { className: "mt-2 text-lg font-semibold text-slate-800", children: product.name }), _jsxs("p", { className: "text-sm text-slate-500", children: ["SKU: ", product.sku] }), _jsx("p", { className: "mt-3 text-base font-semibold text-midnight", children: currencyFormatter.format(product.price ?? 0) }), _jsxs("div", { className: "mt-4 flex items-center justify-between text-xs text-slate-500", children: [_jsxs("span", { children: ["Stock: ", product.currentStock] }), _jsxs("span", { children: [product.warehouseName, _jsx("span", { className: "ml-1 text-slate-400", children: product.warehouseCode })] })] })] }, product.id))) })] }), _jsxs("section", { className: "rounded-2xl bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "New Arrivals" }), _jsx("span", { className: "text-xs uppercase text-slate-400", children: "Latest additions" })] }), newArrivals.length === 0 ? (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "No recent products yet." })) : (_jsx("div", { className: "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: newArrivals.map((product) => (_jsxs("div", { className: "rounded-xl border border-slate-200 p-4", children: [_jsx("p", { className: "text-xs uppercase text-slate-400", children: product.category }), _jsx("p", { className: "mt-1 text-base font-semibold text-slate-800", children: product.name }), _jsxs("p", { className: "mt-2 text-sm text-slate-500", children: ["From ", product.vendor] }), _jsx("p", { className: "mt-3 text-sm font-semibold text-midnight", children: currencyFormatter.format(product.price ?? 0) })] }, product.id))) }))] })] })), activeSection === "ADDRESS" && (_jsxs("div", { className: "space-y-8", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "Manage Addresses" }), _jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Update your delivery and billing information used during checkout." })] }), _jsxs("section", { className: "rounded-2xl bg-white p-6 shadow-sm", children: [addressFeedback && (_jsx("div", { className: "mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700", children: addressFeedback })), addressErrorMessage && (_jsx("div", { className: "mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600", children: addressErrorMessage })), _jsxs("form", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", onSubmit: handleSubmit(onSubmitAddresses), children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "Delivery Address" }), _jsx(AddressFields, { prefix: "delivery", register: register, errors: errors.delivery })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "Billing Address" }), _jsx(AddressFields, { prefix: "billing", register: register, errors: errors.billing })] }), _jsxs("div", { className: "col-span-full flex justify-end gap-3", children: [_jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600", onClick: () => addressesQuery.refetch(), children: "Reset" }), _jsx("button", { type: "submit", disabled: addressSectionBusy, className: "rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70", children: addressSectionBusy ? "Saving..." : "Save Addresses" })] })] })] })] }))] }), selectedProduct && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4", children: _jsxs("div", { className: "w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-800", children: selectedProduct.name }), _jsxs("p", { className: "text-sm text-slate-500", children: [selectedProduct.category, " \u00B7 SKU ", selectedProduct.sku] })] }), _jsx("button", { type: "button", className: "text-sm font-semibold text-slate-500 hover:text-slate-800", onClick: closeProductModal, children: "Close" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("p", { className: "text-sm text-slate-600", children: ["Vendor: ", selectedProduct.vendor] }), _jsxs("p", { className: "text-sm text-slate-600", children: ["Warehouse: ", selectedProduct.warehouseName, _jsx("span", { className: "ml-2 text-xs uppercase text-slate-400", children: selectedProduct.warehouseCode })] }), _jsx("p", { className: "text-lg font-semibold text-midnight", children: currencyFormatter.format(selectedProduct.price ?? 0) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700", htmlFor: "purchase-quantity", children: "Quantity" }), _jsx("input", { id: "purchase-quantity", type: "number", min: 1, max: selectedProduct.currentStock, value: purchaseQuantity, onChange: (event) => setPurchaseQuantity(Number(event.target.value)), className: "w-24 rounded-md border border-slate-300 px-3 py-2 text-sm" }), _jsxs("span", { className: "text-xs text-slate-500", children: ["In stock: ", selectedProduct.currentStock] })] }), purchaseError && _jsx("p", { className: "text-sm text-red-500", children: purchaseError }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { type: "button", className: "rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600", onClick: closeProductModal, children: "Cancel" }), _jsx("button", { type: "button", className: "rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70", disabled: purchaseMutation.isPending, onClick: onPurchase, children: purchaseMutation.isPending ? "Processing..." : "Buy Now" })] })] })] }) }))] }));
}
function AddressFields({ prefix, register, errors }) {
    const makeField = (field) => `${prefix}.${field}`;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: `${prefix}.line1`, children: "Address Line 1" }), _jsx("input", { id: `${prefix}.line1`, className: "input", ...register(makeField("line1")) }), errors?.line1 && _jsx("span", { className: "text-xs text-red-500", children: errors.line1.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: `${prefix}.line2`, children: "Address Line 2" }), _jsx("input", { id: `${prefix}.line2`, className: "input", ...register(makeField("line2")) }), errors?.line2 && _jsx("span", { className: "text-xs text-red-500", children: errors.line2.message })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: `${prefix}.city`, children: "City" }), _jsx("input", { id: `${prefix}.city`, className: "input", ...register(makeField("city")) }), errors?.city && _jsx("span", { className: "text-xs text-red-500", children: errors.city.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: `${prefix}.state`, children: "State" }), _jsx("input", { id: `${prefix}.state`, className: "input", ...register(makeField("state")) }), errors?.state && _jsx("span", { className: "text-xs text-red-500", children: errors.state.message })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: `${prefix}.postalCode`, children: "Postal Code" }), _jsx("input", { id: `${prefix}.postalCode`, className: "input", ...register(makeField("postalCode")) }), errors?.postalCode && _jsx("span", { className: "text-xs text-red-500", children: errors.postalCode.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500", htmlFor: `${prefix}.country`, children: "Country" }), _jsx("input", { id: `${prefix}.country`, className: "input", ...register(makeField("country")) }), errors?.country && _jsx("span", { className: "text-xs text-red-500", children: errors.country.message })] })] })] }));
}
