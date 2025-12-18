// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useFavorites } from "../../contexts/FavoritesContext";

type TabIconProps = {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  size: number;
  badgeCount?: number;
};

function TabIcon({ iconName, color, size, badgeCount }: TabIconProps) {
  const hasBadge = !!badgeCount && badgeCount > 0;

  return (
    <View
      style={{
        width: size + 10,
        height: size + 10,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={iconName} size={size} color={color} />
      {hasBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount && badgeCount > 9 ? "9+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const { items } = useCart();
  const { favorites } = useFavorites();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const favCount = favorites.length;

  // Kullanıcı yoksa login ekranına at
  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF3B30",
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color, size }) => (
            <TabIcon iconName="home-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoriler",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              iconName="heart-outline"
              color={color}
              size={size}
              badgeCount={favCount}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ai"
        options={{
          title: "NEO AI",
          tabBarIcon: ({ color, size }) => (
            <TabIcon iconName="sparkles-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Sepet",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              iconName="cart-outline"
              color={color}
              size={size}
              badgeCount={cartCount}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <TabIcon iconName="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
