// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from 'react-redux';

import { NotificationProvider } from "@/contexts/NotificationContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AddressProvider } from "../contexts/AddressContext";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import { OrderProvider } from "../contexts/OrderContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import { ToastProvider } from "../contexts/ToastContext";
import { store } from "../store";

function AppContent() {
  return (
    <>
      <StatusBar
        style="dark"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          <SettingsProvider>
            <FavoritesProvider>
              <CartProvider>
                <AddressProvider>
                  <OrderProvider>
                    <NotificationProvider>
                      <ToastProvider>
                        <AppContent />
                      </ToastProvider>
                    </NotificationProvider>
                  </OrderProvider>
                </AddressProvider>
              </CartProvider>
            </FavoritesProvider>
          </SettingsProvider>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  );
}
