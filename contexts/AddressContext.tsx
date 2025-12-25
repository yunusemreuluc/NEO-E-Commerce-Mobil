// contexts/AddressContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { addressService } from '../services/addressService';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../types/Address';
import { useAuth } from './AuthContext';

interface AddressContextType {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  defaultAddress: Address | null;
  
  // Actions
  loadAddresses: () => Promise<void>;
  createAddress: (addressData: CreateAddressRequest) => Promise<Address>;
  updateAddress: (addressData: UpdateAddressRequest) => Promise<Address>;
  deleteAddress: (id: number) => Promise<void>;
  setDefaultAddress: (id: number) => Promise<void>;
  clearError: () => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

interface AddressProviderProps {
  children: ReactNode;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth() || { user: null };

  // Varsayılan adresi bul
  const defaultAddress = addresses.find(addr => addr.is_default) || null;

  const clearError = () => setError(null);

  const loadAddresses = async () => {
    if (!user) {
      setAddresses([]); // Kullanıcı yoksa adresleri temizle
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Address loading error:', err);
      // Network hatası durumunda sessizce geç, hata gösterme
      if (err instanceof Error && err.message.includes('fetch')) {
        console.warn('Network error, skipping address loading');
        return;
      }
      setError(err instanceof Error ? err.message : 'Adresler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (addressData: CreateAddressRequest): Promise<Address> => {
    try {
      setError(null);
      const newAddress = await addressService.createAddress(addressData);
      
      // Adresleri yeniden yükle (sıralama korunur)
      await loadAddresses();
      
      return newAddress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Adres eklenirken bir hata oluştu';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateAddress = async (addressData: UpdateAddressRequest): Promise<Address> => {
    try {
      setError(null);
      const updatedAddress = await addressService.updateAddress(addressData);
      
      // Adresleri yeniden yükle (sıralama korunur)
      await loadAddresses();
      
      return updatedAddress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Adres güncellenirken bir hata oluştu';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteAddress = async (id: number): Promise<void> => {
    try {
      setError(null);
      await addressService.deleteAddress(id);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Adres silinirken bir hata oluştu';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const setDefaultAddress = async (id: number): Promise<void> => {
    try {
      setError(null);
      await addressService.setDefaultAddress(id);
      
      // Adresleri yeniden yükle (sıralama korunur)
      await loadAddresses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Varsayılan adres güncellenirken bir hata oluştu';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Kullanıcı giriş yaptığında adresleri yükle
  useEffect(() => {
    if (user) {
      console.log('👤 AddressContext: Kullanıcı giriş yaptı, adresler yükleniyor:', user.name);
      loadAddresses();
    } else {
      console.log('👤 AddressContext: Kullanıcı çıkış yaptı, adresler temizleniyor');
      setAddresses([]);
    }
  }, [user]);

  const value: AddressContextType = {
    addresses,
    loading,
    error,
    defaultAddress,
    loadAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    clearError,
  };

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = (): AddressContextType => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};