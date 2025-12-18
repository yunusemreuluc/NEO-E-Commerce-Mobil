// app/(tabs)/profile/orders.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OrderItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

type OrderStatus = "preparing" | "shipped" | "delivered" | "cancelled";

type Order = {
  id: string;
  orderNo: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  address: string;
};

// --- ŞİMDİLİK DEMO SİPARİŞ VERİLERİ ---
const MOCK_ORDERS: Order[] = [
  {
    id: "o1",
    orderNo: "#NEO-2025-001",
    date: "12 Kasım 2025, 21:34",
    status: "delivered",
    total: 1249.7,
    address: "Örnek Mah. 123. Sok. No:10 Daire:3, İstanbul / Üsküdar",
    items: [
      {
        id: "p1",
        name: "Kablosuz Bluetooth Kulaklık",
        image:
          "https://images.pexels.com/photos/374870/pexels-photo-374870.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 499.9,
        quantity: 1,
      },
      {
        id: "p2",
        name: "Minimalist Masa Lambası",
        image:
          "https://images.pexels.com/photos/112811/pexels-photo-112811.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 259.9,
        quantity: 1,
      },
      {
        id: "p3",
        name: "Yoga Matı Kaymaz",
        image:
          "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 199.9,
        quantity: 2,
      },
    ],
  },
  {
    id: "o2",
    orderNo: "#NEO-2025-002",
    date: "5 Kasım 2025, 15:10",
    status: "shipped",
    total: 799.9,
    address: "Teknokent Cad. No:45 Kat:6, İstanbul / Maslak",
    items: [
      {
        id: "p4",
        name: "Erkek Spor Ayakkabı Kırmızı",
        image:
          "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
        price: 799.9,
        quantity: 1,
      },
    ],
  },
  {
    id: "o3",
    orderNo: "#NEO-2025-003",
    date: "28 Ekim 2025, 11:02",
    status: "preparing",
    total: 349.9,
    address: "İnönü Mah. 5. Sok. No:7, Ankara / Çankaya",
    items: [
      {
        id: "p5",
        name: "Bayan Günlük Elbise",
        image:
          "https://images.pexels.com/photos/1580044/pexels-photo-1580044.jpeg?auto=compress&cs=tinysrgb&w=800",
        price: 349.9,
        quantity: 1,
      },
    ],
  },
];

type Filter = "all" | "active" | "past";

export default function OrdersScreen() {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredOrders = useMemo(() => {
    if (filter === "all") return MOCK_ORDERS;
    if (filter === "active") {
      // Hazırlanıyor + Kargoda
      return MOCK_ORDERS.filter(
        (o) => o.status === "preparing" || o.status === "shipped"
      );
    }
    // Geçmiş: Teslim edildi + İptal
    return MOCK_ORDERS.filter(
      (o) => o.status === "delivered" || o.status === "cancelled"
    );
  }, [filter]);

  const renderStatusChip = (status: OrderStatus) => {
    let label = "";
    let bg = "";
    let color = "#fff";

    switch (status) {
      case "preparing":
        label = "Hazırlanıyor";
        bg = "#FACC15";
        color = "#1F2933";
        break;
      case "shipped":
        label = "Kargoda";
        bg = "#3B82F6";
        break;
      case "delivered":
        label = "Teslim Edildi";
        bg = "#22C55E";
        break;
      case "cancelled":
        label = "İptal Edildi";
        bg = "#EF4444";
        break;
    }

    return (
      <View style={[styles.statusChip, { backgroundColor: bg }]}>
        <Text style={[styles.statusChipText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const images = item.items.slice(0, 3);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNo}>{item.orderNo}</Text>
            <Text style={styles.orderDate}>{item.date}</Text>
          </View>
          {renderStatusChip(item.status)}
        </View>

        {/* Ürün görselleri */}
        <View style={styles.itemsRow}>
          {images.map((p) => (
            <View key={p.id} style={styles.itemImageWrapper}>
              <Image
                source={{ uri: p.image }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            </View>
          ))}
          {item.items.length > 3 && (
            <View style={styles.moreBadge}>
              <Text style={styles.moreBadgeText}>
                +{item.items.length - 3}
              </Text>
            </View>
          )}
        </View>

        {/* Adres */}
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color="#9CA3AF" />
          <Text style={styles.addressText} numberOfLines={2}>
            {item.address}
          </Text>
        </View>

        {/* Toplam + Detay butonu (ileride detay sayfasına gidebiliriz) */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.totalLabel}>Toplam</Text>
            <Text style={styles.totalText}>
              {item.total.toFixed(2)} ₺
            </Text>
          </View>

          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => {
              // istersek sonra burada /profile/order-detail ekranına push yaparız
              // şimdilik sadece ufak bir mesaj göstermen yeterli olabilir (Alert vs.)
            }}
          >
            <Ionicons name="receipt-outline" size={16} color="#FF3B30" />
            <Text style={styles.detailButtonText}>Detay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Siparişlerim</Text>

      {/* Filtre barı */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        <FilterChip
          label="Tümü"
          active={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <FilterChip
          label="Aktif"
          active={filter === "active"}
          onPress={() => setFilter("active")}
        />
        <FilterChip
          label="Geçmiş"
          active={filter === "past"}
          onPress={() => setFilter("past")}
        />
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons
              name="cube-outline"
              size={40}
              color="#D1D5DB"
            />
            <Text style={styles.emptyTitle}>
              Henüz siparişin yok
            </Text>
            <Text style={styles.emptyText}>
              NEO mağazasını keşfederek ilk siparişini
              oluşturabilirsin.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        active && styles.filterChipActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterChipText,
          active && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
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
    marginBottom: 8,
  },

  filterBar: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  filterChipActive: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
  },
  filterChipText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
  },

  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNo: {
    fontSize: 14,
    fontWeight: "600",
  },
  orderDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "600",
  },

  itemsRow: {
    flexDirection: "row",
    marginBottom: 8,
    marginTop: 4,
  },
  itemImageWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 6,
    backgroundColor: "#E5E7EB",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  moreBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  moreBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#4B5563",
    flex: 1,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  totalText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  detailButtonText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#B91C1C",
  },

  emptyBox: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
});
