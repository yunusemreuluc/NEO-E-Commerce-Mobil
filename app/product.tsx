// app/(tabs)/home/product.tsx

import ImageViewModal from "@/components/ImageViewModal";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { createTables, getTestReviews, testReviewSubmit, testReviewWithImages } from "../api";
import ImageCommentModal from "../components/ImageCommentModal";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import type { Product } from "../types/Product";

// API base URL'i import et
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.241.81.212:4000";

export default function ProductScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    price?: string;
    image?: string;
    images?: string;
    category?: string;
    oldPrice?: string;
  }>();

  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Yorum sistemi state'leri
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [reviewLoading, setReviewLoading] = useState(false);
  
  // Yorum düzenleme state'leri
  const [editingReview, setEditingReview] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Ürün verisi state'i
  const [productData, setProductData] = useState<any>(null);
  const [productLoading, setProductLoading] = useState(false);
  
  // Resim büyütme modal'ı
  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const { user } = useAuth();

  const priceNumber = params.price ? Number(params.price) : 0;
  const oldPriceNumber =
    params.oldPrice && params.oldPrice.length > 0
      ? Number(params.oldPrice)
      : undefined;

  const productImages = useMemo(() => {
    // API'den gelen veri varsa onu kullan
    if (productData?.images && Array.isArray(productData.images) && productData.images.length > 0) {
      return productData.images;
    }
    
    // API'den tek resim varsa
    if (productData?.image_url) {
      return [productData.image_url];
    }
    
    // Parametrelerden resimler
    try {
      if (params.images) {
        const parsed = JSON.parse(params.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // JSON parse hatası
    }
    
    // Fallback: tek resim
    return [params.image ?? "https://via.placeholder.com/400x300.png?text=NEO+Product"];
  }, [productData, params.images, params.image]);

  // API'den ürün verilerini çek
  useEffect(() => {
    const fetchProductData = async () => {
      if (!params.id) return;
      
      setProductLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (response.ok) {
          const products = await response.json();
          const foundProduct = products.find((p: any) => p.id === Number(params.id));
          
          if (foundProduct) {
            setProductData(foundProduct);
          }
        }
      } catch (error) {
        console.error('Ürün verisi çekme hatası:', error);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProductData();
  }, [params.id]);

  const product: Product = useMemo(
    () => {
      // API'den gelen veri varsa onu kullan, yoksa parametreleri kullan
      if (productData) {
        return {
          id: productData.id,
          name: productData.name,
          price: Number(productData.price) || 0,
          oldPrice: productData.old_price ? Number(productData.old_price) : undefined,
          image: productData.image_url || productData.images?.[0] || "https://via.placeholder.com/400x300.png?text=NEO",
          category: productData.category || "Genel",
        };
      }
      
      // Fallback: parametrelerden ürün oluştur
      return {
        id: Number(params.id) || 0,
        name: params.name ?? "Ürün adı",
        price: priceNumber,
        oldPrice: oldPriceNumber,
        image: productImages[0],
        category: params.category ?? "Genel",
      };
    },
    [productData, params.id, params.name, params.category, priceNumber, oldPriceNumber, productImages]
  );

  const isFav = isFavorite(product.id);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  };

  const handleToggleFavorite = () => {
    const wasFav = isFav;
    toggleFavorite(product);
    showToast(wasFav ? "Favorilerden çıkarıldı" : "Favorilere eklendi");
  };

  const handleAddToCart = () => {
    addToCart(product);
    showToast("Sepete eklendi");
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `${product.name} - ${product.price.toFixed(2)} ₺\n\nBu harika ürünü NEO uygulamasında keşfet!`,
        title: product.name,
      });
      
      if (result.action === Share.sharedAction) {
        showToast("Paylaşıldı");
      }
    } catch (error) {
      // Paylaşım hatası - sessizce devam et
    }
  };

  // Yorumları yükle (test endpoint kullan)
  const loadReviews = useCallback(async () => {
    try {
      const data = await getTestReviews(product.id);
      setReviews(data.reviews || []);
      setReviewStats(data.stats || { average_rating: 0, total_reviews: 0 });
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
    }
  }, [product.id]);

  // Tabloları oluştur (ilk yüklemede)
  const initializeTables = useCallback(async () => {
    try {
      await createTables();
      console.log('Tablolar başarıyla oluşturuldu');
    } catch (error) {
      console.warn('Tablo oluşturma hatası (muhtemelen zaten var):', error);
    }
  }, []);

  useEffect(() => {
    if (product.id) {
      initializeTables(); // Tabloları oluştur
      loadReviews(); // Yorumları yükle
    }
  }, [loadReviews, initializeTables]);

  // Resimli yorum gönder
  const handleSubmitReview = async (reviewData: {
    rating: number;
    comment: string;
    images: any[];
  }) => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Yorum yapmak için giriş yapmanız gerekiyor.');
      return;
    }

    setReviewLoading(true);
    try {
      if (reviewData.images.length > 0) {
        // Resimli yorum gönder - test endpoint kullan
        try {
          await testReviewWithImages(
            product.id, 
            reviewData.rating, 
            reviewData.comment, 
            reviewData.images
          );
          showToast("Resimli yorumunuz gönderildi!");
        } catch (imageError: any) {
          console.warn('Resimli yorum gönderilemedi:', imageError);
          
          // Endpoint mevcut değilse kullanıcıyı bilgilendir
          if (imageError.message?.includes('endpoint')) {
            Alert.alert(
              'Bilgi', 
              'Resimli yorum özelliği henüz hazır değil. Yorumunuz resim olmadan gönderilecek.',
              [
                { text: 'İptal', style: 'cancel' },
                { 
                  text: 'Devam Et', 
                  onPress: async () => {
                    try {
                      await testReviewSubmit(product.id, reviewData.rating, reviewData.comment);
                      setShowReviewModal(false);
                      showToast("Yorum gönderildi! (Resimler yüklenemedi)");
                      loadReviews();
                    } catch (fallbackError) {
                      Alert.alert('Hata', 'Yorum gönderilemedi.');
                    }
                  }
                }
              ]
            );
            return; // Modal'ı açık bırak
          }
          
          // Diğer hatalar için resimsiz gönder
          await testReviewSubmit(product.id, reviewData.rating, reviewData.comment);
          showToast("Yorum gönderildi! (Resimler yüklenemedi)");
        }
      } else {
        // Resimsiz yorum gönder
        await testReviewSubmit(product.id, reviewData.rating, reviewData.comment);
        showToast("Yorumunuz gönderildi!");
      }
      
      setShowReviewModal(false);
      loadReviews(); // Yorumları yenile
    } catch (error: any) {
      console.error('Yorum gönderme hatası:', error);
      Alert.alert('Hata', error.message || 'Yorum gönderilirken hata oluştu.');
      throw error; // Modal'ın kendi hata yönetimi için
    } finally {
      setReviewLoading(false);
    }
  };

  // Yorum silme fonksiyonu
  const handleDeleteReview = useCallback(async (reviewId: number) => {
    Alert.alert(
      'Yorumu Sil',
      'Bu yorumu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/comments/user/${reviewId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: user?.id || 1
                }),
              });

              if (response.ok) {
                showToast('Yorumunuz silindi');
                loadReviews(); // Yorumları yenile
              } else {
                Alert.alert('Hata', 'Yorum silinemedi');
              }
            } catch (error) {
              console.error('Yorum silme hatası:', error);
              Alert.alert('Hata', 'Yorum silinemedi');
            }
          }
        }
      ]
    );
  }, [loadReviews]);

  // Yorum düzenleme fonksiyonu
  const handleEditReview = useCallback((review: any) => {
    setEditingReview(review);
    setShowEditModal(true);
  }, []);

  // Yorum güncelleme fonksiyonu
  const handleUpdateReview = async (reviewData: {
    rating: number;
    comment: string;
    images: any[];
    existingImages?: string[];
  }) => {
    if (!editingReview) return;

    setReviewLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/comments/user/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Auth header eklenebilir
        },
        body: JSON.stringify({
          rating: reviewData.rating,
          comment: reviewData.comment,
          user_id: user?.id || 1
          // Resim güncelleme şimdilik atlanabilir
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingReview(null);
        showToast('Yorumunuz güncellendi');
        loadReviews(); // Yorumları yenile
      } else {
        Alert.alert('Hata', 'Yorum güncellenemedi');
      }
    } catch (error) {
      console.error('Yorum güncelleme hatası:', error);
      Alert.alert('Hata', 'Yorum güncellenemedi');
    } finally {
      setReviewLoading(false);
    }
  };

  // Yıldız render fonksiyonu
  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={size}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.screen}>
      {/* Üst bar: geri + başlık + kalp */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={24}
              color={isFav ? "#FF3B30" : "#111"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={handleShare}
          >
            <Ionicons
              name="share-outline"
              size={24}
              color="#111"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Resim Galerisi */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / Dimensions.get('window').width
              );
              setCurrentImageIndex(index);
            }}
          >
            {productImages.map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedImages(productImages);
                  setSelectedImageIndex(index);
                  setImageViewVisible(true);
                }}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Resim Göstergeleri */}
          {productImages.length > 1 && (
            <View style={styles.imageIndicators}>
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {product.category && (
            <Text style={styles.category}>{product.category}</Text>
          )}

          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{product.price.toFixed(2)} ₺</Text>
              {product.oldPrice && (
                <Text style={styles.oldPrice}>
                  {product.oldPrice.toFixed(2)} ₺
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.quickAddButton} 
              onPress={handleAddToCart}
            >
              <Ionicons name="bag-add" size={20} color="#fff" />
              <Text style={styles.quickAddButtonText}>Sepete Ekle</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Açıklama</Text>
          <Text style={styles.description}>
            Bu alan, veritabanından gelecek ürün açıklaması için ayrılmıştır.
            Şu anda demo metin gösteriliyor. Gerçek projede burada ürünün
            detaylı özelliklerini, malzeme bilgisini, kargo ve iade koşullarını
            yazacağız.
          </Text>

          <Text style={styles.sectionTitle}>Öne Çıkan Özellikler</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Yüksek kalite</Text>
            <Text style={styles.featureItem}>• Uygun fiyat</Text>
            <Text style={styles.featureItem}>• Hızlı teslimat</Text>
          </View>

          {/* Yorumlar Bölümü */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsContainer}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
                {reviewStats.total_reviews > 0 && (
                  <View style={styles.ratingInfo}>
                    <View style={styles.starsRow}>
                      {renderStars(Math.round(parseFloat(String(reviewStats.average_rating))))}
                    </View>
                    <Text style={styles.ratingText}>
                      {parseFloat(String(reviewStats.average_rating)).toFixed(1)} ({reviewStats.total_reviews} değerlendirme)
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => setShowReviewModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF3B30" />
                <Text style={styles.addReviewText}>Değerlendirme Yap</Text>
              </TouchableOpacity>

              {reviews.length > 0 ? (
                <ScrollView 
                  style={styles.reviewsScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <View style={styles.reviewsList}>
                    {reviews.map((review) => (
                      <View key={review.id} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <View style={styles.reviewerInfo}>
                            <Text style={styles.reviewerName}>{review.user_name}</Text>
                            <View style={styles.starsRow}>
                              {renderStars(review.rating, 14)}
                            </View>
                          </View>
                          
                          {/* Kullanıcı kendi yorumuysa düzenle/sil butonları */}
                          {user && (user.name === review.user_name || user.id === review.user_id) && (
                            <View style={styles.reviewActions}>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleEditReview(review)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Ionicons name="create-outline" size={18} color="#6B7280" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleDeleteReview(review.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                        
                        {/* Yorum Resimleri */}
                        {review.images && review.images.length > 0 && (
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.reviewImagesContainer}
                          >
                            {review.images.map((imageUrl: string, index: number) => {
                              // URL'yi düzgün oluştur
                              const fullImageUrl = imageUrl.startsWith('http') 
                                ? imageUrl 
                                : `${API_BASE_URL}${imageUrl}`;
                              
                              // Resim URL'i hazırlandı
                              
                              return (
                                <TouchableOpacity
                                  key={index}
                                  onPress={() => {
                                    // Resim büyütme modal'ını aç
                                    const fullUrls = review.images.map((url: string) => 
                                      url.startsWith('http') ? url : `${API_BASE_URL}${url}`
                                    );
                                    setSelectedImages(fullUrls);
                                    setSelectedImageIndex(index);
                                    setImageViewVisible(true);
                                  }}
                                >
                                  <Image
                                    source={{ uri: fullImageUrl }}
                                    style={styles.reviewImage}
                                    resizeMode="cover"
                                    onError={() => {
                                      // Resim yükleme hatası
                                    }}
                                    onLoad={() => {
                                      // Resim başarıyla yüklendi
                                    }}
                                  />
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        )}
                        
                        <Text style={styles.reviewDate}>
                          {new Date(review.created_at).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <Text style={styles.noReviews}>
                  Henüz değerlendirme yapılmamış. İlk değerlendirmeyi sen yap!
                </Text>
              )}
            </View>
          </View>


        </View>
      </ScrollView>

      {/* Gelişmiş Yorum Ekleme Modal */}
      <ImageCommentModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        productName={product.name}
        loading={reviewLoading}
      />

      {/* Yorum Düzenleme Modal */}
      <ImageCommentModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingReview(null);
        }}
        onSubmit={handleUpdateReview}
        productName={product.name}
        loading={reviewLoading}
        isEdit={true}
        initialData={editingReview ? {
          rating: editingReview.rating,
          comment: editingReview.comment,
          images: editingReview.images || []
        } : undefined}
      />

      {/* Resim Büyütme Modal */}
      <ImageViewModal
        visible={imageViewVisible}
        images={selectedImages}
        initialIndex={selectedImageIndex}
        onClose={() => setImageViewVisible(false)}
      />

      {/* Bottom bar'ın hemen üstünde toast */}
      {toastVisible && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    backgroundColor: "#F5F5F7",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: Dimensions.get('window').width,
    height: 260,
    backgroundColor: "#ddd",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeIndicator: {
    backgroundColor: "#FF3B30",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  category: {
    fontSize: 13,
    color: "#777",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF3B30",
  },
  oldPrice: {
    fontSize: 16,
    color: "#999",
    textDecorationLine: "line-through",
  },
  quickAddButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  quickAddButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  featureList: {
    marginTop: 4,
  },
  featureItem: {
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
  },

  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 10,
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  toastText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  
  // Yorum sistemi stilleri
  reviewsSection: {
    marginTop: 24,
  },
  reviewsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewsHeader: {
    marginBottom: 12,
  },
  ratingInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    color: "#666",
  },
  addReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginBottom: 16,
  },
  addReviewText: {
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "500",
  },
  reviewsScrollView: {
    maxHeight: 300,
    marginTop: 8,
  },
  reviewsList: {
    gap: 12,
  },
  reviewItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  reviewComment: {
    fontSize: 14,
    color: "#444",
    lineHeight: 18,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  reviewImagesContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  reviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#E5E7EB",
  },

  noReviews: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 16,
  },
  
  // Modal stilleri
  modalContainer: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  modalCancel: {
    fontSize: 16,
    color: "#666",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalProductName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  ratingSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  reviewInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
});
