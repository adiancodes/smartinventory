import api from "./axios";
export async function fetchUserAddresses() {
    const response = await api.get("/users/me/addresses");
    return response.data;
}
export async function updateUserAddresses(payload) {
    const response = await api.put("/users/me/addresses", payload);
    return response.data;
}
