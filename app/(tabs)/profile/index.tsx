// app/(tabs)/profile/index.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OPEN_WEATHER_API_KEY } from "../../../constants/Weather"; // 🔥 DİKKAT: 3 ../

// Başlangıç şehri
const DEFAULT_CITY = "Istanbul";

// Hızlı seçim için örnek şehir listesi
const CITY_OPTIONS = ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Muş"];

type WeatherData = {
  city: string;
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
};

export default function ProfileScreen() {
  const router = useRouter();

  const [city, setCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  const fetchWeather = async (cityName: string) => {
    try {
      setLoadingWeather(true);
      setWeatherError(null);

      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        cityName
      )}&units=metric&lang=tr&appid=${OPEN_WEATHER_API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Hava durumu alınamadı");
      }

      const data = await res.json();

      const w: WeatherData = {
        city: data.name,
        temp: data.main?.temp ?? 0,
        feelsLike: data.main?.feels_like ?? 0,
        description: data.weather?.[0]?.description ?? "",
        icon: data.weather?.[0]?.icon ?? "01d",
      };

      setWeather(w);
    } catch (err: any) {
      setWeatherError("Hava durumu bilgileri alınamadı.");
    } finally {
      setLoadingWeather(false);
    }
  };

  // Şehir değiştikçe hava durumu çek
  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  const renderWeatherCard = () => {
    if (loadingWeather) {
      return (
        <View style={styles.weatherCard}>
          <ActivityIndicator size="small" color="#FF3B30" />
          <Text style={styles.weatherLoadingText}>Hava durumu yükleniyor...</Text>
        </View>
      );
    }

    if (weatherError) {
      return (
        <View style={styles.weatherCard}>
          <Ionicons name="cloud-offline-outline" size={32} color="#FF3B30" />
          <Text style={styles.weatherErrorText}>{weatherError}</Text>
          <TouchableOpacity
            style={styles.weatherRetryBtn}
            onPress={() => fetchWeather(city)}
          >
            <Text style={styles.weatherRetryText}>Tekrar dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!weather) return null;

    const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

    return (
      <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <View>
            <Text style={styles.weatherTitle}>Hava Durumu</Text>
            <View style={styles.weatherCityRow}>
              <Ionicons name="location-outline" size={16} color="#FF3B30" />
              <Text style={styles.weatherCityText}>{weather.city}</Text>
            </View>
          </View>

          {/* 🔘 Şehir seçme butonu */}
          <TouchableOpacity
            style={styles.cityChangeButton}
            onPress={() => setCityPickerVisible(true)}
          >
            <Ionicons name="swap-horizontal" size={16} color="#F97316" />
            <Text style={styles.cityChangeText}>Şehir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weatherContent}>
          <View style={styles.weatherLeft}>
            <Text style={styles.weatherTemp}>
              {Math.round(weather.temp)}°
              <Text style={styles.weatherTempUnit}>C</Text>
            </Text>
            <Text style={styles.weatherDesc}>
              {weather.description.charAt(0).toUpperCase() +
                weather.description.slice(1)}
            </Text>
            <Text style={styles.weatherFeelsLike}>
              Hissedilen: {Math.round(weather.feelsLike)}°C
            </Text>
          </View>

          <View style={styles.weatherRight}>
            <Image
              source={{ uri: iconUrl }}
              style={styles.weatherIcon}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    );
  };

  const renderCityPicker = () => {
    if (!cityPickerVisible) return null;

    return (
      <View style={styles.cityOverlay}>
        <View style={styles.cityBox}>
          <Text style={styles.cityTitle}>Şehir Seç</Text>
          <Text style={styles.citySubtitle}>
            Hava durumu bilgisi bu şehre göre gösterilecek.
          </Text>

          <View style={styles.cityList}>
            {CITY_OPTIONS.map((c) => {
              const isActive = c === city;
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.cityItem,
                    isActive && styles.cityItemActive,
                  ]}
                  onPress={() => {
                    setCity(c);
                    setCityPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.cityItemText,
                      isActive && styles.cityItemTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#22C55E"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.cityCancelBtn}
            onPress={() => setCityPickerVisible(false)}
          >
            <Text style={styles.cityCancelText}>Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Başlık */}
        <Text style={styles.title}>Profil</Text>

        {/* Kullanıcı kartı */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>Y</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>Yunus (Örnek Kullanıcı)</Text>
              <Text style={styles.profileEmail}>yunus@example.com</Text>
            </View>

            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Sipariş</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Favori</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Kupon</Text>
            </View>
          </View>
        </View>

        {/* Hava durumu kutusu */}
        {renderWeatherCard()}

        {/* Hızlı işlemler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

          {/* Siparişlerim */}
          <TouchableOpacity
            style={styles.rowButton}
            onPress={() => router.push("/(tabs)/profile/orders")}
          >
            <Ionicons name="cube-outline" size={20} color="#111" />
            <Text style={styles.rowButtonText}>Siparişlerim</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          {/* Yorumlarım */}
          <TouchableOpacity
            style={styles.rowButton}
            onPress={() => router.push("/(tabs)/profile/my-reviews")}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#111" />
            <Text style={styles.rowButtonText}>Yorumlarım</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
          
          {/* Adreslerim */}
          <TouchableOpacity
            style={styles.rowButton}
            onPress={() => router.push("/(tabs)/profile/addresses")}
          >
            <Ionicons name="location-outline" size={20} color="#111" />
            <Text style={styles.rowButtonText}>Adreslerim</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          {/* Ayarlar */}
          <TouchableOpacity
            style={styles.rowButton}
            onPress={() => router.push("/(tabs)/profile/settings")}
          >
            <Ionicons name="settings-outline" size={20} color="#111" />
            <Text style={styles.rowButtonText}>Ayarlar</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Şehir seçme overlay'i */}
        {renderCityPicker()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7", paddingHorizontal: 16 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
  },

  /* Profil kartı */
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileEmail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  /* Hava durumu kartı */
  weatherCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  weatherTitle: {
    color: "#E5E7EB",
    fontSize: 15,
    fontWeight: "600",
  },
  weatherCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  weatherCityText: {
    color: "#F9FAFB",
    fontSize: 13,
    fontWeight: "500",
  },
  cityChangeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(248, 250, 252, 0.12)",
  },
  cityChangeText: {
    color: "#FDBA74",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  weatherContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  weatherLeft: {
    flex: 1,
  },
  weatherTemp: {
    color: "#F9FAFB",
    fontSize: 32,
    fontWeight: "700",
  },
  weatherTempUnit: {
    fontSize: 18,
    fontWeight: "500",
  },
  weatherDesc: {
    color: "#E5E7EB",
    fontSize: 14,
    marginTop: 4,
    textTransform: "capitalize",
  },
  weatherFeelsLike: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  weatherRight: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  weatherIcon: {
    width: 64,
    height: 64,
  },
  weatherLoadingText: {
    color: "#E5E7EB",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  weatherErrorText: {
    color: "#F9FAFB",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  weatherRetryBtn: {
    marginTop: 10,
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F97373",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  weatherRetryText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "500",
  },

  /* Hızlı işlemler */
  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  rowButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  rowButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },

  /* Şehir seçme overlay */
  cityOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  cityBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  cityTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  citySubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  cityList: {
    marginBottom: 10,
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 4,
    justifyContent: "space-between",
  },
  cityItemActive: {
    backgroundColor: "#FFF7ED",
  },
  cityItemText: {
    fontSize: 14,
  },
  cityItemTextActive: {
    color: "#C2410C",
    fontWeight: "600",
  },
  cityCancelBtn: {
    alignSelf: "flex-end",
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cityCancelText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
});