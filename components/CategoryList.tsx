import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CategoryCard from './CategoryCard';

interface Category {
  id: number;
  name: string;
  slug: string;
  product_count?: number;
  is_active: boolean;
  sort_order: number;
}

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryName: string) => void;
  loading?: boolean;
  showProductCount?: boolean;
  title?: string;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  loading = false,
  showProductCount = true,
  title = "Kategoriler"
}) => {
  // Aktif kategorileri sırala
  const sortedCategories = categories
    .filter(cat => cat.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  // "Tümü" kategorisini ekle
  const allCategories = [
    { 
      id: 0, 
      name: 'Tümü', 
      slug: 'all', 
      is_active: true, 
      sort_order: -1,
      product_count: categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0)
    },
    ...sortedCategories
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Loading skeleton */}
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={styles.loadingSkeleton} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allCategories.map((category) => (
          <CategoryCard
            key={category.id}
            name={category.name}
            onPress={() => onCategorySelect(category.name)}
            isSelected={selectedCategory === category.name}
            productCount={showProductCount ? category.product_count : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingSkeleton: {
    width: 100,
    height: 80,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    marginRight: 12,
  },
});

export default CategoryList;