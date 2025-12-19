import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ImageCommentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rating: number;
    comment: string;
    images: ImagePicker.ImagePickerAsset[];
    existingImages?: string[];
  }) => Promise<void>;
  productName: string;
  loading?: boolean;
  isEdit?: boolean;
  initialData?: {
    rating: number;
    comment: string;
    images: any[];
  };
}

const { width: screenWidth } = Dimensions.get('window');
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 1024; // pixels
const JPEG_QUALITY = 0.8;

export default function ImageCommentModal({
  visible,
  onClose,
  onSubmit,
  productName,
  loading = false,
  isEdit = false,
  initialData
}: ImageCommentModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]); // Mevcut resim URL'leri
  const [imageLoading, setImageLoading] = useState(false);

  // Düzenleme modunda initial data'yı yükle
  useEffect(() => {
    if (visible && isEdit && initialData) {
      setRating(initialData.rating);
      setComment(initialData.comment);
      // Mevcut resimleri yükle
      if (initialData.images && Array.isArray(initialData.images)) {
        setExistingImages(initialData.images);
      } else {
        setExistingImages([]);
      }
      setSelectedImages([]); // Yeni seçilen resimler
    } else if (visible && !isEdit) {
      // Yeni yorum için sıfırla
      setRating(5);
      setComment('');
      setSelectedImages([]);
      setExistingImages([]);
    }
  }, [visible, isEdit, initialData]);

  // ImagePicker kullanılabilirlik kontrolü
  const checkImagePickerAvailability = () => {
    if (!ImagePicker || !ImagePicker.MediaTypeOptions) {
      Alert.alert('Hata', 'Resim seçici kullanılamıyor. Lütfen uygulamayı yeniden başlatın.');
      return false;
    }
    return true;
  };

  // İzin kontrolü ve resim seçimi
  const requestPermissions = async () => {
    if (!checkImagePickerAvailability()) return false;
    
    if (Platform.OS !== 'web') {
      try {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
          Alert.alert(
            'İzin Gerekli',
            'Resim eklemek için kamera ve galeri izinleri gerekli.',
            [
              { text: 'İptal', style: 'cancel' },
              { 
                text: 'Ayarlara Git', 
                onPress: () => {
                  Alert.alert('Bilgi', 'Lütfen uygulama ayarlarından izinleri manuel olarak verin.');
                }
              }
            ]
          );
          return false;
        }
      } catch (error) {
        console.error('İzin kontrolü hatası:', error);
        Alert.alert('Hata', 'İzin kontrolü sırasında hata oluştu.');
        return false;
      }
    }
    return true;
  };

  // Resim sıkıştırma ve boyutlandırma
  const processImage = async (imageUri: string): Promise<string> => {
    try {
      // Resim boyutunu kontrol et
      const { width, height } = await new Promise<{width: number, height: number}>((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => resolve({ width, height }),
          (error) => reject(error)
        );
      });

      // Eğer resim zaten küçükse işleme gerek yok
      if (width <= MAX_IMAGE_SIZE && height <= MAX_IMAGE_SIZE) {
        return imageUri;
      }

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: MAX_IMAGE_SIZE, height: MAX_IMAGE_SIZE } }
        ],
        {
          compress: JPEG_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );
      
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Resim işleme hatası:', error);
      // Hata durumunda orijinal URI'yi döndür
      return imageUri;
    }
  };

  // Galeri seçimi
  const pickFromGallery = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const totalImages = selectedImages.length + existingImages.length;
    if (totalImages >= MAX_IMAGES) {
      Alert.alert('Limit', `Maksimum ${MAX_IMAGES} resim ekleyebilirsiniz.`);
      return;
    }

    setImageLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - totalImages,
        quality: 0.8, // Kaliteyi düşür
        exif: false,
        allowsEditing: false, // Düzenlemeyi kapat
        aspect: undefined, // Aspect ratio sınırlaması kaldır
      });

      if (!result.canceled && result.assets) {
        const processedImages = await Promise.all(
          result.assets.map(async (asset) => {
            try {
              const processedUri = await processImage(asset.uri);
              return {
                ...asset,
                uri: processedUri
              };
            } catch (error) {
              console.error('Resim işleme hatası:', error);
              // Hata durumunda orijinal resmi kullan
              return asset;
            }
          })
        );
        
        setSelectedImages(prev => [...prev, ...processedImages]);
      }
    } catch (error) {
      console.error('Galeri seçim hatası:', error);
      Alert.alert('Hata', 'Resim seçilirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setImageLoading(false);
    }
  }, [selectedImages.length]);

  // Kamera çekimi
  const takePhoto = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const totalImages = selectedImages.length + existingImages.length;
    if (totalImages >= MAX_IMAGES) {
      Alert.alert('Limit', `Maksimum ${MAX_IMAGES} resim ekleyebilirsiniz.`);
      return;
    }

    setImageLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8, // Kaliteyi düşür
        exif: false,
        allowsEditing: false, // Düzenlemeyi kapat
      });

      if (!result.canceled && result.assets?.[0]) {
        try {
          const processedUri = await processImage(result.assets[0].uri);
          const processedImage = {
            ...result.assets[0],
            uri: processedUri
          };
          
          setSelectedImages(prev => [...prev, processedImage]);
        } catch (error) {
          console.error('Kamera resmi işleme hatası:', error);
          // Hata durumunda orijinal resmi kullan
          setSelectedImages(prev => [...prev, result.assets[0]]);
        }
      }
    } catch (error) {
      console.error('Kamera çekim hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setImageLoading(false);
    }
  }, [selectedImages.length]);

  // Resim seçim menüsü
  const showImagePicker = () => {
    if (!checkImagePickerAvailability()) return;
    
    Alert.alert(
      'Resim Ekle',
      'Resim ekleme yöntemini seçin',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Galeri', onPress: pickFromGallery },
        { text: 'Kamera', onPress: takePhoto }
      ]
    );
  };

  // Resim kaldırma
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Form gönderimi
  const handleSubmit = async () => {
    if (comment.trim().length < 1) {
      Alert.alert('Hata', 'Yorum boş olamaz.');
      return;
    }

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        images: selectedImages,
        existingImages: existingImages // Mevcut resimleri de gönder
      });
      
      // Form temizle
      setRating(5);
      setComment('');
      setSelectedImages([]);
      setExistingImages([]);
    } catch (error) {
      // Hata yönetimi parent component'te yapılacak
    }
  };

  // Android geri tuşu desteği
  useEffect(() => {
    const backAction = () => {
      if (visible && !loading) {
        onClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible, loading, onClose]);

  // Yıldız render
  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={32}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEdit ? 'Yorumu Düzenle' : 'Değerlendirme Yap'}
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ürün Adı */}
          <Text style={styles.productName}>{productName}</Text>

          {/* Puan Seçimi */}
          <Text style={styles.sectionTitle}>Puanın:</Text>
          {renderStars()}

          {/* Yorum Metni */}
          <Text style={styles.sectionTitle}>Yorumun:</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Ürün hakkındaki düşüncelerini paylaş..."
            multiline
            numberOfLines={6}
            value={comment}
            onChangeText={setComment}
            maxLength={1000}
            editable={!loading}
          />
          <Text style={styles.charCount}>
            {comment.length}/1000 karakter
          </Text>

          {/* Resim Ekleme */}
          <View style={styles.imageSection}>
            <View style={styles.imageSectionHeader}>
              <Text style={styles.sectionTitle}>Resimler (Opsiyonel)</Text>
              <Text style={styles.imageLimit}>
                {selectedImages.length + existingImages.length}/{MAX_IMAGES}
              </Text>
            </View>

            {/* Resim Ekleme Butonu */}
            {(selectedImages.length + existingImages.length) < MAX_IMAGES && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImagePicker}
                disabled={loading || imageLoading}
              >
                {imageLoading ? (
                  <ActivityIndicator size="small" color="#FF3B30" />
                ) : (
                  <Ionicons name="camera-outline" size={24} color="#FF3B30" />
                )}
                <Text style={styles.addImageText}>
                  {imageLoading ? 'Yükleniyor...' : 'Resim Ekle'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Seçilen Resimler */}
            {(selectedImages.length > 0 || existingImages.length > 0) && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imagesContainer}
              >
                {/* Mevcut resimler (düzenleme modunda) */}
                {existingImages.map((imageUrl, index) => {
                  // URL'yi tam hale getir
                  const fullUrl = imageUrl.startsWith('http') 
                    ? imageUrl 
                    : `http://10.8.0.222:4000${imageUrl}`;
                  
                  return (
                    <View key={`existing-${index}`} style={styles.imageWrapper}>
                      <Image source={{ uri: fullUrl }} style={styles.selectedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => {
                          // Mevcut resmi kaldır
                          setExistingImages(prev => prev.filter((_, i) => i !== index));
                        }}
                        disabled={loading}
                      >
                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                      {/* Mevcut resim göstergesi */}
                      <View style={styles.existingImageBadge}>
                        <Text style={styles.existingImageText}>Mevcut</Text>
                      </View>
                    </View>
                  );
                })}
                
                {/* Yeni seçilen resimler */}
                {selectedImages.map((image, index) => (
                  <View key={`new-${index}`} style={styles.imageWrapper}>
                    <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                      disabled={loading}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                    {/* Yeni resim göstergesi */}
                    <View style={styles.newImageBadge}>
                      <Text style={styles.newImageText}>Yeni</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Bilgilendirme */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Yorumunuz moderasyon sonrası yayınlanacaktır. Resimler otomatik olarak optimize edilir.
            </Text>
          </View>
        </ScrollView>

        {/* Alt Butonlar */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity 
            style={styles.cancelButtonBottom}
            onPress={onClose} 
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, loading && styles.disabledText]}>
              İptal
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButtonBottom,
              (loading || comment.trim().length < 1) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit} 
            disabled={loading || comment.trim().length < 1}
          >
            <Text style={[
              styles.submitButtonText, 
              (loading || comment.trim().length < 1) && styles.disabledText
            ]}>
              {loading ? 'Gönderiliyor...' : 'Gönder'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF3B30" />
            <Text style={styles.loadingText}>Gönderiliyor...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  submitButton: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
    marginTop: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  imageSection: {
    marginTop: 16,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageLimit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 16,
  },
  addImageText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  imagesContainer: {
    marginTop: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  cancelButtonBottom: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButtonBottom: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Resim badge'leri
  existingImageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  existingImageText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  newImageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newImageText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
});