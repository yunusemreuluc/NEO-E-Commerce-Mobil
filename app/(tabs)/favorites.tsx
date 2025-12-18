// app/(tabs)/favorites.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../../components/ProductCard";
import { useFavorites } from "../../contexts/FavoritesContext";
import type { RootState } from "../../store";
import { useAppSelector } from "../../store/hooks";
import type { Product } from "../../types/Product";

export default function FavoritesScreen() {
  const { favorites } = useFavorites();
  const router = useRouter();
  
  // Redux'tan toplam ürün sayısını gösterelim (hibrit yaklaşım örneği)
  const totalProducts = useAppSelector((state: RootState) => state.products.items.length);

  const hasFavorites = favorites.length > 0;

  const goToProduct = (item: Product) => {
    router.push({
      pathname: "/product",
      params: {
        id: String(item.id),
        name: item.name,
        price: String(item.price),
        image: item.image,
        category: item.category,
        oldPrice: item.oldPrice ? String(item.oldPrice) : "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorilerim</Text>
        <Text style={styles.subtitle}>
          {totalProducts} ürün arasından {favorites.length} favori
        </Text>
      </View>

      {hasFavorites ? (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          // TEK SÜTUN – ALT ALTA
          renderItem={({ item }) => (
            <View style={styles.itemWrapper}>
              <ProductCard product={item} onPress={() => goToProduct(item)} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyBox}>
          <Ionicons name="heart-outline" size={40} color="#FF3B30" />
          <Text style={styles.emptyTitle}>Henüz favorin yok</Text>
          <Text style={styles.emptyText}>
            Ana sayfadan beğendiğin ürünleri kalp ikonuna basarak favorilere
            ekleyebilirsin.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7", paddingHorizontal: 16 },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  listContent: {
    paddingBottom: 16,
  },
  itemWrapper: {
    marginBottom: 12, // kartlar arasında dikey boşluk
  },
  emptyBox: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
});
