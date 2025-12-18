// app/(auth)/login.tsx
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

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("demo@neoapp.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError("Lütfen e-posta ve şifreyi girin.");
      return;
    }
    try {
      await login(email, password);
      router.replace("/home");
    } catch (e: any) {
      setError(e.message || "Giriş başarısız. Daha sonra tekrar deneyin.");
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
        {/* Üst logo / başlık */}
        <View style={styles.header}>
          <Text style={styles.logoText}>NEO</Text>
          <Text style={styles.subtitle}>E-ticaret evrenine hoş geldin</Text>
        </View>

        {/* Kart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Giriş Yap</Text>
          <Text style={styles.cardSubtitle}>
            Hesabına giriş yap ve NEO fırsatlarını keşfet.
          </Text>

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
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Şifremi unuttum</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Henüz hesabın yok mu?</Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Kayıt Ol</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Alt not */}
        <Text style={styles.footerText}>
          Üniversite React Native dönem projesi • NEO
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
  forgotButton: {
    marginTop: 10,
    alignItems: "center",
  },
  forgotText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(148,163,184,0.4)",
  },
  dividerText: {
    fontSize: 12,
    color: "#6b7280",
    marginHorizontal: 8,
  },
  registerRow: {
    marginTop: 12,
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
