import api from "./axios";
import { DemandForecastItem } from "../types/forecast";

export async function fetchDemandForecast(): Promise<DemandForecastItem[]> {
  const response = await api.get<DemandForecastItem[]>("/forecast/demand");
  return response.data;
}
