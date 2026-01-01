// app/(tabs)/ai/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductCard from '../../../components/ProductCard';
import { useCart } from '../../../contexts/CartContext';
import { Product } from '../../../types/Product';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  products?: Product[];
  timestamp: Date;
}

export default function AIScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Merhaba! Ben NEO AI asistanınızım. Size nasıl yardımcı olabilirim? \n\nÖrnek: "2000 TL\'lik siyah spor ayakkabı bul" veya "iPhone 15 fiyatları nedir?"',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useCart();
  const scrollViewRef = useRef<ScrollView>(null);

  // Mesajlar değiştiğinde otomatik scroll
  useEffect(() => {
    // Kısa bir gecikme ile scroll et (render tamamlandıktan sonra)
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // Chat'i sıfırlama fonksiyonu
  const resetChat = () => {
    setMessages([
      {
        id: '1',
        text: 'Merhaba! Ben NEO AI asistanınızım. Size nasıl yardımcı olabilirim? \n\nÖrnek: "2000 TL\'lik siyah spor ayakkabı bul" veya "iPhone 15 fiyatları nedir?"',
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setInputText('');
    setIsLoading(false);
    // Chat sıfırlandığında üste scroll et
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  // Loading durumunda da scroll et - şimdilik kaldırıldı
  // useEffect(() => {
  //   if (isLoading) {
  //     setTimeout(() => {
  //       flatListRef.current?.scrollToEnd({ animated: true });
  //     }, 100);
  //   }
  // }, [isLoading]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Klavyeyi kapat
    Keyboard.dismiss();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // AI arama API'sini çağır
      const response = await fetch(`http://10.77.252.212:4000/api/ai/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputText.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: data.data.ai_response || 'Arama sonuçlarınız hazır!',
          isUser: false,
          products: data.data.products || [],
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || 'Arama başarısız');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/product' as any,
      params: {
        id: product.id.toString(),
        name: product.name,
        price: product.price.toString(),
        image: product.image,
        category: product.category,
      },
    });
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    Alert.alert('Başarılı', `${product.name} sepete eklendi!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="sparkles" size={24} color="#FF3B30" />
          <Text style={styles.headerTitle}>NEO AI</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.headerSubtitle}>Akıllı Ürün Asistanı</Text>
          <TouchableOpacity
            onPress={resetChat}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: '#F2F2F7',
            }}
          >
            <Ionicons name="refresh" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages - Basit View */}
      <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => (
            <View key={item.id}>
              {/* Mesaj balonu */}
              <View style={{ 
                marginBottom: 16,
                alignItems: item.isUser ? 'flex-end' : 'flex-start'
              }}>
                <View style={{
                  maxWidth: '80%',
                  backgroundColor: item.isUser ? '#FF3B30' : '#FFFFFF',
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: item.isUser ? 0 : 2,
                  borderColor: item.isUser ? 'transparent' : '#E5E5EA',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2
                }}>
                  <Text style={{
                    fontSize: 16,
                    lineHeight: 22,
                    color: item.isUser ? '#FFFFFF' : '#000000'
                  }}>
                    {item.text}
                  </Text>
                </View>
                
                {/* Zaman damgası */}
                <Text style={{
                  fontSize: 12,
                  color: '#8E8E93',
                  marginTop: 4
                }}>
                  {item.timestamp.toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>

              {/* Ürün kutusu - Ayrı box */}
              {item.products && item.products.length > 0 && (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#E5E5EA',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: 12
                  }}>
                    🛍️ Bulunan Ürünler ({item.products.length})
                  </Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 4 }}
                  >
                    {item.products.map((product, pIndex) => (
                      <View
                        key={`${item.id}-${product.id}-${pIndex}`}
                        style={{
                          width: 140,
                          marginRight: 8,
                        }}
                      >
                        <ProductCard
                          product={product}
                          onPress={() => handleProductPress(product)}
                          onAddToCart={() => handleAddToCart(product)}
                          style={{
                            width: '100%',
                            minHeight: 180,
                            padding: 6,
                            transform: [{ scale: 0.9 }],
                          }}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBubble}>
            <Text style={styles.loadingText}>NEO AI düşünüyor</Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </View>
      )}

      {/* Input - Keyboard için optimize */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ne arıyorsunuz? Örn: 2000 TL'lik siyah ayakkabı"
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? '#FFFFFF' : '#8E8E93'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#FF3B30',
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  productsContainer: {
    marginTop: 12,
  },
  productsScrollContent: {
    paddingHorizontal: 4,
  },
  productCardWrapper: {
    width: 140,
    marginRight: 8,
  },
  productCard: {
    width: '100%',
    minHeight: 180,
    padding: 6,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8E8E93',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#F2F2F7',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
});