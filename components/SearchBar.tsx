import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getSearchSuggestions } from '../api';

interface SearchSuggestion {
  text: string;
  type: 'product' | 'brand' | 'category';
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({ 
  placeholder = "Ürün, marka veya kategori ara...",
  onSearch,
  showSuggestions = true,
  autoFocus = false
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Son aramaları yükle (AsyncStorage'dan)
    loadRecentSearches();
  }, []);

  useEffect(() => {
    // Debounced arama önerileri
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const loadRecentSearches = async () => {
    try {
      // AsyncStorage'dan son aramaları yükle
      // Şimdilik mock data
      setRecentSearches(['telefon', 'laptop', 'ayakkabı']);
    } catch (error) {
      console.error('Son aramalar yüklenemedi:', error);
    }
  };

  const fetchSuggestions = async (searchQuery: string) => {
    if (!showSuggestions) return;
    
    setIsLoading(true);
    try {
      const results = await getSearchSuggestions(searchQuery);
      setSuggestions(results);
    } catch (error) {
      console.error('Arama önerileri hatası:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    // Klavyeyi kapat
    Keyboard.dismiss();
    setShowSuggestionModal(false);

    // Son aramalara ekle
    addToRecentSearches(searchQuery.trim());

    // Arama sayfasına git
    if (onSearch) {
      onSearch(searchQuery.trim());
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const addToRecentSearches = (searchQuery: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== searchQuery);
      return [searchQuery, ...filtered].slice(0, 5); // Son 5 arama
    });
    // AsyncStorage'a kaydet
  };

  const handleInputFocus = () => {
    setShowSuggestionModal(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleInputBlur = () => {
    // Kısa gecikme ile kapat (suggestion'a tıklama için)
    setTimeout(() => {
      setShowSuggestionModal(false);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 150);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSearch(item.text)}
    >
      <Ionicons 
        name={
          item.type === 'product' ? 'cube-outline' :
          item.type === 'brand' ? 'business-outline' :
          'folder-outline'
        } 
        size={16} 
        color="#666" 
        style={styles.suggestionIcon}
      />
      <Text style={styles.suggestionText}>{item.text}</Text>
      <Text style={styles.suggestionType}>
        {item.type === 'product' ? 'Ürün' :
         item.type === 'brand' ? 'Marka' : 'Kategori'}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => handleSearch(item)}
    >
      <Ionicons name="time-outline" size={16} color="#999" style={styles.suggestionIcon} />
      <Text style={styles.recentText}>{item}</Text>
      <TouchableOpacity
        onPress={() => {
          setRecentSearches(prev => prev.filter(search => search !== item));
        }}
      >
        <Ionicons name="close" size={14} color="#ccc" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch()}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* Öneriler Modal */}
      <Modal
        visible={showSuggestionModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowSuggestionModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuggestionModal(false)}
        >
          <Animated.View 
            style={[styles.suggestionsContainer, { opacity: fadeAnim }]}
          >
            {query.length >= 2 ? (
              <>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Aranıyor...</Text>
                  </View>
                ) : suggestions.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Öneriler</Text>
                    <FlatList
                      data={suggestions}
                      renderItem={renderSuggestion}
                      keyExtractor={(item, index) => `${item.type}-${item.text}-${index}`}
                      showsVerticalScrollIndicator={false}
                      style={styles.suggestionsList}
                    />
                  </>
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>Öneri bulunamadı</Text>
                  </View>
                )}
              </>
            ) : recentSearches.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Son Aramalar</Text>
                <FlatList
                  data={recentSearches}
                  renderItem={renderRecentSearch}
                  keyExtractor={(item, index) => `recent-${item}-${index}`}
                  showsVerticalScrollIndicator={false}
                  style={styles.suggestionsList}
                />
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#ddd" />
                <Text style={styles.emptyText}>Arama yapmaya başlayın</Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingTop: 100, // SearchBar'ın altından başla
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  suggestionType: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 12,
  },
});