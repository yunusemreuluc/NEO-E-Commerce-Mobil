// app/(tabs)/profile/settings/index.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../../../contexts/AuthContext";

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [aiTipsEnabled, setAiTipsEnabled] = useState(true);

  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Oturumu Kapat",
      "Hesabınızdan çıkış yapmak istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı Sil",
      "Bu işlem geri alınamaz. Hesabınızı ve tüm verilerinizi silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Evet, Sil",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Bilgi",
              "Demo projede gerçek silme işlemi yapılmıyor."
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Ayarlar</Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HESAP AYARLARI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>

          <RowSwitch
            icon="notifications-outline"
            label="Push bildirimleri"
            description="Sipariş durumları, kampanyalar ve fırsatlar için bildirim gönder."
            value={pushEnabled}
            onValueChange={setPushEnabled}
          />

          <RowSwitch
            icon="mail-outline"
            label="E-posta kampanyaları"
            description="Özel indirim ve kampanyaları e-posta ile al."
            value={emailEnabled}
            onValueChange={setEmailEnabled}
          />

          <RowSwitch
            icon="sparkles-outline"
            label="NEO AI önerileri"
            description="Alışveriş geçmişine göre öneriler ve ipuçları göster."
            value={aiTipsEnabled}
            onValueChange={setAiTipsEnabled}
          />
        </View>

        {/* GÖRÜNÜM */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görünüm</Text>

          <RowButton
            icon="moon-outline"
            label="Tema / Karanlık Mod"
            rightText="Aç"
            onPress={() => router.push("/profile/settings/appearance" as any)}
          />

          <RowButton
            icon="language-outline"
            label="Dil"
            rightText="Türkçe"
            onPress={() => router.push("/profile/settings/language" as any)}
          />
        </View>

        {/* GÜVENLİK */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Güvenlik</Text>

          <RowButton
            icon="lock-closed-outline"
            label="Şifre değiştir"
            onPress={() => {
              Alert.alert(
                "Şifre Değiştir",
                "Gerçek projede burada şifre değiştirme akışı olacak."
              );
            }}
          />

          <RowButton
            icon="log-out-outline"
            label="Çıkış yap"
            danger
            onPress={handleLogout}
          />

          <RowButton
            icon="trash-outline"
            label="Hesabı sil"
            danger
            onPress={handleDeleteAccount}
          />
        </View>

        {/* UYGULAMA HAKKINDA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama</Text>

          <RowStatic
            icon="information-circle-outline"
            label="Uygulama adı"
            value="NEO E-Ticaret"
          />
          <RowStatic
            icon="code-working-outline"
            label="Sürüm"
            value="v1.0.0 (demo)"
          />
          <RowStatic
            icon="school-outline"
            label="Proje"
            value="Üniversite React Native Dönem Projesi"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* --- Alt bileşenler & stiller aynı, değiştirmene gerek yok --- */

type RowSwitchProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

function RowSwitch({
  icon,
  label,
  description,
  value,
  onValueChange,
}: RowSwitchProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIconBox}>
          <Ionicons name={icon} size={18} color="#FF3B30" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          {description ? (
            <Text style={styles.rowDescription}>{description}</Text>
          ) : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? "#fff" : "#f4f4f5"}
        trackColor={{ false: "#E5E7EB", true: "#FF3B30" }}
      />
    </View>
  );
}

type RowButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  rightText?: string;
  danger?: boolean;
  onPress: () => void;
};

function RowButton({
  icon,
  label,
  rightText,
  danger,
  onPress,
}: RowButtonProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.rowIconBox,
            danger && { backgroundColor: "#FEE2E2" },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={danger ? "#DC2626" : "#111827"}
          />
        </View>
        <Text
          style={[
            styles.rowLabel,
            danger && { color: "#DC2626", fontWeight: "600" },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {rightText ? (
          <Text style={styles.rowRightText}>{rightText}</Text>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

type RowStaticProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function RowStatic({ icon, label, value }: RowStaticProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIconBox}>
          <Ionicons name={icon} size={18} color="#111827" />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowRightText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 10,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#6B7280",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowIconBox: {
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
  rowRightText: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 6,
  },
});
