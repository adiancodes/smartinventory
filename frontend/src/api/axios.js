import axios, { AxiosHeaders } from "axios";
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api"
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("smartshelfx.token");
    if (token) {
        if (config.headers) {
            config.headers.set("Authorization", `Bearer ${token}`);
        }
        else {
            config.headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
        }
    }
    return config;
});
api.interceptors.response.use((response) => response, async (error) => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem("smartshelfx.token");
        window.location.href = "/login";
    }
    return Promise.reject(error);
});
export default api;
