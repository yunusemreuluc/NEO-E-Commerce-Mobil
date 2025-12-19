// app/(tabs)/profile/addresses.tsx

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

type Address = {
  id: string;
  title: string; // Ev, İş vs.
  line: string; // Adres satırı
  city: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
};

const INITIAL_ADDRESSES: Address[] = [
  {
    id: "1",
    title: "Ev",
    line: "Örnek Mah. 123. Sok. No:10 Daire:3",
    city: "İstanbul / Üsküdar",
    isDefault: true,
    latitude: 41.0257,
    longitude: 29.0153,
  },
  {
    id: "2",
    title: "İş",
    line: "Teknokent Cad. No:45 Kat:6",
    city: "İstanbul / Maslak",
    latitude: 41.1125,
    longitude: 29.0209,
  },
];

// Haritanın default bölgesi (İstanbul çevresi)
const DEFAULT_REGION: Region = {
  latitude: 41.015137,
  longitude: 28.97953,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();

  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLine, setNewLine] = useState("");
  const [newCity, setNewCity] = useState("");

  // Formda seçilmiş konum
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Harita picker görünür mü?
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  // Picker içindeki geçici konum
  const [tempLocation, setTempLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Harita merkezini kontrol eden state
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);

  // MapView referansı - animasyonlu hareket için
  const mapRef = React.useRef<MapView>(null);

  // "Konumum" butonu yükleniyor mu?
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  // Konumu kaydederken adres çözümleme (reverse geocode) yükleniyor mu?
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleAddPress = () => {
    setIsAdding(true);
  };

  const resetForm = () => {
    setNewTitle("");
    setNewLine("");
    setNewCity("");
    setSelectedLocation(null);
    setTempLocation(null);
    setIsAdding(false);
    setLocationPickerVisible(false);
    setMapRegion(DEFAULT_REGION);
  };

  const handleSaveAddress = () => {
    if (!newTitle.trim() || !newLine.trim() || !newCity.trim()) {
      Alert.alert("Uyarı", "Lütfen tüm adres alanlarını doldurun.");
      return;
    }

    if (!selectedLocation) {
      Alert.alert(
        "Konum Seçilmedi",
        "Lütfen 'Konumdan Seç' butonuna basarak haritadan bir konum seçin."
      );
      return;
    }

    const newAddress: Address = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      line: newLine.trim(),
      city: newCity.trim(),
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    };

    setAddresses((prev) => [newAddress, ...prev]);
    resetForm();
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      "Adresi Sil",
      "Bu adresi silmek istediğinizden emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () =>
            setAddresses((prev) => prev.filter((a) => a.id !== id)),
        },
      ]
    );
  };

  const openInGoogleMaps = (address: Address) => {
    if (!address.latitude || !address.longitude) {
      Alert.alert("Konum Yok", "Bu adres için konum bilgisi bulunmuyor.");
      return;
    }

    const url = `https://www.google.com/maps?q=${address.latitude},${address.longitude}`;
    Linking.openURL(url);
  };

  const renderAddress = ({ item }: { item: Address }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="home-outline" size={18} color="#FF3B30" />
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Varsayılan</Text>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={() => handleDeleteAddress(item.id)}>
            <Ionicons name="trash-outline" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardLine}>{item.line}</Text>
        <Text style={styles.cardCity}>{item.city}</Text>

        {item.latitude && item.longitude && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => openInGoogleMaps(item)}
          >
            <Ionicons name="map-outline" size={16} color="#2563EB" />
            <Text style={styles.mapButtonText}>Google Maps'te Aç</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Kullanıcının mevcut konumuna git - debounced ve optimize edilmiş
  const centerOnUserLocation = useCallback(async () => {
    // Eğer zaten konum alınıyorsa, yeni istek yapma
    if (isGettingLocation) return;
    
    try {
      setIsGettingLocation(true);

      // Önce izin durumunu kontrol et
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Konumunuzu kullanabilmek için konum izni vermeniz gerekiyor.",
          [
            { text: "İptal", style: "cancel" },
            { text: "Ayarlara Git", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Konum servislerinin açık olup olmadığını kontrol et
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          "Konum Servisleri Kapalı",
          "Lütfen cihazınızın konum servislerini açın.",
          [
            { text: "Tamam", style: "default" }
          ]
        );
        return;
      }

      // En hızlı konum alma ayarları
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low, // Balanced yerine Low (çok daha hızlı)
        timeout: 3000, // 5 saniye yerine 3 saniye
        maximumAge: 60000, // 1 dakika cache (daha uzun)
      });

      const { latitude, longitude } = current.coords;

      const region = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Haritayı animasyonlu olarak konuma götür
      if (mapRef.current) {
        mapRef.current.animateToRegion(region, 1000); // 1 saniye animasyon
      }
      
      setTempLocation({ latitude, longitude });

    } catch (err: any) {
      console.error('Konum alma hatası:', err);
      
      // Timeout hatası için özel mesaj
      if (err.code === 'E_LOCATION_TIMEOUT') {
        Alert.alert(
          "Konum Zaman Aşımı", 
          "Konum alınamadı. Lütfen açık alanda tekrar deneyin.",
          [{ text: "Tamam" }]
        );
      } else if (err.code === 'E_LOCATION_UNAVAILABLE') {
        Alert.alert(
          "Konum Servisi Kullanılamıyor", 
          "GPS sinyali alınamıyor. Lütfen açık alanda tekrar deneyin.",
          [{ text: "Tamam" }]
        );
      } else {
        Alert.alert(
          "Konum Hatası", 
          "Konumunuz alınırken bir hata oluştu. Lütfen tekrar deneyin.",
          [{ text: "Tamam" }]
        );
      }
    } finally {
      setIsGettingLocation(false);
    }
  }, [isGettingLocation]); // Dependency array eklendi

  // Konumu kaydet + adres alanlarını otomatik doldur - optimize edilmiş
  const handleLocationSave = useCallback(async () => {
    if (!tempLocation) {
      Alert.alert(
        "Konum Seçilmedi",
        "Lütfen haritaya dokunarak bir nokta seçin veya 'Konumum' butonunu kullanın."
      );
      return;
    }

    try {
      setIsGeocoding(true);

      // Reverse geocoding ile adres bilgisini al - timeout eklendi
      const results = await Promise.race([
        Location.reverseGeocodeAsync({
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Geocoding timeout')), 8000)
        )
      ]) as Location.LocationGeocodedAddress[];

      if (results && results.length > 0) {
        const info = results[0];
        
        // Adres satırı oluştur
        const addressParts: string[] = [];
        if (info.streetNumber) addressParts.push(info.streetNumber);
        if (info.street) addressParts.push(info.street);
        if (info.name && info.name !== info.street) addressParts.push(info.name);
        
        const addressLine = addressParts.join(" ");

        // Şehir/İlçe bilgisi
        const cityParts: string[] = [];
        if (info.district) cityParts.push(info.district);
        if (info.city) cityParts.push(info.city);
        if (info.region && info.region !== info.city) cityParts.push(info.region);
        
        const cityInfo = cityParts.join(" / ");

        // Form alanlarını doldur (sadece boşsa)
        if (addressLine && !newLine.trim()) {
          setNewLine(addressLine);
        }
        if (cityInfo && !newCity.trim()) {
          setNewCity(cityInfo);
        }
        if (!newTitle.trim()) {
          setNewTitle("Yeni Adres");
        }

        // Başarı mesajı
        Alert.alert(
          "Konum Kaydedildi",
          "Adres bilgileri otomatik olarak dolduruldu. İstediğiniz değişiklikleri yapabilirsiniz.",
          [{ text: "Tamam" }]
        );
      } else {
        // Adres bulunamadı ama konum kaydedildi
        Alert.alert(
          "Konum Kaydedildi",
          "Adres bilgisi otomatik alınamadı, lütfen manuel olarak doldurun.",
          [{ text: "Tamam" }]
        );
        
        if (!newTitle.trim()) {
          setNewTitle("Yeni Adres");
        }
      }
    } catch (err: any) {
      console.error('Reverse geocoding hatası:', err);
      Alert.alert(
        "Konum Kaydedildi",
        err.message === 'Geocoding timeout' 
          ? "Adres bilgisi alınamadı (zaman aşımı), lütfen manuel olarak doldurun."
          : "Adres bilgisi otomatik alınamadı, lütfen manuel olarak doldurun.",
        [{ text: "Tamam" }]
      );
      
      if (!newTitle.trim()) {
        setNewTitle("Yeni Adres");
      }
    } finally {
      setIsGeocoding(false);
      setSelectedLocation(tempLocation);
      setLocationPickerVisible(false);
    }
  }, [tempLocation, newLine, newCity, newTitle]); // Dependencies eklendi

  // Harita picker overlay’i
  const renderLocationPicker = () => {
    if (!locationPickerVisible) return null;

    return (
      <View style={styles.locationOverlay}>
        <View
          style={[
            styles.locationHeader,
            { paddingTop: 8 + insets.top }, // status bar'ı dikkate al
          ]}
        >
          <View>
            <Text style={styles.locationTitle}>Haritadan Konum Seç</Text>
            <Text style={styles.locationSubtitle}>
              Haritaya dokunarak veya "Konumum" ile teslimat konumunu belirle.
            </Text>
          </View>
        </View>

        <MapView
          ref={mapRef}
          style={styles.locationMap}
          initialRegion={mapRegion} // region yerine initialRegion
          showsUserLocation={true}
          showsMyLocationButton={false}
          loadingEnabled={true}
          loadingIndicatorColor="#2563EB"
          loadingBackgroundColor="#F3F4F6"
          moveOnMarkerPress={false}
          pitchEnabled={false} // 3D görünümü kapat (performans)
          rotateEnabled={false} // Döndürmeyi kapat (performans)
          scrollEnabled={true}
          zoomEnabled={true}
          onPress={(e) => {
            const coord = e.nativeEvent.coordinate;
            setTempLocation({
              latitude: coord.latitude,
              longitude: coord.longitude,
            });
          }}
        >
          {tempLocation && (
            <Marker 
              coordinate={tempLocation} 
              title="Seçilen Konum"
              description="Bu konuma teslimat yapılacak"
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.customMarker}>
                <Ionicons name="location" size={28} color="#FF3B30" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Alt bar + sağ üstte Konumum butonu */}
        <View style={styles.locationButtonsRow}>
          {/* Sağ üstte yüzen KONUMUM butonu - debounced */}
          <TouchableOpacity
            style={[
              styles.floatingLocateButton,
              isGettingLocation && styles.floatingLocateButtonActive
            ]}
            onPress={centerOnUserLocation}
            disabled={isGettingLocation}
            activeOpacity={0.8}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            {isGettingLocation ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.locateButtonText}>Alınıyor...</Text>
              </>
            ) : (
              <>
                <Ionicons name="locate" size={18} color="#fff" />
                <Text style={styles.locateButtonText}>Konumum</Text>
              </>
            )}
          </TouchableOpacity>

          {/* İptal + Konumu Kaydet */}
          <View style={styles.bottomActionRow}>
            <TouchableOpacity
              style={[styles.locButton, styles.locCancel]}
              onPress={() => {
                setTempLocation(null);
                setLocationPickerVisible(false);
                // Haritayı default konuma döndür
                if (mapRef.current) {
                  mapRef.current.animateToRegion(DEFAULT_REGION, 500);
                }
              }}
            >
              <Text style={[styles.locButtonText, { color: "#111" }]}>
                İptal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.locButton, styles.locSave]}
              onPress={handleLocationSave}
            >
              {isGeocoding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.locButtonText}>Konumu Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Adreslerim</Text>

      <Text style={styles.infoText}>
        Sipariş teslimatı için adreslerini ve konumlarını burada
        yönetebilirsin. Yeni adres eklerken haritadan konum da
        seçebilirsin.
      </Text>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderAddress}
        contentContainerStyle={{ paddingBottom: 180 }}
      />

      {/* Yeni adres ekleme alanı */}
      {isAdding ? (
        <View style={styles.addPanel}>
          <Text style={styles.addTitle}>Yeni Adres Ekle</Text>

          <TextInput
            placeholder="Adres adı (Ev, İş...)"
            style={styles.input}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            placeholder="Adres satırı"
            style={styles.input}
            value={newLine}
            onChangeText={setNewLine}
          />
          <TextInput
            placeholder="Şehir / İlçe"
            style={styles.input}
            value={newCity}
            onChangeText={setNewCity}
          />

          <Text style={styles.mapLabel}>Konum</Text>

          <TouchableOpacity
            style={styles.locationSelectButton}
            onPress={() => {
              const base = selectedLocation || {
                latitude: DEFAULT_REGION.latitude,
                longitude: DEFAULT_REGION.longitude,
              };

              setTempLocation(selectedLocation);
              setMapRegion({
                latitude: base.latitude,
                longitude: base.longitude,
                latitudeDelta: DEFAULT_REGION.latitudeDelta,
                longitudeDelta: DEFAULT_REGION.longitudeDelta,
              });
              setLocationPickerVisible(true);
            }}
          >
            <Ionicons name="location-outline" size={18} color="#1D4ED8" />
            <Text style={styles.locationSelectText}>Konumdan Seç</Text>
          </TouchableOpacity>

          {selectedLocation ? (
            <Text style={styles.selectedCoordText}>
              Seçilen Konum: {selectedLocation.latitude.toFixed(4)},{" "}
              {selectedLocation.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.selectedCoordHint}>
              Henüz konum seçilmedi.
            </Text>
          )}

          <View style={styles.addButtonsRow}>
            <TouchableOpacity
              style={[styles.addButton, styles.cancelButton]}
              onPress={resetForm}
            >
              <Text style={[styles.addButtonText, { color: "#444" }]}>
                İptal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addButton, styles.saveButton]}
              onPress={handleSaveAddress}
            >
              <Text style={styles.addButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={handleAddPress}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.floatingAddText}>Yeni Adres Ekle</Text>
        </TouchableOpacity>
      )}

      {/* Harita picker overlay */}
      {renderLocationPicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7", paddingHorizontal: 16 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },
  defaultBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#F97316",
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  cardLine: {
    fontSize: 13,
    color: "#333",
    marginBottom: 2,
  },
  cardCity: {
    fontSize: 13,
    color: "#666",
  },

  mapButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  mapButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "500",
  },

  floatingAddButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#FF3B30",
    borderRadius: 999,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  floatingAddText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 4,
  },

  addPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 8,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    fontSize: 13,
    backgroundColor: "#F9FAFB",
  },
  mapLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 4,
  },
  locationSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
  },
  locationSelectText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#1D4ED8",
    fontWeight: "500",
  },
  selectedCoordText: {
    fontSize: 12,
    color: "#111",
    marginTop: 6,
  },
  selectedCoordHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },
  addButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 8,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
  },
  saveButton: {
    backgroundColor: "#22C55E",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  /* Konum picker overlay */
  locationOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  locationHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "rgba(15,23,42,0.9)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  locationSubtitle: {
    color: "#E5E7EB",
    fontSize: 12,
    marginTop: 2,
  },
  locationMap: {
    flex: 1,
  },
  locationButtonsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(15,23,42,0.9)",
    position: "relative",
  },
  bottomActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  locButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    marginHorizontal: 4,
  },
  locCancel: {
    backgroundColor: "#E5E7EB",
  },
  locSave: {
    backgroundColor: "#22C55E",
  },
  locButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  floatingLocateButton: {
    position: "absolute",
    right: 5,
    top: -60,
    minWidth: 80,
    height: 44,
    backgroundColor: "#2563EB",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 20,
    flexDirection: "row",
    paddingHorizontal: 12,
  },

  floatingLocateButtonActive: {
    backgroundColor: "#1D4ED8",
    transform: [{ scale: 0.95 }],
  },

  locateButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Custom marker stili
  customMarker: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
