// types/Address.ts
export interface Address {
  id: number;
  title: string;
  full_name: string;
  phone: string;
  address_line: string;
  district: string;
  city: string;
  postal_code?: string;
  is_default: boolean;
  created_at: string;
}

export interface CreateAddressRequest {
  title: string;
  full_name: string;
  phone: string;
  address_line: string;
  district: string;
  city: string;
  postal_code?: string;
  is_default?: boolean;
}

export interface UpdateAddressRequest extends CreateAddressRequest {
  id: number;
}