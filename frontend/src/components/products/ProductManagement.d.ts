type ProductManagementMode = "ADMIN" | "MANAGER";
interface ProductManagementProps {
    mode: ProductManagementMode;
}
export default function ProductManagement({ mode }: ProductManagementProps): import("react/jsx-runtime").JSX.Element;
export {};
