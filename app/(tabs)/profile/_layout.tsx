// app/(tabs)/profile/_layout.tsx
import { Stack } from "expo-router";

export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="addresses" />
    </Stack>
  );
}
