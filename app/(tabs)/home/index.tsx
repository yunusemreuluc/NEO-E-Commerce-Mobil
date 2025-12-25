// app/(tabs)/home/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  View
} from "react-native";

import { ApiProduct, Product } from "@/types/Product";
import { getCategories } from "../../../api";
import ProductCard from "../../../components/ProductCard";
import { useCart } from "../../../contexts/CartContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useToast } from "../../../contexts/ToastContext";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchProducts } from "../../../store/slices/productsSlice";

// Kategori tipi
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  parent_id?: number;
  product_count?: number;
}

// Kategori adına göre otomatik icon belirleme
const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
  const name = categoryName.toLowerCase();
  
  // Elektronik kategorileri
  if (name.includes('elektronik') || name.includes('teknoloji') || name.includes('bilgisayar')) {
    return 'tv-outline';
  }
  if (name.includes('telefon') || name.includes('mobil')) {
    return 'phone-portrait-outline';
  }
  
  // Giyim kategorileri
  if (name.includes('giyim') || name.includes('kıyafet') || name.includes('tekstil')) {
    return 'shirt-outline';
  }
  if (name.includes('ayakkabı') || name.includes('bot') || name.includes('sandalet')) {
    return 'footsteps-outline';
  }
  
  // Ev & Yaşam kategorileri
  if (name.includes('ev') || name.includes('yaşam') || name.includes('mobilya')) {
    return 'home-outline';
  }
  if (name.includes('mutfak') || name.includes('yemek')) {
    return 'restaurant-outline';
  }
  
  // Spor kategorileri
  if (name.includes('spor') || name.includes('fitness') || name.includes('egzersiz')) {
    return 'fitness-outline';
  }
  
  // Kozmetik & Sağlık kategorileri
  if (name.includes('kozmetik') || name.includes('güzellik') || name.includes('bakım')) {
    return 'flower-outline';
  }
  if (name.includes('sağlık') || name.includes('ilaç') || name.includes('vitamin')) {
    return 'medical-outline';
  }
  
  // Kitap & Eğitim kategorileri
  if (name.includes('kitap') || name.includes('eğitim') || name.includes('ders')) {
    return 'book-outline';
  }
  
  // Oyuncak & Çocuk kategorileri
  if (name.includes('oyuncak') || name.includes('çocuk') || name.includes('bebek')) {
    return 'happy-outline';
  }
  
  // Otomotiv kategorileri
  if (name.includes('otomotiv') || name.includes('araba') || name.includes('motor')) {
    return 'car-outline';
  }
  
  // Bahçe & Doğa kategorileri
  if (name.includes('bahçe') || name.includes('bitki') || name.includes('çiçek')) {
    return 'leaf-outline';
  }
  
  // Müzik & Sanat kategorileri
  if (name.includes('müzik') || name.includes('enstrüman') || name.includes('sanat')) {
    return 'musical-notes-outline';
  }
  
  // Yiyecek & İçecek kategorileri
  if (name.includes('yiyecek') || name.includes('içecek') || name.includes('gıda')) {
    return 'fast-food-outline';
  }
  
  // Varsayılan icon
  return 'pricetag-outline';
};

// Kategori adının uzunluğuna göre dinamik genişlik hesaplama
const calculateWidth = (text: string): number => {
  const baseWidth = 80;
  const charWidth = 8;
  const padding = 32;
  const iconWidth = 24;
  
  const textWidth = text.length * charWidth;
  const totalWidth = Math.max(baseWidth, textWidth + padding + iconWidth);
  
  return Math.min(totalWidth, 160);
};

// Kategori adının uzunluğuna göre font boyutu ayarlama
const getFontSize = (text: string): number => {
  if (text.length <= 8) return 14;
  if (text.length <= 12) return 13;
  if (text.length <= 16) return 12;
  return 11;
};

