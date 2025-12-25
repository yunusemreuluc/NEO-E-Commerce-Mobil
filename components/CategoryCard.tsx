import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CategoryCardProps {
  name: string;
  onPress: () => void;
  isSelected?: boolean;
  productCount?: number;
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
  if (name.includes('banyo') || name.includes('temizlik')) {
    return 'water-outline';
  }
  
  // Spor kategorileri
  if (name.includes('spor') || name.includes('fitness') || name.includes('egzersiz')) {
    return 'fitness-outline';
  }
  if (name.includes('futbol') || name.includes('basketbol')) {
    return 'football-outline';
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
  const charWidth = 8; // Her karakter için yaklaşık genişlik
  const padding = 32; // İç boşluk
  const iconWidth = 24; // Icon genişliği
  
  const textWidth = text.length * charWidth;
  const totalWidth = Math.max(baseWidth, textWidth + padding + iconWidth);
  
  // Maksimum genişlik sınırı
  return Math.min(totalWidth, 160);
};

// Kategori adının uzunluğuna göre font boyutu ayarlama
const getFontSize = (text: string): number => {
  if (text.length <= 8) return 14;
  if (text.length <= 12) return 13;
  if (text.length <= 16) return 12;
  return 11;
};

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  name, 
  onPress, 
  isSelected = false,
  productCount 
}) => {
  const icon = getCategoryIcon(name);
  const cardWidth = calculateWidth(name);
  const fontSize = getFontSize(name);
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: cardWidth },
        isSelected && styles.selectedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={isSelected ? '#FFFFFF' : '#666666'} 
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text 
          style={[
            styles.categoryName,
            { fontSize },
            isSelected && styles.selectedText
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {name}
        </Text>
        
        {productCount !== undefined && productCount > 0 && (
          <Text style={[styles.productCount, isSelected && styles.selectedProductCount]}>
            {productCount} ürün
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  selectedContainer: {
    backgroundColor: '#ff8000ff',
    borderColor: '#ffbb00ff',
    shadowColor: '#ff7300ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
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
  textContainer: {
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  productCount: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    fontWeight: '400',
  },
  selectedProductCount: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default CategoryCard;