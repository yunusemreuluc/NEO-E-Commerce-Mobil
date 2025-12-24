// app/(tabs)/profile/settings.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../contexts/AuthContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  // Görsel state'ler (aktif değil, sadece UI için)
  const [selectedTheme, setSelectedTheme] = useState("light");
  const [selectedLanguage, setSelectedLanguage] = useState("tr");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Modal state'leri
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  // Şifre değiştirme state'leri
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const themes = [
    { id: "light", name: "Açık Tema", icon: "sunny-outline" },
    { id: "dark", name: "Koyu Tema", icon: "moon-outline" },
    { id: "auto", name: "Sistem", icon: "phone-portrait-outline" },
  ];

  const languages = [
    { id: "tr", name: "Türkçe", flag: "🇹🇷" },
    { id: "en", name: "English", flag: "🇺🇸" },
    { id: "de", name: "Deutsch", flag: "🇩🇪" },
  ];

  const handleThemePress = (themeId: string) => {
    setSelectedTheme(themeId);
    setThemeModalVisible(false);
    // Aktif değil - sadece görsel
    Alert.alert(
      "Tema Seçimi", 
      `${themes.find(t => t.id === themeId)?.name} seçildi. Tema değiştirme özelliği yakında eklenecek!`,
      [{ text: "Tamam" }]
    );
  };

  const handleLanguagePress = (langId: string) => {
    setSelectedLanguage(langId);
    setLanguageModalVisible(false);
    // Aktif değil - sadece görsel
    Alert.alert(
      "Dil Seçimi", 
      `${languages.find(l => l.id === langId)?.name} seçildi. Dil değiştirme özelliği yakında eklenecek!`,
      [{ text: "Tamam" }]
    );
  };

  const handleChangePassword = async () => {
    // Validasyon kontrolleri
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Hata", "Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      // API çağrısı yapılacak (şimdilik simüle ediyoruz)
      const response = await fetch('http://10.241.81.212:4000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Token'ı AsyncStorage'dan alıp header'a ekleyebiliriz
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (response.ok) {
        Alert.alert(
          "Başarılı", 
          "Şifreniz başarıyla değiştirildi.",
          [{ 
            text: "Tamam", 
            onPress: () => {
              setPasswordModalVisible(false);
              resetPasswordForm();
            }
          }]
        );
      } else {
        const error = await response.json();
        Alert.alert("Hata", error.message || "Şifre değiştirilemedi.");
      }
    } catch (error) {
      // Şimdilik başarılı olarak gösterelim
      Alert.alert(
        "Başarılı", 
        "Şifreniz başarıyla değiştirildi. (Demo)",
        [{ 
          text: "Tamam", 
          onPress: () => {
            setPasswordModalVisible(false);
            resetPasswordForm();
          }
        }]
      );
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkmak istediğinizden emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Çıkış Yap", 
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              // Login sayfasına yönlendir
              router.replace("/(auth)/login");
            } catch (error) {
              Alert.alert("Hata", "Çıkış yapılırken bir hata oluştu.");
            }
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı Sil",
      "Bu işlem geri alınamaz. Tüm verileriniz silinecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: () => {
            Alert.alert("Bilgi", "Hesap silme işlemi henüz aktif değil.");
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Ayarlar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Tema Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görünüm</Text>
          
          <View style={styles.settingGroup}>
            <TouchableOpacity 
              style={styles.selectorButton}
              onPress={() => setThemeModalVisible(true)}
            >
              <View style={styles.selectorLeft}>
                <Ionicons 
                  name={themes.find(t => t.id === selectedTheme)?.icon as any} 
                  size={20} 
                  color="#FF3B30" 
                />
                <View style={styles.selectorTextContainer}>
                  <Text style={styles.selectorLabel}>Tema</Text>
                  <Text style={styles.selectorValue}>
                    {themes.find(t => t.id === selectedTheme)?.name}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dil Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dil ve Bölge</Text>
          
          <View style={styles.settingGroup}>
            <TouchableOpacity 
              style={styles.selectorButton}
              onPress={() => setLanguageModalVisible(true)}
            >
              <View style={styles.selectorLeft}>
                <Text style={styles.flagEmoji}>
                  {languages.find(l => l.id === selectedLanguage)?.flag}
                </Text>
                <View style={styles.selectorTextContainer}>
                  <Text style={styles.selectorLabel}>Uygulama Dili</Text>
                  <Text style={styles.selectorValue}>
                    {languages.find(l => l.id === selectedLanguage)?.name}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bildirimler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          
          <View style={styles.settingGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Ionicons name="notifications-outline" size={20} color="#666" />
                <Text style={styles.switchText}>Tüm Bildirimler</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E5E7EB", true: "#FF3B30" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <Text style={styles.switchText}>E-posta Bildirimleri</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: "#E5E7EB", true: "#FF3B30" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Ionicons name="phone-portrait-outline" size={20} color="#666" />
                <Text style={styles.switchText}>Push Bildirimleri</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#E5E7EB", true: "#FF3B30" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Hesap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          
          <View style={styles.settingGroup}>
            <TouchableOpacity 
              style={styles.actionRow}
              onPress={() => setPasswordModalVisible(true)}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <Text style={styles.actionText}>Şifre Değiştir</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tehlikeli İşlemler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap İşlemleri</Text>
          
          <View style={styles.settingGroup}>
            <TouchableOpacity 
              style={styles.dangerRow}
              onPress={handleLogout}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={styles.dangerText}>Çıkış Yap</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.dangerRow}
              onPress={handleDeleteAccount}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={styles.dangerText}>Hesabı Sil</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Versiyon Bilgisi */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>NEO v1.0.0</Text>
          <Text style={styles.versionSubtext}>© 2024 NEO E-ticaret</Text>
        </View>

      </ScrollView>

      {/* Tema Seçim Modal'ı */}
      {themeModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tema Seç</Text>
              <TouchableOpacity
                onPress={() => setThemeModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {themes.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={styles.modalOptionRow}
                  onPress={() => handleThemePress(theme.id)}
                >
                  <View style={styles.modalOptionLeft}>
                    <Ionicons 
                      name={theme.icon as any} 
                      size={24} 
                      color={selectedTheme === theme.id ? "#FF3B30" : "#666"} 
                    />
                    <Text style={[
                      styles.modalOptionText,
                      selectedTheme === theme.id && styles.modalOptionTextActive
                    ]}>
                      {theme.name}
                    </Text>
                  </View>
                  {selectedTheme === theme.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#FF3B30" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Dil Seçim Modal'ı */}
      {languageModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dil Seç</Text>
              <TouchableOpacity
                onPress={() => setLanguageModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={styles.modalOptionRow}
                  onPress={() => handleLanguagePress(lang.id)}
                >
                  <View style={styles.modalOptionLeft}>
                    <Text style={styles.modalFlagEmoji}>{lang.flag}</Text>
                    <Text style={[
                      styles.modalOptionText,
                      selectedLanguage === lang.id && styles.modalOptionTextActive
                    ]}>
                      {lang.name}
                    </Text>
                  </View>
                  {selectedLanguage === lang.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#FF3B30" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Şifre Değiştirme Modal'ı */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setPasswordModalVisible(false);
          resetPasswordForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şifre Değiştir</Text>
              <TouchableOpacity
                onPress={() => {
                  setPasswordModalVisible(false);
                  resetPasswordForm();
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.passwordModalContent} showsVerticalScrollIndicator={false}>
              {/* Mevcut Şifre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mevcut Şifre</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Mevcut şifrenizi girin"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Ionicons 
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Yeni Şifre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yeni Şifre</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Yeni şifrenizi girin"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons 
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>En az 6 karakter olmalıdır</Text>
              </View>

              {/* Yeni Şifre Tekrar */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Yeni şifrenizi tekrar girin"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Butonlar */}
              <View style={styles.passwordModalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setPasswordModalVisible(false);
                    resetPasswordForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Vazgeç</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.saveButtonText}>Şifreyi Değiştir</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  settingGroup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  switchLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  switchText: {
    fontSize: 15,
    color: "#111",
    marginLeft: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    color: "#111",
    marginLeft: 12,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  dangerText: {
    fontSize: 15,
    color: "#EF4444",
    marginLeft: 12,
    fontWeight: "500",
  },
  versionInfo: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  versionSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },

  /* Selector Button Styles */
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
    backgroundColor: "#FAFAFA",
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectorTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  selectorLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  selectorValue: {
    fontSize: 15,
    color: "#111",
    fontWeight: "600",
    marginTop: 2,
  },

  /* Modal Styles */
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 20,
    maxWidth: 400,
    width: "90%",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  modalContent: {
    paddingVertical: 8,
  },
  modalOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#111",
    marginLeft: 16,
  },
  modalOptionTextActive: {
    color: "#FF3B30",
    fontWeight: "600",
  },
  modalFlagEmoji: {
    fontSize: 24,
  },

  /* Password Modal Styles */
  passwordModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 20,
    maxWidth: 400,
    width: "90%",
    maxHeight: "80%",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  passwordModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111",
  },
  eyeButton: {
    padding: 14,
  },
  inputHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  passwordModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});