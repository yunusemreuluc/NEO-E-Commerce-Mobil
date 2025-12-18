// app/(tabs)/profile/settings/appearance.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSettings } from "../../../../contexts/SettingsContext";

export default function AppearanceSettingsScreen() {
  const { theme, setTheme, toggleTheme } = useSettings();

  const isDark = theme === "dark";

  const handleToggle = (value: boolean) => {
    // İstersen direkt toggleTheme de kullanabilirsin
    setTheme(value ? "dark" : "light");
    Alert.alert(
      "Tema",
      value
        ? "Karanlık mod aktif edildi. (Global SettingsContext üzerinden)"
        : "Açık moda dönüldü."
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View className="headerRow" style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Görünüm</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tema</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Ionicons name="moon-outline" size={18} color="#111827" />
            </View>
            <View>
              <Text style={styles.rowLabel}>Karanlık mod</Text>
              <Text style={styles.rowDescription}>
                NEO arayüzünü daha koyu bir tema ile kullan.
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={handleToggle}
            thumbColor={isDark ? "#fff" : "#f4f4f5"}
            trackColor={{ false: "#E5E7EB", true: "#111827" }}
          />
        </View>

        <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#E5E7EB", marginTop: 8 }]}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Ionicons name="contrast-outline" size={18} color="#111827" />
            </View>
            <View>
              <Text style={styles.rowLabel}>Hızlı değiştir</Text>
              <Text style={styles.rowDescription}>
                Temayı hızlıca değiştir (toggleTheme).
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              toggleTheme();
              Alert.alert("Tema", "Tema hızlıca değiştirildi (toggleTheme).");
            }}
          >
            <Text style={{ color: "#111827", fontWeight: "600" }}>Değiştir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#6B7280",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rowLabel: {
    fontSize: 14,
    color: "#111827",
  },
  rowDescription: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
});
