import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../hooks/useAuth";
import { fetchProducts } from "../../api/products";
import { fetchUserAddresses, updateUserAddresses } from "../../api/addresses";
import { fetchUserPurchaseHistory, purchaseProduct } from "../../api/purchases";
import TopNavbar from "../../components/layout/TopNavbar";
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
    const location = useLocation();
    const queryClient = useQueryClient();
    const [activeSection, setActiveSection] = useState("HOME");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [purchaseQuantity, setPurchaseQuantity] = useState(1);
    const [purchaseError, setPurchaseError] = useState(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState(null);
    const [reorderStatus, setReorderStatus] = useState(null);
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
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sectionParam = params.get("section");
        let nextSection = "HOME";
        if (sectionParam === "browse") {
            nextSection = "BROWSE";
        }
        else if (sectionParam === "addresses") {
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
    const totalItemsPurchased = useMemo(() => purchaseHistory.reduce((sum, purchase) => sum + purchase.quantity, 0), [purchaseHistory]);
    const lastPurchase = useMemo(() => {
        if (purchaseHistory.length === 0) {
            return null;
        }
        return [...purchaseHistory].sort((first, second) => new Date(second.purchasedAt).getTime() - new Date(first.purchasedAt).getTime())[0];
    }, [purchaseHistory]);
    const lastPurchaseTimestamp = useMemo(() => (lastPurchase ? new Date(lastPurchase.purchasedAt).toLocaleString() : null), [lastPurchase]);
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
        }
        catch (error) {
            const axiosError = error;
            setReorderStatus({
                type: "error",
                message: axiosError.response?.data?.message ?? "Unable to reorder right now"
            });
        }
    }, [lastPurchase, purchaseMutation]);
    const userNavLinks = useMemo(() => [
        { label: "Home", to: "/user/dashboard", isActive: activeSection === "HOME" },
        { label: "Browse Products", to: "/user/dashboard?section=browse", isActive: activeSection === "BROWSE" },
        { label: "Addresses", to: "/user/dashboard?section=addresses", isActive: activeSection === "ADDRESS" },
        { label: "My Purchases", to: "/user/purchases" },
        { label: "Logout", onClick: handleLogout, variant: "danger" }
    ], [activeSection, handleLogout]);
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950", children: [_jsx(TopNavbar, { className: "py-4", showAuthCTA: false, navLinks: userNavLinks }), _jsxs("main", { className: "flex w-full flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8", children: [_jsx("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: _jsx("div", { className: "flex flex-col gap-2", children: _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Welcome back" }), _jsx("h1", { className: "mt-2 text-2xl font-semibold text-midnight dark:text-white", children: user?.fullName ?? "User" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: user?.email })] }) }) }), activeSection === "HOME" && (_jsxs("div", { className: "space-y-8", children: [_jsxs("header", { className: "space-y-2", children: [_jsx("h2", { className: "text-3xl font-semibold text-midnight dark:text-white", children: "Account Overview" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: "Review your profile details and purchase history at a glance." })] }), reorderStatus && (_jsx("div", { className: `rounded-2xl border px-4 py-3 text-sm font-medium transition ${reorderStatus.type === "success"
                                    ? "border-emerald-300/60 bg-emerald-100/60 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200"
                                    : "border-red-300/70 bg-red-100/70 text-red-600 dark:border-red-400/60 dark:bg-red-500/20 dark:text-red-200"}`, children: reorderStatus.message })), _jsx("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", children: [_jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Total Money Spent" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-midnight dark:text-white", children: purchaseHistoryQuery.isLoading ? "..." : currencyFormatter.format(totalSpend ?? 0) })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Total Items Bought" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-midnight dark:text-white", children: purchaseHistoryQuery.isLoading ? "..." : totalItemsPurchased.toLocaleString() })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Last Item Bought" }), purchaseHistoryQuery.isLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-500 dark:text-slate-400", children: "Loading recent purchase..." })) : lastPurchase ? (_jsxs("div", { className: "mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300", children: [_jsxs("div", { children: [_jsx("p", { className: "text-base font-semibold text-midnight dark:text-white", children: lastPurchase.productName }), _jsxs("p", { className: "text-xs uppercase text-slate-400 dark:text-slate-500", children: ["Qty ", lastPurchase.quantity] })] }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: lastPurchaseTimestamp })] })) : (_jsx("p", { className: "mt-4 text-sm text-slate-500 dark:text-slate-400", children: "No purchases recorded yet." }))] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Reorder Last Item" }), purchaseHistoryQuery.isLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-500 dark:text-slate-400", children: "Loading recent purchase..." })) : lastPurchase ? (_jsxs("div", { className: "mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300", children: [_jsxs("div", { children: [_jsx("p", { className: "text-base font-semibold text-midnight dark:text-white", children: lastPurchase.productName }), _jsxs("p", { className: "mt-1 text-xs uppercase text-slate-400 dark:text-slate-500", children: ["Qty ", lastPurchase.quantity, " \u00B7 ", currencyFormatter.format(lastPurchase.totalPrice)] })] }), _jsx("button", { type: "button", className: "w-full rounded-full bg-midnight px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300", onClick: handleReorderLast, disabled: purchaseMutation.isPending, children: purchaseMutation.isPending ? "Processing..." : "Order Again" })] })) : (_jsx("p", { className: "mt-4 text-sm text-slate-500 dark:text-slate-400", children: "Place an order to enable quick reorders." }))] })] }) }), _jsx("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Profile" }), _jsxs("dl", { className: "mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase text-slate-400 dark:text-slate-500", children: "Full Name" }), _jsx("dd", { className: "text-base font-semibold text-midnight dark:text-white", children: user?.fullName ?? "--" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase text-slate-400 dark:text-slate-500", children: "Email" }), _jsx("dd", { children: user?.email ?? "--" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase text-slate-400 dark:text-slate-500", children: "Contact" }), _jsx("dd", { children: user?.contactNumber ?? "Not provided" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase text-slate-400 dark:text-slate-500", children: "Company" }), _jsx("dd", { children: user?.companyName ?? "Not provided" })] })] })] }), _jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-sky-200/20 transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", children: "Shipping Address" }), addressesQuery.isLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-500 dark:text-slate-400", children: "Loading address..." })) : (_jsxs("div", { className: "mt-4 space-y-6 text-sm text-slate-600 dark:text-slate-300", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-midnight dark:text-white", children: "Delivery" }), addressesQuery.data?.delivery ? (_jsxs("address", { className: "mt-1 space-y-1 not-italic", children: [_jsx("p", { children: addressesQuery.data.delivery.line1 }), addressesQuery.data.delivery.line2 && _jsx("p", { children: addressesQuery.data.delivery.line2 }), _jsx("p", { children: `${addressesQuery.data.delivery.city}, ${addressesQuery.data.delivery.state}` }), _jsx("p", { children: `${addressesQuery.data.delivery.postalCode}, ${addressesQuery.data.delivery.country}` })] })) : (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "No delivery address saved yet." }))] }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-midnight dark:text-white", children: "Billing" }), addressesQuery.data?.billing ? (_jsxs("address", { className: "mt-1 space-y-1 not-italic", children: [_jsx("p", { children: addressesQuery.data.billing.line1 }), addressesQuery.data.billing.line2 && _jsx("p", { children: addressesQuery.data.billing.line2 }), _jsx("p", { children: `${addressesQuery.data.billing.city}, ${addressesQuery.data.billing.state}` }), _jsx("p", { children: `${addressesQuery.data.billing.postalCode}, ${addressesQuery.data.billing.country}` })] })) : (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "No billing address saved yet." }))] })] }))] })] }) })] })), activeSection === "BROWSE" && (_jsxs("div", { className: "space-y-8", children: [_jsxs("header", { className: "space-y-2", children: [_jsx("h2", { className: "text-3xl font-semibold text-midnight dark:text-white", children: "Browse Products" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: "Search across every warehouse, filter items, and place quick orders." })] }), purchaseSuccess && (_jsx("div", { className: "rounded-2xl border border-emerald-300/60 bg-emerald-100/60 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200", children: purchaseSuccess })), _jsxs("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: [_jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "flex w-full flex-col gap-1 lg:max-w-md", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: "catalog-search", children: "Search" }), _jsx("input", { id: "catalog-search", className: "input", placeholder: "Search by product, SKU, category, vendor", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] }), _jsxs("div", { className: "grid w-full grid-cols-1 gap-3 md:grid-cols-3 lg:max-w-xl", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: "category-filter", children: "Category" }), _jsx("input", { id: "category-filter", className: "input", placeholder: "All", value: filters.category, onChange: (event) => setFilters((prev) => ({ ...prev, category: event.target.value })) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: "vendor-filter", children: "Vendor" }), _jsx("input", { id: "vendor-filter", className: "input", placeholder: "All", value: filters.vendor, onChange: (event) => setFilters((prev) => ({ ...prev, vendor: event.target.value })) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: "stock-filter", children: "Stock" }), _jsx("select", { id: "stock-filter", className: "input", value: filters.stockStatus, onChange: (event) => setFilters((prev) => ({ ...prev, stockStatus: event.target.value })), children: stockStatusOptions.map((option) => (_jsx("option", { value: option, children: option === "ALL" ? "All" : option.replace("_", " ") }, option))) })] })] })] }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx("button", { type: "button", className: "rounded-full border border-white/50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-midnight dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60", onClick: () => setFilters({ category: "", vendor: "", stockStatus: "ALL" }), children: "Reset filters" }) })] }), _jsxs("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: [productsQuery.isLoading && _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Loading catalog..." }), productsQuery.isError && (_jsx("p", { className: "text-sm text-red-500", children: "Unable to load products right now. Please try again later." })), !productsQuery.isLoading && filteredProducts.length === 0 && (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "No products match your search filters." })), _jsx("div", { className: "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3", children: filteredProducts.map((product) => (_jsxs("button", { type: "button", className: "rounded-2xl border border-white/40 bg-white/75 p-5 text-left shadow-lg shadow-sky-200/20 transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:bg-slate-900/80", onClick: () => {
                                                setSelectedProduct(product);
                                                setPurchaseSuccess(null);
                                            }, children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-400 dark:text-slate-500", children: product.category }), _jsx("h3", { className: "mt-2 text-lg font-semibold text-midnight dark:text-white", children: product.name }), _jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-300", children: ["SKU: ", product.sku] }), _jsx("p", { className: "mt-3 text-base font-semibold text-midnight dark:text-amber-300", children: currencyFormatter.format(product.price ?? 0) }), _jsxs("div", { className: "mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-300", children: [_jsxs("span", { children: ["Stock: ", product.currentStock] }), _jsxs("span", { children: [product.warehouseName, _jsx("span", { className: "ml-1 text-slate-400 dark:text-slate-500", children: product.warehouseCode })] })] })] }, product.id))) })] }), _jsxs("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-midnight dark:text-white", children: "New Arrivals" }), _jsx("span", { className: "text-xs uppercase text-slate-400 dark:text-slate-500", children: "Latest additions" })] }), newArrivals.length === 0 ? (_jsx("p", { className: "mt-4 text-sm text-slate-500 dark:text-slate-400", children: "No recent products yet." })) : (_jsx("div", { className: "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: newArrivals.map((product) => (_jsxs("div", { className: "rounded-2xl border border-white/40 bg-white/75 p-4 shadow-lg shadow-sky-200/20 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/30", children: [_jsx("p", { className: "text-xs uppercase text-slate-400 dark:text-slate-500", children: product.category }), _jsx("p", { className: "mt-1 text-base font-semibold text-midnight dark:text-white", children: product.name }), _jsxs("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-300", children: ["From ", product.vendor] }), _jsx("p", { className: "mt-3 text-sm font-semibold text-midnight dark:text-amber-300", children: currencyFormatter.format(product.price ?? 0) })] }, product.id))) }))] })] })), activeSection === "ADDRESS" && (_jsxs("div", { className: "space-y-8", children: [_jsxs("header", { className: "space-y-2", children: [_jsx("h2", { className: "text-3xl font-semibold text-midnight dark:text-white", children: "Manage Addresses" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: "Update your delivery and billing information used during checkout." })] }), _jsxs("section", { className: "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40", children: [addressFeedback && (_jsx("div", { className: "mb-4 rounded-2xl border border-emerald-300/60 bg-emerald-100/60 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200", children: addressFeedback })), addressErrorMessage && (_jsx("div", { className: "mb-4 rounded-2xl border border-red-300/70 bg-red-100/70 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-400/60 dark:bg-red-500/20 dark:text-red-200", children: addressErrorMessage })), _jsxs("form", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", onSubmit: handleSubmit(onSubmitAddresses), children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold text-midnight dark:text-white", children: "Delivery Address" }), _jsx(AddressFields, { prefix: "delivery", register: register, errors: errors.delivery })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold text-midnight dark:text-white", children: "Billing Address" }), _jsx(AddressFields, { prefix: "billing", register: register, errors: errors.billing })] }), _jsxs("div", { className: "col-span-full flex justify-end gap-3", children: [_jsx("button", { type: "button", className: "rounded-full border border-white/60 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-midnight dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60", onClick: () => addressesQuery.refetch(), children: "Reset" }), _jsx("button", { type: "submit", disabled: addressSectionBusy, className: "rounded-full bg-midnight px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300", children: addressSectionBusy ? "Saving..." : "Save Addresses" })] })] })] })] }))] }), selectedProduct && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm", children: _jsxs("div", { className: "w-full max-w-lg rounded-3xl border border-white/30 bg-white/95 p-8 shadow-2xl transition dark:border-slate-700/60 dark:bg-slate-900/90", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-midnight dark:text-white", children: selectedProduct.name }), _jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-300", children: [selectedProduct.category, " \u00B7 SKU ", selectedProduct.sku] })] }), _jsx("button", { type: "button", className: "rounded-full border border-transparent px-3 py-1 text-sm text-slate-500 transition hover:border-slate-200 hover:text-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white", onClick: closeProductModal, children: "Close" })] }), _jsxs("div", { className: "space-y-4 text-sm text-slate-600 dark:text-slate-300", children: [_jsxs("p", { children: ["Vendor: ", selectedProduct.vendor] }), _jsxs("p", { children: ["Warehouse: ", selectedProduct.warehouseName, _jsx("span", { className: "ml-2 text-xs uppercase text-slate-400 dark:text-slate-500", children: selectedProduct.warehouseCode })] }), _jsx("p", { className: "text-lg font-semibold text-midnight dark:text-amber-300", children: currencyFormatter.format(selectedProduct.price ?? 0) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200", htmlFor: "purchase-quantity", children: "Quantity" }), _jsx("input", { id: "purchase-quantity", type: "number", min: 1, max: selectedProduct.currentStock, value: purchaseQuantity, onChange: (event) => setPurchaseQuantity(Number(event.target.value)), className: "w-24 rounded-md border border-slate-300/80 bg-white/80 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/60" }), _jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["In stock: ", selectedProduct.currentStock] })] }), purchaseError && _jsx("p", { className: "text-sm text-red-500", children: purchaseError }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { type: "button", className: "rounded-full border border-white/60 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-midnight dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60", onClick: closeProductModal, children: "Cancel" }), _jsx("button", { type: "button", className: "rounded-full bg-midnight px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300", disabled: purchaseMutation.isPending, onClick: onPurchase, children: purchaseMutation.isPending ? "Processing..." : "Buy Now" })] })] })] }) }))] }));
}
function AddressFields({ prefix, register, errors }) {
    const makeField = (field) => `${prefix}.${field}`;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: `${prefix}.line1`, children: "Address Line 1" }), _jsx("input", { id: `${prefix}.line1`, className: "input", ...register(makeField("line1")) }), errors?.line1 && _jsx("span", { className: "text-xs text-red-500", children: errors.line1.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: `${prefix}.line2`, children: "Address Line 2" }), _jsx("input", { id: `${prefix}.line2`, className: "input", ...register(makeField("line2")) }), errors?.line2 && _jsx("span", { className: "text-xs text-red-500", children: errors.line2.message })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: `${prefix}.city`, children: "City" }), _jsx("input", { id: `${prefix}.city`, className: "input", ...register(makeField("city")) }), errors?.city && _jsx("span", { className: "text-xs text-red-500", children: errors.city.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: `${prefix}.state`, children: "State" }), _jsx("input", { id: `${prefix}.state`, className: "input", ...register(makeField("state")) }), errors?.state && _jsx("span", { className: "text-xs text-red-500", children: errors.state.message })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: `${prefix}.postalCode`, children: "Postal Code" }), _jsx("input", { id: `${prefix}.postalCode`, className: "input", ...register(makeField("postalCode")) }), errors?.postalCode && _jsx("span", { className: "text-xs text-red-500", children: errors.postalCode.message })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-300", htmlFor: `${prefix}.country`, children: "Country" }), _jsx("input", { id: `${prefix}.country`, className: "input", ...register(makeField("country")) }), errors?.country && _jsx("span", { className: "text-xs text-red-500", children: errors.country.message })] })] })] }));
}
