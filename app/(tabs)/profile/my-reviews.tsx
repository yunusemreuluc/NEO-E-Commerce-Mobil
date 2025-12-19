// app/(tabs)/profile/my-reviews.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UserReview = {
  id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
  status: string;
  product_name: string;
  product_image: string;
  images: Array<{
    image_url: string;
    image_type: string;
  }>;
};

export default function MyReviewsScreen() {
  const router = useRouter();

  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcının yorumlarını getir
  const fetchUserReviews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('http://10.241.81.212:4000/comments/user/my-reviews');
      
      if (!response.ok) {
        throw new Error('Yorumlar getirilemedi');
      }

      const data = await response.json();
      
      if (data.success) {
        setUserReviews(data.reviews || []);
      } else {
        throw new Error(data.message || 'Yorumlar getirilemedi');
      }
    } catch (err: any) {
      setError(err.message || 'Yorumlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#22C55E';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'pending': return 'Beklemede';
      case 'rejected': return 'Reddedildi';
      default: return 'Bilinmiyor';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? "star" : "star-outline"}
        size={16}
        color={i < rating ? "#F59E0B" : "#D1D5DB"}
      />
    ));
  };

  const renderReviewCard = ({ item }: { item: UserReview }) => {
    return (
      <TouchableOpacity
        style={styles.reviewCard}
        onPress={() => router.push(`/product?id=${item.product_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.reviewProductInfo}>
            {item.product_image && (
              <Image
                source={{ uri: item.product_image }}
                style={styles.reviewProductImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.reviewProductDetails}>
              <Text style={styles.reviewProductName} numberOfLines={2}>
                {item.product_name || 'Ürün adı bulunamadı'}
              </Text>
              <View style={styles.reviewStarsRow}>
                {renderStars(item.rating)}
              </View>
              <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          
          <View style={[styles.reviewStatus, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.reviewStatusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {item.comment && (
          <Text style={styles.reviewComment}>
            {item.comment}
          </Text>
        )}

        {item.images && item.images.length > 0 && (
          <View style={styles.reviewImagesRow}>
            {item.images.slice(0, 4).map((img, index) => (
              <View key={index} style={styles.reviewImageContainer}>
                <Image
                  source={{ uri: img.image_url }}
                  style={styles.reviewImage}
                  resizeMode="cover"
                />
                {img.image_type && (
                  <View style={styles.reviewImageBadge}>
                    <Text style={styles.reviewImageBadgeText}>
                      {img.image_type === 'base64' ? 'B64' : 
                       img.image_type === 'url' ? 'URL' : 'FILE'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {item.images.length > 4 && (
              <View style={styles.reviewMoreImages}>
                <Text style={styles.reviewMoreImagesText}>+{item.images.length - 4}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>Henüz yorum yapmadınız</Text>
      <Text style={styles.emptySubtitle}>
        Satın aldığınız ürünler hakkında yorum yaparak diğer kullanıcılara yardımcı olabilirsiniz
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/(tabs)/home')}
      >
        <Text style={styles.emptyButtonText}>Ürünleri Keşfet</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
      <Text style={styles.errorTitle}>Yorumlar yüklenemedi</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => fetchUserReviews()}
      >
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.title}>Yorumlarım</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Yorumlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Yorumlarım</Text>
        <View style={styles.placeholder} />
      </View>

      {error ? (
        renderErrorState()
      ) : userReviews.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={userReviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReviewCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUserReviews(true)}
              colors={['#FF3B30']}
              tintColor="#FF3B30"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reviewProductInfo: {
    flexDirection: "row",
    flex: 1,
    marginRight: 12,
  },
  reviewProductImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  reviewProductDetails: {
    flex: 1,
    marginLeft: 12,
  },
  reviewProductName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 6,
  },
  reviewStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  reviewStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reviewStatusText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  reviewComment: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewImagesRow: {
    flexDirection: "row",
    gap: 8,
  },
  reviewImageContainer: {
    position: "relative",
  },
  reviewImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  reviewImageBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewImageBadgeText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "600",
  },
  reviewMoreImages: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewMoreImagesText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#EF4444",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
});