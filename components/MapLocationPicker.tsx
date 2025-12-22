import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

interface MapLocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    district: string;
  }) => void;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  onLocationSelect,
  onClose,
}) => {
  const [region, setRegion] = useState<Region>({
    latitude: 41.0082, // İstanbul koordinatları
    longitude: 28.9784,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);

  // Kullanıcının mevcut konumunu al
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum izni gerekli');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log('Konum alınamadı:', error);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      Alert.alert('Hata', 'Lütfen harita üzerinde bir konum seçin');
      return;
    }

    setLoading(true);
    try {
      // Reverse geocoding ile adres bilgisini al
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });

      if (reverseGeocode.length > 0) {
        const addressInfo = reverseGeocode[0];
        
        onLocationSelect({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: `${addressInfo.street || ''} ${addressInfo.streetNumber || ''}`.trim() ||
                   `${addressInfo.name || ''} ${addressInfo.district || ''}`.trim() ||
                   'Seçilen konum',
          city: addressInfo.city || addressInfo.region || '',
          district: addressInfo.district || addressInfo.subregion || '',
        });
      } else {
        onLocationSelect({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: 'Seçilen konum',
          city: '',
          district: '',
        });
      }
    } catch (error) {
      Alert.alert('Hata', 'Adres bilgisi alınamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Konum Seç</Text>
        <TouchableOpacity onPress={getCurrentLocation}>
          <Ionicons name="locate" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Harita */}
      <MapView
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Seçilen Konum"
            pinColor="#007AFF"
          />
        )}
      </MapView>

      {/* Alt Butonlar */}
      <View style={styles.footer}>
        <Text style={styles.instruction}>
          Harita üzerinde bir noktaya dokunarak konum seçin
        </Text>
        
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedLocation && styles.disabledButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleConfirmLocation}
          disabled={!selectedLocation || loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Adres Alınıyor...' : 'Konumu Onayla'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  map: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});