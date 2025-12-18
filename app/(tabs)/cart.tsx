// app/(tabs)/cart.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart, type CartItem } from "../../contexts/CartContext";

export default function CartScreen() {
  const { items, totalPrice, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const router = useRouter();

  const [confirmVisible, setConfirmVisible] = useState(false);

  const hasItems = items.length > 0;

  const goToProduct = (item: CartItem) => {
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

  const handleClearPress = () => {
    setConfirmVisible(true);
  };

  const handleConfirmClear = () => {
    clearCart();
    setConfirmVisible(false);
  };

  const handleCancelClear = () => {
    setConfirmVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sepetim</Text>

      {hasItems ? (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <TouchableOpacity onPress={() => goToProduct(item)}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                </TouchableOpacity>

                <View style={styles.itemInfo}>
                  <TouchableOpacity onPress={() => goToProduct(item)}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.itemPrice}>
                    {(item.price * item.quantity).toFixed(2)} ₺
                  </Text>

                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      <Ionicons name="add" size={18} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.trashButton}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.summary}>
            <View className="summaryRow" style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Toplam</Text>
              <Text style={styles.summaryValue}>
                {totalPrice.toFixed(2)} ₺
              </Text>
            </View>

            <View style={styles.summaryButtons}>
              <TouchableOpacity
                style={[styles.summaryButton, styles.clearButton]}
                onPress={handleClearPress}
              >
                <Text style={styles.clearText}>Sepeti Temizle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.summaryButton, styles.checkoutButton]}
              >
                <Text style={styles.checkoutText}>Siparişi Tamamla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyBox}>
          <Ionicons name="cart-outline" size={40} color="#FF3B30" />
          <Text style={styles.emptyTitle}>Sepetin boş</Text>
          <Text style={styles.emptyText}>
            Ana sayfadan ürün eklediğinde burada göreceksin.
          </Text>
        </View>
      )}

      {/* 🔔 Şekilli onay kutusu (custom modal) */}
      {confirmVisible && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="warning-outline" size={28} color="#FF3B30" />
            </View>

            <Text style={styles.confirmTitle}>Emin misin?</Text>
            <Text style={styles.confirmText}>
              Sepetteki tüm ürünler silinecek. Bu işlemi geri alamazsın.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancel]}
                onPress={handleCancelClear}
              >
                <Text style={styles.confirmCancelText}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmDelete]}
                onPress={handleConfirmClear}
              >
                <Text style={styles.confirmDeleteText}>Evet, temizle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    elevation: 2,
    alignItems: "center",
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#eee",
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF3B30",
    marginBottom: 6,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  trashButton: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  summary: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF3B30",
  },
  summaryButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  summaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  clearText: {
    color: "#FF3B30",
    fontWeight: "600",
  },
  checkoutButton: {
    backgroundColor: "#FF3B30",
  },
  checkoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyBox: {
    marginTop: 60,
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

  /* 🔔 Onay kutusu stilleri */
  confirmOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFE4E6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  confirmText: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  confirmCancel: {
    backgroundColor: "#F3F3F3",
  },
  confirmCancelText: {
    color: "#333",
    fontWeight: "600",
  },
  confirmDelete: {
    backgroundColor: "#FF3B30",
  },
  confirmDeleteText: {
    color: "#fff",
    fontWeight: "600",
  },
});
