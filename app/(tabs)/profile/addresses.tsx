// app/(tabs)/profile/addresses.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddressForm } from '../../../components/AddressForm';
import { AddressList } from '../../../components/AddressList';
import { useAddress } from '../../../contexts/AddressContext';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../../../types/Address';

export default function AddressesScreen() {
  const {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    clearError,
  } = useAddress();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  const handleAddAddress = () => {
    setEditingAddress(undefined);
    setShowForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: CreateAddressRequest | UpdateAddressRequest) => {
    try {
      setFormLoading(true);
      
      if (editingAddress) {
        await updateAddress(data as UpdateAddressRequest);
        Alert.alert('Başarılı', 'Adres başarıyla güncellendi');
      } else {
        await createAddress(data as CreateAddressRequest);
        Alert.alert('Başarılı', 'Adres başarıyla eklendi');
      }
      
      setShowForm(false);
      setEditingAddress(undefined);
    } catch (error) {
      // Hata AddressContext tarafından handle edildi
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    Alert.alert(
      'Adresi Sil',
      'Bu adresi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(id);
              Alert.alert('Başarılı', 'Adres başarıyla silindi');
            } catch (error) {
              Alert.alert('Hata', error instanceof Error ? error.message : 'Adres silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await setDefaultAddress(id);
      Alert.alert('Başarılı', 'Varsayılan adres güncellendi');
    } catch (error) {
      Alert.alert('Hata', error instanceof Error ? error.message : 'Varsayılan adres güncellenirken bir hata oluştu');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAddress(undefined);
  };

  // Hata gösterimi
  React.useEffect(() => {
    if (error) {
      Alert.alert('Hata', error, [
        { text: 'Tamam', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Adreslerim</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddAddress}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Adres Listesi */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AddressList
          addresses={addresses}
          loading={loading}
          onEdit={handleEditAddress}
          onDelete={handleDeleteAddress}
          onSetDefault={handleSetDefaultAddress}
        />
      </ScrollView>

      {/* Adres Formu Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleCloseForm}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
              <Text style={styles.cancelText}>Geri</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Adres Düzenle' : 'Yeni Adres'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <AddressForm
            address={editingAddress}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
            loading={formLoading}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  addButton: {
    backgroundColor: '#667eea',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  placeholder: {
    width: 50, // Cancel butonuyla dengelemek için
  },
});