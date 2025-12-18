// app/(tabs)/profile/settings/language.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AppLanguage, useSettings } from "../../../../contexts/SettingsContext";

export default function LanguageSettingsScreen() {
  const { language, setLanguage } = useSettings();

  const renderOption = (code: AppLanguage, label: string) => {
    const selected = language === code;
    return (
      <TouchableOpacity
        key={code}
        style={styles.optionRow}
        onPress={() => setLanguage(code)}
      >
        <Text style={styles.optionLabel}>{label}</Text>
        {selected ? (
          <Ionicons name="radio-button-on" size={20} color="#FF3B30" />
        ) : (
          <Ionicons name="radio-button-off" size={20} color="#D1D5DB" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Dil</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Uygulama dili</Text>

        {renderOption("tr", "Türkçe")}
        {renderOption("en", "İngilizce")}
        {renderOption("de", "Almanca")}
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    justifyContent: "space-between",
  },
  optionLabel: {
    fontSize: 14,
    color: "#111827",
  },
});