export default function HomeScreen() {
  const router = useRouter();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { showToast } = useToast();
  const { unreadCount, fetchNotifications } = useNotifications();
  
  // Redux state - Hibrit yaklaşım: Products Redux'ta, Cart/Favorites Context'te
  const dispatch = useAppDispatch();
  const { items: products, loading, error } = useAppSelector((state: any) => state.products);

  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [search, setSearch] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  
  // Dinamik kategoriler
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);

  // Optimized handlers with useCallback
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleSearchFocus = useCallback(() => {
    setSearchFocused(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setSearchFocused(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch("");
  }, []);

  // Kategori + arama filtresi
  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== "Tümü") {
      list = list.filter((p: ApiProduct) => {
        // Kategori adı ile eşleştir
        if (p.category_name && p.category_name.toLowerCase() === selectedCategory.toLowerCase()) {
          return true;
        }
        // Fallback: eski category field'ı ile eşleştir
        if (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()) {
          return true;
        }
        return false;
      });
    }

    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter((p: ApiProduct) => p.name.toLowerCase().includes(q));
    }

    return list;
  }, [products, selectedCategory, search]);

  const handleSearchSubmit = useCallback(() => {
    if (search.trim().length > 0) {
      // Keyboard'u kapat
      setSearchFocused(false);
      // Toast mesajı göster
      showToast(`"${search.trim()}" için arama yapıldı`);
      // Eğer sonuç yoksa kullanıcıyı bilgilendir
      const searchResults = filteredProducts.length;
      if (searchResults === 0) {
        setTimeout(() => {
          showToast("Aradığınız ürün bulunamadı. Farklı bir kelime deneyin.");
        }, 1000);
      }
    }
  }, [search, filteredProducts.length, showToast]);

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

  // Kategorileri yükle
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categoryList = await getCategories();
      setCategories(categoryList);
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err);
      // Hata durumunda varsayılan kategorileri kullan
      showToast("Kategoriler yüklenemedi, varsayılan kategoriler kullanılıyor");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Ürünleri, kategorileri ve bildirimleri yenile
    await Promise.all([
      dispatch(fetchProducts()),
      loadCategories(),
      fetchNotifications()
    ]);
    setRefreshing(false);
    showToast("Sayfa yenilendi");
  };

  useEffect(() => {
    // İlk yüklemede kategorileri yükle
    loadCategories();
  }, []);

  useEffect(() => {
    // Redux store boşsa ürünleri yükle
    if (products.length === 0 && !loading) {
      loadProducts();
    }
  }, [products.length, loading]);

  const mapToCardProduct = (item: ApiProduct): Product => {
    const priceNumber =
      typeof item.price === "string" ? Number(item.price) : item.price;

    // İndirim hesaplama - birden fazla kaynak kontrol et
    let oldPriceNumber: number | undefined;
    
    // 1. Direkt old_price varsa kullan
    if ((item as any).old_price != null && Number((item as any).old_price) > 0) {
      oldPriceNumber = Number((item as any).old_price);
    }
    // 2. discount_percentage varsa hesapla
    else if (item.discount_percentage && Number(item.discount_percentage) > 0) {
      const discountPercent = Number(item.discount_percentage);
      // Mevcut fiyat indirimli fiyat, eski fiyatı hesapla
      oldPriceNumber = priceNumber / (1 - discountPercent / 100);
    }
    // 3. sale_price varsa, price eski fiyat, sale_price yeni fiyat
    else if ((item as any).sale_price != null && Number((item as any).sale_price) > 0) {
      oldPriceNumber = priceNumber;
      // sale_price'ı yeni fiyat olarak kullan
      const salePriceNumber = Number((item as any).sale_price);
      if (salePriceNumber < priceNumber) {
        // Bu durumda price eski fiyat, sale_price yeni fiyat
        return {
          id: item.id,
          name: item.name,
          price: salePriceNumber,
          oldPrice: priceNumber,
          image: item.image_url ?? "https://via.placeholder.com/600x400.png?text=NEO",
          category: item.category ?? "Genel",
          description: item.short_description || item.description,
        };
      }
    }

    return {
      id: item.id,
      name: item.name,
      price: priceNumber ?? 0,
      oldPrice: oldPriceNumber && oldPriceNumber > (priceNumber ?? 0) ? oldPriceNumber : undefined,
      image: item.image_url ?? "https://via.placeholder.com/600x400.png?text=NEO",
      category: item.category ?? "Genel",
      description: item.short_description || item.description,
    };
  };

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

  // bestDeals değişince slider'ı resetle + interval kur
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

  const ListHeader = useMemo(() => (
    <>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>NEO</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => {
              fetchNotifications(); // Bildirimleri yenile
              router.push('/notifications' as any);
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#111827" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBubble}>
            <Text style={styles.profileText}>Y</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={searchFocused ? "#FF3B30" : "#9CA3AF"} 
        />
        <TextInput
          placeholder="Ürün ara..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          selectionColor="#FF3B30"
          keyboardType="default"
          textContentType="none"
          autoComplete="off"
        />
        {search.length > 0 && (
          <TouchableOpacity 
            onPress={handleClearSearch}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      {/* KATEGORİLER - Yeni Dinamik Sistem */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Kategoriler</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {/* Tümü kategorisi */}
          <TouchableOpacity
            style={[
              styles.dynamicCategoryCard,
              { width: calculateWidth('Tümü') },
              selectedCategory === 'Tümü' && styles.selectedCategoryCard
            ]}
            onPress={() => setSelectedCategory('Tümü')}
            activeOpacity={0.7}
          >
            <View style={[
              styles.categoryIconContainer, 
              selectedCategory === 'Tümü' && styles.selectedIconContainer
            ]}>
              <Ionicons 
                name="grid-outline" 
                size={20} 
                color={selectedCategory === 'Tümü' ? '#FFFFFF' : '#666666'} 
              />
            </View>
            <Text style={[
              styles.dynamicCategoryText,
              { fontSize: getFontSize('Tümü') },
              selectedCategory === 'Tümü' && styles.selectedCategoryText
            ]}>
              Tümü
            </Text>
            <Text style={[
              styles.productCountText,
              selectedCategory === 'Tümü' && styles.selectedProductCountText
            ]}>
              {categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0)} ürün
            </Text>
          </TouchableOpacity>

          {/* Dinamik kategoriler */}
          {categoriesLoading ? (
            // Loading skeleton
            [1, 2, 3, 4].map((item) => (
              <View key={item} style={styles.categoryLoadingSkeleton} />
            ))
          ) : (
            categories
              .filter(cat => cat.is_active)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((category) => {
                const icon = getCategoryIcon(category.name);
                const cardWidth = calculateWidth(category.name);
                const fontSize = getFontSize(category.name);
                const isSelected = selectedCategory === category.name;
                
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.dynamicCategoryCard,
                      { width: cardWidth },
                      isSelected && styles.selectedCategoryCard
                    ]}
                    onPress={() => setSelectedCategory(category.name)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.categoryIconContainer,
                      isSelected && styles.selectedIconContainer
                    ]}>
                      <Ionicons 
                        name={icon} 
                        size={20} 
                        color={isSelected ? '#FFFFFF' : '#666666'} 
                      />
                    </View>
                    <Text 
                      style={[
                        styles.dynamicCategoryText,
                        { fontSize },
                        isSelected && styles.selectedCategoryText
                      ]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                    >
                      {category.name}
                    </Text>
                    {category.product_count !== undefined && category.product_count > 0 && (
                      <Text style={[
                        styles.productCountText,
                        isSelected && styles.selectedProductCountText
                      ]}>
                        {category.product_count} ürün
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
          )}
        </ScrollView>
      </View>

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
  ), [search, searchFocused, selectedCategory, activeScale, bestDeals, dealIndex, categories, categoriesLoading, unreadCount]);

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
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {search.length > 0 
                  ? "Aradığınız ürün bulunamadı" 
                  : "Bu kategoride ürün bulunamadı"}
              </Text>
              {search.length > 0 && (
                <Text style={styles.emptySubtitle}>
                  "{search}" için sonuç yok. Farklı bir arama deneyin.
                </Text>
              )}
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
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5F7',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
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
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchBoxFocused: {
    borderColor: "#FF3B30",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 15,
    color: "#111827",
    minHeight: 20,
  },
  clearButton: {
    padding: 4,
    borderRadius: 12,
  },

  /* CATEGORIES */
  categoriesContainer: {
    marginVertical: 16,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
  },
  dynamicCategoryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryCard: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dynamicCategoryText: {
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  productCountText: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    fontWeight: '400',
  },
  selectedProductCountText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  categoryLoadingSkeleton: {
    width: 100,
    height: 80,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    marginRight: 12,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
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
});