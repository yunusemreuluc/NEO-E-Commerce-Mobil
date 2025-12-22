// services/addressService.ts
import { API_BASE_URL, getAuthHeaders } from '../api';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../types/Address';

export const addressService = {
  // Kullanıcının tüm adreslerini getir
  async getAddresses(): Promise<Address[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Adresler yüklenirken bir hata oluştu');
    }

    return response.json();
  },

  // Belirli bir adresi getir
  async getAddress(id: number): Promise<Address> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Adres yüklenirken bir hata oluştu');
    }

    return response.json();
  },

  // Yeni adres ekle
  async createAddress(addressData: CreateAddressRequest): Promise<Address> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(addressData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Adres eklenirken bir hata oluştu');
    }

    return response.json();
  },

  // Adres güncelle
  async updateAddress(addressData: UpdateAddressRequest): Promise<Address> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses/${addressData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(addressData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Adres güncellenirken bir hata oluştu');
    }

    return response.json();
  },

  // Adresi varsayılan yap
  async setDefaultAddress(id: number): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses/${id}/set-default`, {
      method: 'PATCH',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Varsayılan adres güncellenirken bir hata oluştu');
    }
  },

  // Adres sil
  async deleteAddress(id: number): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Adres silinirken bir hata oluştu');
    }
  },
};