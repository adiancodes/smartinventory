import api from "./axios";
import { UserAddressesResponse, UserAddressesUpdateRequest } from "../types/address";

export async function fetchUserAddresses(): Promise<UserAddressesResponse> {
  const response = await api.get<UserAddressesResponse>("/users/me/addresses");
  return response.data;
}

export async function updateUserAddresses(payload: UserAddressesUpdateRequest): Promise<UserAddressesResponse> {
  const response = await api.put<UserAddressesResponse>("/users/me/addresses", payload);
  return response.data;
}
