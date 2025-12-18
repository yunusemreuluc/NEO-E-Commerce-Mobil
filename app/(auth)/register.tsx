// app/(auth)/register.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();

  const [name, setName] = useState("NEO Kullanıcısı");
  const [email, setEmail] = useState("demo@neoapp.com"); // ✅ düzeltildi
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }
    try {
      await register(name, email, password);
      router.replace("/home");
    } catch (e: any) {
      setError(e.message || "Kayıt başarısız. Daha sonra tekrar deneyin.");
    }
  };

  return (
    <LinearGradient
      colors={["#020617", "#020617", "#0f172a"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inner}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>NEO</Text>
          <Text style={styles.subtitle}>Dakikalar içinde hesabını oluştur</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kayıt Ol</Text>
          <Text style={styles.cardSubtitle}>
            NEO dünyasına katıl, kişiselleştirilmiş öneriler ve NEO AI ile
            akıllı alışverişin tadını çıkar.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@mail.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.buttonText}>Hesap Oluştur</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Zaten hesabın var mı?</Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <Text style={styles.footerText}>
          Kayıt olarak kullanım koşullarını kabul etmiş olursun.
        </Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 6,
    color: "#e5e7eb",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#9ca3af",
  },
  card: {
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 30,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e5e7eb",
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#94a3b8",
  },
  field: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    color: "#a1a1aa",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#020617",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#e5e7eb",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
  },
  errorText: {
    color: "#f97373",
    fontSize: 12,
    marginTop: 8,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#22d3ee",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#020617",
    fontSize: 15,
    fontWeight: "700",
  },
  registerRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  registerText: {
    fontSize: 13,
    color: "#9ca3af",
  },
  registerLink: {
    fontSize: 13,
    color: "#22d3ee",
    fontWeight: "600",
    marginLeft: 6,
  },
  footerText: {
    textAlign: "center",
    fontSize: 11,
    color: "#6b7280",
  },
});
