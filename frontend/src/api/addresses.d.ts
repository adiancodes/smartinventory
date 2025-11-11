import { UserAddressesResponse, UserAddressesUpdateRequest } from "../types/address";
export declare function fetchUserAddresses(): Promise<UserAddressesResponse>;
export declare function updateUserAddresses(payload: UserAddressesUpdateRequest): Promise<UserAddressesResponse>;
