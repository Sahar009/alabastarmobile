import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ArrowLeft,
  Search,
  Wrench,
  Droplets,
  Plug,
  Sparkles,
  Truck,
  Snowflake,
  HardHat,
  Paintbrush,
  Bug,
  ImageIcon as IronIcon,
  Grid3x3,
  Monitor,
  Flower,
  Box,
  Lock,
  ChefHat,
  Sofa,
} from 'lucide-react-native';
import { API_BASE_URL } from '../services/api';

interface AllServicesScreenProps {
  onCategorySelect: (category: string) => void;
  onBack: () => void;
  selectedLocation?: string;
}

const AllServicesScreen: React.FC<AllServicesScreenProps> = ({ 
  onCategorySelect, 
  onBack,
  selectedLocation: _selectedLocation = 'Lagos'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allCategories, setAllCategories] = useState<Array<{
    id: string;
    name: string;
    icon: any;
    color: string;
    description: string;
    iconImage?: any;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categoryIcons: { [key: string]: any } = useMemo(() => ({
    plumbing: Droplets,
    electrical: Plug,
    cleaning: Sparkles,
    moving: Truck,
    ac_repair: Snowflake,
    carpentry: HardHat,
    painting: Paintbrush,
    pest_control: Bug,
    laundry: IronIcon,
    tiling: Grid3x3,
    cctv: Monitor,
    gardening: Flower,
    appliance_repair: Box,
    locksmith: Lock,
    carpet_cleaning: Sofa,
    cooking: ChefHat,
  }), []);

  const categoryImages: { [key: string]: any } = useMemo(() => {
    try {
      return {
        plumbing: require('../../assets/plumber2d.png'),
        electrical: require('../../assets/mechanic2d.png'),
        cleaning: require('../../assets/cleaner2d.png'),
        moving: require('../../assets/mover2d.png'),
        carpentry: require('../../assets/carpenter2d.png'),
        painting: require('../../assets/painter2d.png'),
        pest_control: require('../../assets/electrician2d.png'),
        laundry: require('../../assets/laundry2d.png'),
        pharmaceutical: require('../../assets/pharmacy2d.png'),
        cctv: require('../../assets/cctv2d.png'),
        gardening: require('../../assets/gardener2d.png'),
        appliance_repair: require('../../assets/mechanic2d.png'),
        locksmith: require('../../assets/mechanic2d.png'),
        carpet_cleaning: require('../../assets/cleaner2d.png'),
        cooking: require('../../assets/baker2d.png'),
      };
    } catch {
      return {};
    }
  }, []);

  // Fetch categories from API - Load from cache first, then fetch fresh
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    
    let hasCachedData = false;
    
    // First, try to load from cache (saved by HomeScreen)
    try {
      const cachedCategories = await AsyncStorage.getItem('cached_categories');
      if (cachedCategories) {
        const parsed = JSON.parse(cachedCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Restore icons and images from categoryIcons/categoryImages mappings
          // (icons can't be serialized to JSON, so we restore them here)
          const restoredCategories = parsed.map((cat: any) => ({
            ...cat,
            icon: categoryIcons[cat.id] || Wrench,
            iconImage: categoryImages[cat.id],
          }));
          console.log('[AllServicesScreen] ✅ Loaded', restoredCategories.length, 'categories from cache');
          setAllCategories(restoredCategories);
          hasCachedData = true;
          setIsLoading(false);
          // Continue to fetch fresh data in background
        }
      }
    } catch (error) {
      console.warn('[AllServicesScreen] Could not load cached categories:', error);
    }
    
    // Then fetch fresh data from API
    try {
      const base = API_BASE_URL;
      console.log('[AllServicesScreen] Fetching from:', `${base}/categories/categories`);
      const response = await fetch(`${base}/categories/categories`);
      const data = await response.json();
      
      console.log('[AllServicesScreen] API Response:', {
        success: data.success,
        hasData: !!data.data,
        hasCategories: !!data.data?.categories,
        count: data.data?.categories?.length || 0,
      });
      
      if (data.success && data.data?.categories && Array.isArray(data.data.categories) && data.data.categories.length > 0) {
        const apiCategories = data.data.categories.map((cat: any, index: number) => {
          const icon = categoryIcons[cat.slug] || Wrench;
          const iconImage = categoryImages[cat.slug];
          const colors = [
            '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', 
            '#06b6d4', '#d97706', '#ef4444', '#84cc16',
            '#ec4899', '#6b7280', '#1f2937', '#16a34a',
            '#7c3aed', '#dc2626', '#059669', '#ea580c'
          ];
          return {
            id: cat.slug,
            name: cat.name,
            icon: icon,
            iconImage: iconImage, // Will use image if available, otherwise falls back to icon
            color: colors[index % colors.length],
            description: cat.description || 'Service category',
          };
        });
        
        // Save to cache for next time (without icon functions since they can't be serialized)
        try {
          const categoriesToCache = apiCategories.map(({ icon: _icon, iconImage: _iconImage, ...rest }: any) => rest);
          await AsyncStorage.setItem('cached_categories', JSON.stringify(categoriesToCache));
          console.log('[AllServicesScreen] ✅ Saved categories to cache');
        } catch (error) {
          console.warn('[AllServicesScreen] Could not save to cache:', error);
        }
        
        console.log('[AllServicesScreen] ✅ Successfully loaded', apiCategories.length, 'categories from API');
        setAllCategories(apiCategories);
      } else {
        console.warn('[AllServicesScreen] ⚠️ No categories found in API response');
        // If we don't have cached data, show empty state
        if (!hasCachedData) {
          setAllCategories([]);
        }
      }
    } catch (error: any) {
      console.error('[AllServicesScreen] ❌ Error fetching categories:', error);
      console.error('[AllServicesScreen] Error message:', error.message);
      // If we don't have cached data, show empty state
      if (!hasCachedData) {
        setAllCategories([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [categoryIcons, categoryImages]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCategories();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategories]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCategories;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return allCategories.filter(category => 
      category.name.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query)
    );
  }, [allCategories, searchQuery]);

  const handleCategoryPress = (categoryId: string) => {
    onCategorySelect(categoryId);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Services</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Services Grid */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ec4899']}
            tintColor="#ec4899"
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No services found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search query
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredCategories.map((category) => {
              const IconComponent = category.icon || Wrench;
              const hasImage = category.iconImage;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}15` }]}>
                    {hasImage ? (
                      <Image
                        source={category.iconImage}
                        style={styles.categoryImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <IconComponent size={32} color={category.color} />
                    )}
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category.name}
                  </Text>
                  <Text style={styles.categoryDescription} numberOfLines={2}>
                    {category.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryImage: {
    width: 56,
    height: 56,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AllServicesScreen;

