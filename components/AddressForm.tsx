// components/AddressForm.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../types/Address';
import { MapLocationPicker } from './MapLocationPicker';

interface AddressFormProps {
  address?: Address;
  onSubmit: (data: CreateAddressRequest | UpdateAddressRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    full_name: '',
    phone: '',
    address_line: '',
    district: '',
    city: '',
    postal_code: '',
    is_default: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMapModal, setShowMapModal] = useState(false);

  // Düzenleme modunda form verilerini doldur
  useEffect(() => {
    if (address) {
      setFormData({
        title: address.title,
        full_name: address.full_name,
        phone: address.phone,
        address_line: address.address_line,
        district: address.district,
        city: address.city,
        postal_code: address.postal_code || '',
        is_default: address.is_default,
      });
    }
  }, [address]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Adres başlığı zorunludur';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Ad soyad zorunludur';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon numarası zorunludur';
    } else if (!/^[0-9\s\-\+\(\)]{10,20}$/.test(formData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası giriniz';
    }

    if (!formData.address_line.trim()) {
      newErrors.address_line = 'Detaylı adres zorunludur';
    }

    if (!formData.district.trim()) {
      newErrors.district = 'İlçe zorunludur';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'İl zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        postal_code: formData.postal_code || undefined,
      };

      if (address) {
        await onSubmit({ ...submitData, id: address.id } as UpdateAddressRequest);
      } else {
        await onSubmit(submitData as CreateAddressRequest);
      }
    } catch (error) {
      Alert.alert('Hata', error instanceof Error ? error.message : 'Bir hata oluştu');
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Hata varsa temizle
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationPress = async () => {
    try {
      // Konum izni iste
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum bilgisine erişim için izin vermeniz gerekiyor.');
        return;
      }

      Alert.alert('Konum Alınıyor', 'Mevcut konumunuz alınıyor...');

      // Mevcut konumu al
      const location = await Location.getCurrentPositionAsync({});
      
      // Reverse geocoding ile adres bilgisini al
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        
        // Form alanlarını doldur
        setFormData(prev => ({
          ...prev,
          city: address.city || address.region || '',
          district: address.district || address.subregion || '',
          address_line: `${address.street || ''} ${address.streetNumber || ''}`.trim() || 
                       `${address.name || ''} ${address.district || ''}`.trim(),
        }));

        Alert.alert('Başarılı', 'Konum bilgisi başarıyla alındı!');
      } else {
        Alert.alert('Hata', 'Konum bilgisi alınamadı. Lütfen manuel olarak giriniz.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Konum alınırken bir hata oluştu. Lütfen tekrar deneyiniz.');
    }
  };

  const handleMapPress = () => {
    setShowMapModal(true);
  };

  const handleMapLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    district: string;
  }) => {
    // Form alanlarını doldur
    setFormData(prev => ({
      ...prev,
      city: location.city,
      district: location.district,
      address_line: location.address,
    }));

    setShowMapModal(false);
    Alert.alert('Başarılı', 'Konum bilgisi haritadan alındı!');
  };

  const handleMapClose = () => {
    setShowMapModal(false);
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Adres Başlığı */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adres Başlığı *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(value) => updateField('title', value)}
              placeholder="Ev, İş, vb."
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Ad Soyad */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad *</Text>
            <TextInput
              style={[styles.input, errors.full_name && styles.inputError]}
              value={formData.full_name}
              onChangeText={(value) => updateField('full_name', value)}
              placeholder="Alıcının adı soyadı"
              maxLength={255}
            />
            {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
          </View>

          {/* Telefon */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon Numarası *</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="0555 123 45 67"
              keyboardType="phone-pad"
              maxLength={20}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Detaylı Adres */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Detaylı Adres *</Text>
            <TextInput
              style={[styles.textArea, errors.address_line && styles.inputError]}
              value={formData.address_line}
              onChangeText={(value) => updateField('address_line', value)}
              placeholder="Mahalle, sokak, bina no, daire no"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            {errors.address_line && <Text style={styles.errorText}>{errors.address_line}</Text>}
          </View>

          {/* İlçe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>İlçe *</Text>
            <TextInput
              style={[styles.input, errors.district && styles.inputError]}
              value={formData.district}
              onChangeText={(value) => updateField('district', value)}
              placeholder="İlçe"
              maxLength={100}
            />
            {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
          </View>

          {/* İl */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>İl *</Text>
              <View style={styles.locationButtons}>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleLocationPress}
                >
                  <Ionicons name="location" size={20} color="#007AFF" />
                  <Text style={styles.locationButtonText}>GPS</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleMapPress}
                >
                  <Ionicons name="map" size={20} color="#007AFF" />
                  <Text style={styles.locationButtonText}>Harita</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              value={formData.city}
              onChangeText={(value) => updateField('city', value)}
              placeholder="İl"
              maxLength={100}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          {/* Varsayılan Adres */}
          <View style={styles.switchGroup}>
            <Text style={styles.label}>Varsayılan Adres</Text>
            <Switch
              value={formData.is_default}
              onValueChange={(value) => updateField('is_default', value)}
              trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              thumbColor={formData.is_default ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>

          {/* Butonlar */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Kaydediliyor...' : address ? 'Güncelle' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Harita Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <MapLocationPicker
          onLocationSelect={handleMapLocationSelect}
          onClose={handleMapClose}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});