import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

interface ImageViewModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Zoom özellikli resim bileşeni
function ZoomableImage({ imageUrl }: { imageUrl: string }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Pinch gesture (zoom)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Minimum ve maksimum zoom sınırları
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
        savedScale.value = 3;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Pan gesture (sürükleme)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double tap gesture (çift dokunma ile zoom)
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        // Zoom out
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const composed = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, pinchGesture),
    panGesture
  );

  return (
    <View style={styles.imageContainer}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.zoomableContainer, animatedStyle]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function ImageViewModal({
  visible,
  images,
  initialIndex = 0,
  onClose
}: ImageViewModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Sonsuz döngü için resim listesini genişlet
  const infiniteImages = React.useMemo(() => {
    if (!images || images.length === 0) return [];
    return images.length > 1 ? [...images, ...images, ...images] : images;
  }, [images]);

  const startIndex = React.useMemo(() => {
    if (!images || images.length <= 1) return initialIndex;
    return images.length + initialIndex;
  }, [images, initialIndex]);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  React.useEffect(() => {
    if (visible && images && images.length > 1 && scrollViewRef.current) {
      // Modal açıldığında ortadaki kopyaya git
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: startIndex * screenWidth,
          animated: false
        });
      }, 100);
    }
  }, [visible, startIndex, images]);

  const handleScroll = React.useCallback((event: any) => {
    if (!images || images.length === 0) return;
    
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    
    if (images.length > 1) {
      // Gerçek index'i hesapla (sonsuz döngü için)
      const realIndex = index % images.length;
      setCurrentIndex(realIndex);
      
      // Sonsuz döngü mantığı
      if (index <= 0) {
        // Başa gelince son kopyaya atla
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: (images.length * 2) * screenWidth,
            animated: false
          });
        }, 50);
      } else if (index >= infiniteImages.length - 1) {
        // Sona gelince ilk kopyaya atla
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: images.length * screenWidth,
            animated: false
          });
        }, 50);
      }
    } else {
      setCurrentIndex(index);
    }
  }, [images, infiniteImages]);

  const goToPrevious = React.useCallback(() => {
    if (!images || images.length <= 1) return;
    
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    
    scrollViewRef.current?.scrollTo({
      x: (images.length + prevIndex) * screenWidth,
      animated: true
    });
  }, [images, currentIndex]);

  const goToNext = React.useCallback(() => {
    if (!images || images.length <= 1) return;
    
    const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIndex);
    
    scrollViewRef.current?.scrollTo({
      x: (images.length + nextIndex) * screenWidth,
      animated: true
    });
  }, [images, currentIndex]);

  // Early return after all hooks
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          {images.length > 1 && (
            <Text style={styles.counter}>
              {currentIndex + 1} / {images.length}
            </Text>
          )}
        </View>

        {/* Image Viewer with Zoom */}
        <View style={styles.imageViewerContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
          >
            {infiniteImages.map((imageUrl, index) => (
              <ZoomableImage
                key={`${index}-${imageUrl}`}
                imageUrl={imageUrl}
              />
            ))}
          </ScrollView>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.leftNavButton]}
                onPress={goToPrevious}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="chevron-back" size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.rightNavButton]}
                onPress={goToNext}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="chevron-forward" size={32} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Dots Indicator */}
        {images.length > 1 && (
          <View style={styles.dotsContainer}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.activeDot
                ]}
                onPress={() => setCurrentIndex(index)}
              />
            ))}
          </View>
        )}

        {/* Zoom Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Çift dokunarak yakınlaştır • Parmakla sürükle • İki parmakla zoom • Ok tuşları ile geçiş
          </Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  imageViewerContainer: {
    flex: 1,
    position: 'relative',
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight - 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableContainer: {
    width: screenWidth - 40,
    height: screenHeight - 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftNavButton: {
    left: 20,
  },
  rightNavButton: {
    right: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '400',
  },
});