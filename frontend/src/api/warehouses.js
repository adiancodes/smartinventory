import api from "./axios";
export async function fetchWarehouses() {
    const response = await api.get("/warehouses");
    return response.data;
}
