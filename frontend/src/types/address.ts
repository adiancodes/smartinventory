export interface UserAddress {
  id: number;
  type: "DELIVERY" | "BILLING";
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface UserAddressesResponse {
  delivery: UserAddress | null;
  billing: UserAddress | null;
}

export interface AddressPayload {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface UserAddressesUpdateRequest {
  delivery?: AddressPayload;
  billing?: AddressPayload;
}
