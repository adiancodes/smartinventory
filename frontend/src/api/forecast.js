import api from "./axios";
export async function fetchDemandForecast() {
    const response = await api.get("/forecast/demand");
    return response.data;
}
