// components/ProductCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { useFavorites } from "../contexts/FavoritesContext";

import type { Product } from "../types/Product";

type Props = {
  product: Product;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  onAddToCart?: () => void;                  // 🛒 Home için
  onToggleFavorite?: (isNowFavorite: boolean) => void; // ❤️ toast için
  inCart?: boolean;                          // kart sepette mi?
};

export default function ProductCard({
  product,
  onPress,
  style,
  onAddToCart,
  onToggleFavorite,
  inCart = false,
}: Props) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const isFav = isFavorite(product.id);

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100
        )
      : null;

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    const wasFav = isFav;
    toggleFavorite(product);
    if (onToggleFavorite) {
      onToggleFavorite(!wasFav);
    }
  };

  const handleCartPress = (e: any) => {
    if (!onAddToCart) return;
    e.stopPropagation();
    onAddToCart();
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Görsel + rozetler */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* İndirim rozeti */}
        {discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-%{discount}</Text>
          </View>
        )}

        {/* Favori kalp butonu */}
        <TouchableOpacity
          style={styles.favButton}
          onPress={handleFavoritePress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={18}
            color={isFav ? "#FF3B30" : "#fff"}
          />
        </TouchableOpacity>

        {/* Sepete ekle + butonu */}
        {onAddToCart && (
          <TouchableOpacity
            style={[
              styles.cartButton,
              inCart && styles.cartButtonActive,
            ]}
            onPress={handleCartPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={inCart ? "checkmark" : "add"}
              size={18}
              color={inCart ? "#fff" : "#FF3B30"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Ürün adı */}
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>

      {/* Fiyatlar */}
      <View style={styles.bottomRow}>
        <Text style={styles.price}>{product.price.toFixed(2)} ₺</Text>
        {product.oldPrice && (
          <Text style={styles.oldPrice}>
            {product.oldPrice.toFixed(2)} ₺
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 10,
    elevation: 3,
    width: "100%",
    minHeight: 240,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    backgroundColor: "#eee",
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  discountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  favButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  cartButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  cartButtonActive: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
  },
  name: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6, // fiyatı biraz aşağı aldık
    gap: 6,
  },
  price: {
    color: "#FF3B30",
    fontWeight: "700",
    fontSize: 15,
  },
  oldPrice: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    fontSize: 13,
  },
});
