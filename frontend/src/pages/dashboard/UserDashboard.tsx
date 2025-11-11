import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../../api/products";
import { Product } from "../../types/product";

export default function UserDashboard() {
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ["user", "products"],
    queryFn: () => fetchProducts()
  });

  return (
    <div className="min-h-screen bg-ash p-10">
      <div className="mx-auto max-w-6xl rounded-xl bg-white p-8 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-800">Browse Products</h1>
        <p className="mt-2 text-sm text-slate-500">Select items from any warehouse to place your order (coming soon).</p>
        {isLoading && <p className="mt-6 text-sm text-slate-500">Loading available products...</p>}
        {isError && <p className="mt-6 text-sm text-red-500">Unable to load products right now.</p>}
        {!isLoading && products.length === 0 && (
          <p className="mt-6 text-sm text-slate-500">No products are currently available.</p>
        )}
        {!isLoading && products.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full table-auto text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">SKU</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Vendor</th>
                  <th className="px-4 py-2">In Stock</th>
                  <th className="px-4 py-2">Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: Product) => (
                  <tr key={product.id} className="border-b last:border-none">
                    <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                    <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                    <td className="px-4 py-3 text-slate-600">{product.category}</td>
                    <td className="px-4 py-3 text-slate-600">{product.vendor}</td>
                    <td className="px-4 py-3 text-slate-600">{product.currentStock}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.warehouseName}
                      <span className="ml-2 text-xs text-slate-400">{product.warehouseCode}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
