import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation } from '../components';
import { 
  Search, 
  MapPin, 
  Star, 
  Wrench, 
  Zap, 
  Sparkles, 
  Package, 
  Snowflake, 
  Hammer,
  Palette, 
  Bug, 
  Shirt, 
  Square, 
  Video, 
  Sprout, 
  Settings, 
  Key, 
  Sofa,
  Droplets,
  ChefHat,
  Camera,
  Clock,
  Lightbulb,
  RefreshCw
} from 'lucide-react-native';

const { height, width } = Dimensions.get('window');

interface HomeScreenProps {
  onCategorySelect: (category: string) => void;
  userData: any;
  selectedLocation?: string;
}

interface FeaturedService {
  id: string;
  businessName: string;
  category: string;
  ratingAverage: number;
  ratingCount: number;
  hourlyRate: number;
  locationCity: string;
  isAvailable: boolean;
  estimatedArrival: string;
  brandImages?: any[];
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCategorySelect, userData, selectedLocation = 'Lagos' }) => {
  const [_searchQuery, _setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categoryIcons: { [key: string]: any } = {
    plumbing: Droplets,
    electrical: Zap,
    cleaning: Sparkles,
    moving: Package,
    ac_repair: Snowflake,
    carpentry: Hammer,
    painting: Palette,
    pest_control: Bug,
    laundry: Shirt,
    tiling: Square,
    cctv: Video,
    gardening: Sprout,
    appliance_repair: Settings,
    locksmith: Key,
    carpet_cleaning: Sofa,
    cooking: Lightbulb,
  };

  const getMockFeaturedServices = useCallback((): FeaturedService[] => {
    return [
      {
        id: '1',
        businessName: 'John\'s Plumbing Services',
        category: 'plumbing',
        ratingAverage: 4.8,
        ratingCount: 124,
        hourlyRate: 2000,
        locationCity: selectedLocation,
        isAvailable: true,
        estimatedArrival: '30 mins',
        brandImages: [
          'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1538474705339-e87de81450e8?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1542013936693-884638332954?w=300&auto=format&fit=crop&q=60'
        ],
      },
      {
        id: '2',
        businessName: 'Clean & Shine Services',
        category: 'cleaning',
        ratingAverage: 4.9,
        ratingCount: 89,
        hourlyRate: 1500,
        locationCity: selectedLocation,
        isAvailable: true,
        estimatedArrival: '45 mins',
        brandImages: [
          'https://images.unsplash.com/photo-1550963295-019d8a8a61c5?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1529220502050-f15e570c634e?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1610141160723-d2d346e73766?w=300&auto=format&fit=crop&q=60'
        ],
      },
      {
        id: '3',
        businessName: 'Electric Solutions',
        category: 'electrical',
        ratingAverage: 4.7,
        ratingCount: 156,
        hourlyRate: 3000,
        locationCity: selectedLocation,
        isAvailable: false,
        estimatedArrival: '1 hour',
        brandImages: [
          'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1566417110090-6b15a06ec800?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1530240852689-f7a9c6d9f6c7?w=300&auto=format&fit=crop&q=60'
        ],
      },
      {
        id: '4',
        businessName: 'Quick Fix Carpentry',
        category: 'carpentry',
        ratingAverage: 4.6,
        ratingCount: 78,
        hourlyRate: 2500,
        locationCity: selectedLocation,
        isAvailable: true,
        estimatedArrival: '45 mins',
        brandImages: [
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&auto=format&fit=crop&q=60'
        ],
      },
      {
        id: '5',
        businessName: 'Fresh Paint Co.',
        category: 'painting',
        ratingAverage: 4.8,
        ratingCount: 92,
        hourlyRate: 1800,
        locationCity: selectedLocation,
        isAvailable: true,
        estimatedArrival: '1 hour',
        brandImages: [
          'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1560439514-4e9645039924?w=300&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&auto=format&fit=crop&q=60'
        ],
      },
    ];
  }, [selectedLocation]);

  const fetchFeaturedServices = useCallback(async () => {
    setIsLoadingFeatured(true);
    try {
      const base = "http://localhost:8000/api";
      // Use selectedLocation and prioritize premium providers
      const apiUrl = `${base}/providers/search?location=${encodeURIComponent(selectedLocation)}&limit=10&priority=premium`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success && data.data?.providers) {
        const services: FeaturedService[] = data.data.providers.map((provider: any) => ({
          id: provider.id,
          businessName: provider.businessName || provider.User?.fullName || 'Service Provider',
          category: provider.category,
          ratingAverage: provider.ratingAverage || 0,
          ratingCount: provider.ratingCount || 0,
          hourlyRate: provider.hourlyRate || 2000,
          locationCity: provider.locationCity || selectedLocation,
          isAvailable: provider.isAvailable !== false,
          estimatedArrival: provider.estimatedArrival || '30 mins',
          brandImages: provider.brandImages || provider.portfolio || [],
        }));
        
        setFeaturedServices(services);
      } else {
        // Fallback to mock data
        setFeaturedServices(getMockFeaturedServices());
      }
    } catch (error) {
      console.error('Error fetching featured services:', error);
      // Fallback to mock data
      setFeaturedServices(getMockFeaturedServices());
    } finally {
      setIsLoadingFeatured(false);
    }
  }, [selectedLocation, getMockFeaturedServices]);

  useEffect(() => {
    fetchFeaturedServices();
  }, [fetchFeaturedServices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFeaturedServices();
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeaturedServices]);


  const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || Wrench;
  };

  const handleFeaturedServicePress = (service: FeaturedService) => {
    onCategorySelect(service.category);
  };

  const categories = [
    { 
      id: 'plumbing', 
      name: 'Plumbing', 
      icon: Droplets, 
      color: '#3b82f6',
      image: '/images/plumber2d.png',
      description: 'Pipe repairs, leaks, installations'
    },
    { 
      id: 'electrical', 
      name: 'Electrical', 
      icon: Zap, 
      color: '#f59e0b',
      image: '/images/mechanic2d.png',
      description: 'Wiring, outlets, electrical repairs'
    },
    { 
      id: 'cleaning', 
      name: 'Cleaning', 
      icon: Sparkles, 
      color: '#10b981',
      image: '/images/cleaner2d.png',
      description: 'House cleaning, office cleaning'
    },
    { 
      id: 'moving', 
      name: 'Moving', 
      icon: Package, 
      color: '#8b5cf6',
      image: '/images/mover2d.png',
      description: 'Moving services, packing'
    },
    { 
      id: 'ac_repair', 
      name: 'AC Repair', 
      icon: Snowflake, 
      color: '#06b6d4',
      image: '/images/ac2d.png',
      description: 'Air conditioning repair & maintenance'
    },
    { 
      id: 'carpentry', 
      name: 'Carpentry', 
      icon: Hammer, 
      color: '#d97706',
      image: '/images/carpenter2d.png',
      description: 'Furniture repair, woodwork'
    },
    { 
      id: 'painting', 
      name: 'Painting', 
      icon: Palette, 
      color: '#ef4444',
      image: '/images/paint2d.png',
      description: 'Interior & exterior painting'
    },
    { 
      id: 'pest_control', 
      name: 'Pest Control', 
      icon: Bug, 
      color: '#84cc16',
      image: '/images/pest2d.png',
      description: 'Pest removal & prevention'
    },
    { 
      id: 'laundry', 
      name: 'Laundry', 
      icon: Shirt, 
      color: '#ec4899',
      image: '/images/laundry2d.png',
      description: 'Dry cleaning, ironing'
    },
    { 
      id: 'tiling', 
      name: 'Tiling', 
      icon: Square, 
      color: '#6b7280',
      image: '/images/tiler2d.png',
      description: 'Floor & wall tiling'
    },
    { 
      id: 'cctv', 
      name: 'CCTV', 
      icon: Camera, 
      color: '#1f2937',
      image: '/images/cctv2d.png',
      description: 'Security camera installation'
    },
    { 
      id: 'gardening', 
      name: 'Gardening', 
      icon: Sprout, 
      color: '#16a34a',
      image: '/images/gardener2d.png',
      description: 'Lawn care, landscaping'
    },
    { 
      id: 'appliance_repair', 
      name: 'Appliance Repair', 
      icon: Settings, 
      color: '#7c3aed',
      image: '/images/mechanic2d.png',
      description: 'Home appliance repairs'
    },
    { 
      id: 'locksmith', 
      name: 'Locksmith', 
      icon: Key, 
      color: '#dc2626',
      image: '/images/mechanic2d.png',
      description: 'Lock repair & key duplication'
    },
    { 
      id: 'carpet_cleaning', 
      name: 'Carpet Cleaning', 
      icon: Sofa, 
      color: '#059669',
      image: '/images/cleaner2d.png',
      description: 'Carpet & upholstery cleaning'
    },
    { 
      id: 'cooking', 
      name: 'Cooking', 
      icon: ChefHat, 
      color: '#ea580c',
      image: '/images/cleaner2d.png',
      description: 'Personal chef, meal prep'
    }
  ];

  const popularServices = [
    { name: 'Emergency Plumber', category: 'plumbing', icon: Droplets },
    { name: 'House Cleaning', category: 'cleaning', icon: Sparkles },
    { name: 'Electrician', category: 'electrical', icon: Zap },
    { name: 'Painter', category: 'painting', icon: Palette },
  ];

  const handleCategoryPress = (categoryId: string) => {
    onCategorySelect(categoryId);
  };

  const handleSearchPress = () => {
    onCategorySelect('search');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ec4899']}
            tintColor="#ec4899"
            title="Pull to refresh"
            titleColor="#64748b"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},</Text>
              <Text style={styles.userName}>{userData?.user?.fullName || 'User'}!</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.locationContainer}>
                <MapPin size={16} color="#ec4899" />
                <Text style={styles.locationText}>{selectedLocation}, Nigeria</Text>
              </View>
              <TouchableOpacity 
                style={[styles.refreshButton, refreshing && styles.refreshButtonActive]} 
                onPress={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw 
                  size={20} 
                  color={refreshing ? "#ffffff" : "#ec4899"} 
                  style={refreshing ? styles.refreshingIcon : null}
                />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.subtitle}>What service do you need today?</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <Text style={styles.searchPlaceholder}>Search for services...</Text>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
            <Search size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Popular Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
            {popularServices.map((service, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.popularCard}
                onPress={() => handleCategoryPress(service.category)}
              >
                <View style={[styles.popularIcon, { backgroundColor: `${service.icon === Droplets ? '#3b82f6' : service.icon === Sparkles ? '#10b981' : service.icon === Zap ? '#f59e0b' : '#ef4444'}20` }]}>
                  <service.icon size={24} color={service.icon === Droplets ? '#3b82f6' : service.icon === Sparkles ? '#10b981' : service.icon === Zap ? '#f59e0b' : '#ef4444'} />
                </View>
                <Text style={styles.popularText}>{service.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* All Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Services</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                  <category.icon size={28} color={category.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Services */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Services in {selectedLocation}</Text>
          {isLoadingFeatured ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading featured services...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
              {featuredServices.map((service) => {
                const CategoryIcon = getCategoryIcon(service.category);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.featuredCard}
                    onPress={() => handleFeaturedServicePress(service)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.featuredHeader}>
                      {/* Use first brand image as avatar, fallback to category icon */}
                      <View style={styles.featuredIconContainer}>
                        {service.brandImages && service.brandImages.length > 0 ? (
                          <Image
                            source={{ uri: service.brandImages[0].url || service.brandImages[0] }}
                            style={styles.featuredAvatarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <CategoryIcon size={24} color="#ec4899" />
                        )}
                      </View>
                      <View style={[
                        styles.availabilityBadge,
                        service.isAvailable ? styles.availabilityBadgeAvailable : styles.availabilityBadgeBusy
                      ]}>
                        <Text style={styles.availabilityBadgeText}>
                          {service.isAvailable ? 'Available' : 'Busy'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.featuredContent}>
                      <Text style={styles.featuredBusinessName} numberOfLines={1}>
                        {service.businessName}
                      </Text>
                      <Text style={styles.featuredCategory} numberOfLines={1}>
                        {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                      </Text>
                      
                      <View style={styles.featuredRating}>
                        <Star size={14} color="#fbbf24" fill="#fbbf24" />
                        <Text style={styles.featuredRatingText}>{service.ratingAverage.toFixed(1)}</Text>
                        <Text style={styles.featuredReviewsText}>({service.ratingCount})</Text>
                      </View>
                      
                      <View style={styles.featuredLocation}>
                        <MapPin size={12} color="#64748b" />
                        <Text style={styles.featuredLocationText}>{service.locationCity}</Text>
                      </View>
                      
                      {/* Brand Images - Show remaining images (skip first one as it's used as avatar) */}
                      <View style={styles.featuredBrandImages}>
                        {service.brandImages && service.brandImages.length > 1 ? (
                          <View style={styles.featuredImageGrid}>
                            {service.brandImages.slice(1, 4).map((image: any, index: number) => (
                              <View key={index} style={styles.featuredImageContainer}>
                                <Image
                                  source={{ uri: image.url || image }}
                                  style={styles.featuredImage}
                                  resizeMode="cover"
                                />
                              </View>
                            ))}
                            {service.brandImages.length > 4 && (
                              <View style={styles.featuredMoreImages}>
                                <Text style={styles.featuredMoreText}>+{service.brandImages.length - 4}</Text>
                              </View>
                            )}
                          </View>
                        ) : service.brandImages && service.brandImages.length === 1 ? (
                          <View style={styles.featuredImageGrid}>
                            <View style={styles.featuredImagePlaceholder}>
                              <CategoryIcon size={12} color="#9ca3af" />
                            </View>
                            <View style={styles.featuredImagePlaceholder}>
                              <CategoryIcon size={12} color="#9ca3af" />
                            </View>
                            <View style={styles.featuredImagePlaceholder}>
                              <CategoryIcon size={12} color="#9ca3af" />
                            </View>
                          </View>
                        ) : (
                          <View style={styles.featuredImageGrid}>
                            {[1, 2, 3].map((i) => (
                              <View key={i} style={styles.featuredImagePlaceholder}>
                                <CategoryIcon size={12} color="#9ca3af" />
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      
                      {service.isAvailable && (
                        <View style={styles.featuredArrival}>
                          <Clock size={12} color="#10b981" />
                          <Text style={styles.featuredArrivalText}>{service.estimatedArrival}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fdf2f8',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#ec4899',
    top: -100,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#f97316',
    bottom: 100,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#ec4899',
    top: height * 0.3,
    right: 50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  refreshButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  refreshingIcon: {
    transform: [{ rotate: '180deg' }],
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ec4899',
  },
  locationText: {
    fontSize: 14,
    color: '#ec4899',
    fontWeight: '600',
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#ec4899',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  popularScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  popularCard: {
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
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
  featuredSection: {
    marginBottom: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  featuredScroll: {
    marginTop: 16,
  },
  featuredCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availabilityBadgeAvailable: {
    backgroundColor: '#10b981',
  },
  availabilityBadgeBusy: {
    backgroundColor: '#f59e0b',
  },
  availabilityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  featuredContent: {
    flex: 1,
  },
  featuredBusinessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  featuredCategory: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
    marginRight: 4,
  },
  featuredReviewsText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredLocationText: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 4,
  },
  featuredPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  featuredPriceLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 2,
  },
  featuredArrival: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredArrivalText: {
    fontSize: 10,
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '500',
  },
  featuredBrandImages: {
    marginBottom: 8,
  },
  featuredImageGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  featuredAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  featuredImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredMoreImages: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  featuredImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;