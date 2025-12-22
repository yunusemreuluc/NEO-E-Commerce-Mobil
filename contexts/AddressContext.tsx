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
  const { user } = useAuth();

  // Varsayılan adresi bul
  const defaultAddress = addresses.find(addr => addr.is_default) || null;

  const clearError = () => setError(null);

  const loadAddresses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Adresler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (addressData: CreateAddressRequest): Promise<Address> => {
    try {
      setError(null);
      const newAddress = await addressService.createAddress(addressData);
      
      // Eğer yeni adres varsayılan olarak işaretlendiyse, diğerlerini güncelle
      if (newAddress.is_default) {
        setAddresses(prev => [
          ...prev.map(addr => ({ ...addr, is_default: false })),
          newAddress
        ]);
      } else {
        setAddresses(prev => [...prev, newAddress]);
      }
      
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
      
      // Eğer güncellenen adres varsayılan olarak işaretlendiyse, diğerlerini güncelle
      if (updatedAddress.is_default) {
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          is_default: addr.id === updatedAddress.id ? true : false,
          ...(addr.id === updatedAddress.id ? updatedAddress : {})
        })));
      } else {
        setAddresses(prev => prev.map(addr => 
          addr.id === updatedAddress.id ? updatedAddress : addr
        ));
      }
      
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
      
      // Local state'i güncelle
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_default: addr.id === id
      })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Varsayılan adres güncellenirken bir hata oluştu';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Kullanıcı giriş yaptığında adresleri yükle
  useEffect(() => {
    if (user) {
      loadAddresses();
    } else {
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