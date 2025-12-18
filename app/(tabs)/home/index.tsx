// app/(tabs)/home/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ProductCard from "../../../components/ProductCard";
import { useCart } from "../../../contexts/CartContext";
import { useToast } from "../../../contexts/ToastContext";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchProducts } from "../../../store/slices/productsSlice";
import type { ApiProduct, Product } from "../../../types/Product";

// Kategori konfigürasyonu
const CATEGORY_CONFIG = [
  { label: "Tümü", value: "Tümü", icon: "grid-outline" as const },
  { label: "Elektronik", value: "Elektronik", icon: "tv-outline" as const },
  { label: "Moda", value: "Moda", icon: "shirt-outline" as const },
  { label: "Ev", value: "Ev", icon: "home-outline" as const },
  { label: "Spor", value: "Spor", icon: "barbell-outline" as const },
  { label: "Ofis", value: "Ofis", icon: "briefcase-outline" as const },
];



export default function HomeScreen() {
  const router = useRouter();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { showToast } = useToast();
  
  // Redux state - Hibrit yaklaşım: Products Redux'ta, Cart/Favorites Context'te
  const dispatch = useAppDispatch();
  const { items: products, loading, error } = useAppSelector((state: any) => state.products);

  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [search, setSearch] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // kategori animasyonu
  const activeScale = useRef(new Animated.Value(1)).current;
  const [dealIndex, setDealIndex] = useState(0); // slider index

  useEffect(() => {
    Animated.spring(activeScale, {
      toValue: 1.05,
      friction: 6,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(activeScale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedCategory]);

  const loadProducts = () => {
    dispatch(fetchProducts());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchProducts());
    setRefreshing(false);
  };

  useEffect(() => {
    // Redux store boşsa ürünleri yükle
    if (products.length === 0 && !loading) {
      loadProducts();
    }
  }, [products.length, loading]);

 const mapToCardProduct = (item: ApiProduct): Product => {
  const priceNumber =
    typeof item.price === "string" ? Number(item.price) : item.price;

  const oldPriceNumber =
    (item as any).old_price != null
      ? Number((item as any).old_price)
      : undefined;

  return {
    id: item.id,
    name: item.name,
    price: priceNumber ?? 0,
    oldPrice: oldPriceNumber && oldPriceNumber > (priceNumber ?? 0) ? oldPriceNumber : undefined,
    image: item.image_url ?? "https://via.placeholder.com/600x400.png?text=NEO",
    category: item.category,
  };
};


  // Kategori + arama filtresi
  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== "Tümü") {
      list = list.filter((p: ApiProduct) => {
        if (!p.category) return false;
        return p.category.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter((p: ApiProduct) => p.name.toLowerCase().includes(q));
    }

    return list;
  }, [products, selectedCategory, search]);

  // En iyi fırsatlar: seçili kategoride indirim yüzdesi en yüksek ilk 3
  const bestDeals: Product[] = useMemo(() => {
    const base =
      selectedCategory === "Tümü"
        ? products
        : products.filter(
            (p: ApiProduct) =>
              p.category &&
              p.category.toLowerCase() === selectedCategory.toLowerCase()
          );

    const mapped = base.map(mapToCardProduct);

    // sadece gerçekten indirim olanlar (oldPrice var)
    const withDiscount = mapped.filter((p: Product) => !!p.oldPrice && p.oldPrice > p.price);

    // indirim oranına göre sırala
    withDiscount.sort((a: Product, b: Product) => {
      const discA = (a.oldPrice! - a.price) / a.oldPrice!;
      const discB = (b.oldPrice! - b.price) / b.oldPrice!;
      return discB - discA;
    });

    return withDiscount.slice(0, 3);
  }, [products, selectedCategory]);

  // bestDeals değişince slider’ı resetle + interval kur
  useEffect(() => {
    if (bestDeals.length === 0) {
      setDealIndex(0);
      return;
    }
    setDealIndex(0);
    const id = setInterval(() => {
      setDealIndex((prev) =>
        bestDeals.length === 0 ? 0 : (prev + 1) % bestDeals.length
      );
    }, 2500);

    return () => clearInterval(id);
  }, [bestDeals]);

  // 🛒 sepete ekle / çıkar
  const handleToggleCart = (product: Product) => {
    const inCart = isInCart(product.id);
    if (inCart) {
      removeFromCart(product.id);
      showToast("Sepetten kaldırıldı");
    } else {
      addToCart(product);
      showToast("Sepete eklendi");
    }
  };

  // 🔍 detay sayfasına git
  const handleOpenDetail = (product: Product, apiProduct?: ApiProduct) => {
    const images = apiProduct?.images ? JSON.stringify(apiProduct.images) : undefined;
    
    router.push({
      pathname: "/product" as any,
      params: {
        id: product.id.toString(),
        name: product.name,
        price: product.price.toString(),
        image: product.image,
        images: images,
        category: product.category,
        oldPrice: product.oldPrice?.toString(),
      },
    });
  };

  const renderProduct = ({ item }: { item: ApiProduct }) => {
    const cardProduct = mapToCardProduct(item);
    const inCart = isInCart(cardProduct.id);

    return (
      <ProductCard
        product={cardProduct}
        style={{ flex: 1 }}
        inCart={inCart}
        onPress={() => handleOpenDetail(cardProduct, item)}
        onAddToCart={() => handleToggleCart(cardProduct)}
      />
    );
  };

  const ListHeader = () => (
    <>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>NEO</Text>

        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
          <TouchableOpacity style={styles.profileBubble}>
            <Text style={styles.profileText}>Y</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Ürün ara..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* KATEGORİLER */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScrollContent}
      >
        {CATEGORY_CONFIG.map((cat) => {
          const isActive = cat.value === selectedCategory;
          const ChipWrapper = isActive ? Animated.View : View;

          return (
            <TouchableOpacity
              key={cat.value}
              activeOpacity={0.9}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <ChipWrapper
                style={[
                  styles.categoryChipWrapper,
                  isActive && { transform: [{ scale: activeScale }] },
                ]}
              >
                {isActive ? (
                  <LinearGradient
                    colors={["#FF3B30", "#FF6B4A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryChip}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={16}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.categoryTextActive}>{cat.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.categoryChip, styles.categoryChipInactive]}>
                    <Ionicons
                      name={cat.icon}
                      size={16}
                      color="#4B5563"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.categoryText}>{cat.label}</Text>
                  </View>
                )}
              </ChipWrapper>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* EN İYİ FIRSATLAR */}
      {bestDeals.length > 0 && (
        <View style={styles.bestDeals}>
          <Text style={styles.bestDealsTitle}>En İyi Fırsatlar</Text>
          <Text style={styles.bestDealsSubtitle}>
            Seçili kategoride en yüksek indirimli ürünler
          </Text>

          {bestDeals[dealIndex] && (
            <View style={{ width: "100%" }}>
              <ProductCard
                product={bestDeals[dealIndex]}
                style={styles.bestDealsCard}
                inCart={isInCart(bestDeals[dealIndex].id)}
                onPress={() => handleOpenDetail(bestDeals[dealIndex])}
                onAddToCart={() => handleToggleCart(bestDeals[dealIndex])}
              />
            </View>
          )}

          <View style={styles.dealDots}>
            {bestDeals.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setDealIndex(idx)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View
                  style={[
                    styles.dealDot,
                    idx === dealIndex && styles.dealDotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadProducts()}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{
            paddingBottom: 20,
            paddingTop: 8,
            rowGap: 12,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Bu kategoride ürün bulunamadı.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111827",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profileBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    color: "#fff",
    fontWeight: "700",
  },

  /* SEARCH */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 15,
    color: "#111827",
  },

  /* CATEGORIES */
  categoriesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 8,
  },
  categoryChipWrapper: {
    marginRight: 8,
  },
  categoryChip: {
    width: 95,
    height: 40,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChipInactive: {
    backgroundColor: "#E5E7EB",
  },
  categoryText: {
    fontSize: 13,
    color: "#374151",
  },
  categoryTextActive: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },

  /* BEST DEALS */
  bestDeals: {
    backgroundColor: "#FFE4E6",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 24,
  },
  bestDealsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B91C1C",
  },
  bestDealsSubtitle: {
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 10,
  },
  bestDealsCard: {
    borderRadius: 18,
  },
  dealDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },
  dealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FCA5A5",
  },
  dealDotActive: {
    width: 18,
    borderRadius: 999,
    backgroundColor: "#EF4444",
  },

  /* STATES */
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#6B7280",
  },
  errorText: {
    color: "#DC2626",
    marginBottom: 8,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FF3B30",
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyText: {
    color: "#6B7280",
  },
});
