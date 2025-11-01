import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Star, 
  Wrench, 
  Zap, 
  Hammer, 
  ChefHat, 
  LogOut, 
  MapPin, 
  Clock, 
  ArrowLeft,
  SlidersHorizontal,
  X,
  RefreshCw
} from 'lucide-react-native';
import { providerService, type Provider as ProviderType, type ProviderFilters } from '../services/providerService';
import ProviderProfileModal from '../components/ProviderProfileModal';
import BookingModal from '../components/BookingModal';

const { height } = Dimensions.get('window');

interface ProvidersScreenProps {
  userData: any;
  onLogout: () => void;
  onBack: () => void;
  selectedCategory: string;
  selectedLocation: string;
  searchQuery?: string;
}

// Using Provider type from providerService
type Provider = ProviderType;

const ProvidersScreen: React.FC<ProvidersScreenProps> = ({ 
  userData: _userData, 
  onLogout, 
  onBack, 
  selectedCategory, 
  selectedLocation,
  searchQuery: initialSearchQuery = ''
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [showFilters, setShowFilters] = useState(false);

  // Update search query when prop changes
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [_showSort, _setShowSort] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number }>({ min: 0, max: 50000 });
  const [availabilityFilter, setAvailabilityFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance' | 'reviews'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);

  const categoryIcons: { [key: string]: any } = {
    plumbing: Wrench,
    electrical: Zap,
    cleaning: ChefHat,
    moving: Wrench,
    ac_repair: Wrench,
    carpentry: Hammer,
    painting: Wrench,
    pest_control: Wrench,
    laundry: ChefHat,
    tiling: Wrench,
    cctv: Wrench,
    gardening: Wrench,
    appliance_repair: Wrench,
    locksmith: Wrench,
    carpet_cleaning: ChefHat,
    cooking: ChefHat,
  };

  const getMockProviders = React.useCallback((): Provider[] => {
    const mockProviders = [
      {
        id: '1',
        user: { fullName: 'John Doe', email: 'john@example.com', phone: '+2348012345678', avatarUrl: '' },
        businessName: 'John\'s Plumbing Services',
        category: selectedCategory || 'plumbing',
        subcategories: ['Pipe Repair', 'Leak Fix', 'Installation'],
        locationCity: selectedLocation || 'Lagos',
        locationState: 'Lagos State',
        ratingAverage: 4.8,
        ratingCount: 124,
        startingPrice: 5000,
        hourlyRate: 2000,
        bio: 'Professional plumbing services with 10+ years experience',
        verificationStatus: 'verified',
        isAvailable: true,
        estimatedArrival: '30 mins',
        yearsOfExperience: 10,
        brandImages: [],
        isTopListed: true,
      },
      {
        id: '2',
        user: { fullName: 'Sarah Johnson', email: 'sarah@example.com', phone: '+2348012345679', avatarUrl: '' },
        businessName: 'Clean & Shine Services',
        category: selectedCategory || 'cleaning',
        subcategories: ['House Cleaning', 'Office Cleaning', 'Deep Clean'],
        locationCity: selectedLocation || 'Lagos',
        locationState: 'Lagos State',
        ratingAverage: 4.9,
        ratingCount: 89,
        startingPrice: 3500,
        hourlyRate: 1500,
        bio: 'Reliable cleaning services for homes and offices',
        verificationStatus: 'verified',
        isAvailable: true,
        estimatedArrival: '45 mins',
        yearsOfExperience: 5,
        brandImages: [],
        isTopListed: false,
      },
      {
        id: '3',
        user: { fullName: 'Mike Wilson', email: 'mike@example.com', phone: '+2348012345680', avatarUrl: '' },
        businessName: 'Electric Solutions',
        category: selectedCategory || 'electrical',
        subcategories: ['Wiring', 'Repairs', 'Installation'],
        locationCity: selectedLocation || 'Lagos',
        locationState: 'Lagos State',
        ratingAverage: 4.7,
        ratingCount: 156,
        startingPrice: 7000,
        hourlyRate: 3000,
        bio: 'Certified electrician with safety-first approach',
        verificationStatus: 'verified',
        isAvailable: false,
        estimatedArrival: '1 hour',
        yearsOfExperience: 8,
        brandImages: [],
        isTopListed: true,
      },
    ];
    
    return mockProviders.filter(provider => 
      !selectedCategory || provider.category === selectedCategory
    );
  }, [selectedCategory, selectedLocation]);

  const fetchProviders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: ProviderFilters = {
        location: selectedLocation,
        search: searchQuery || undefined, // Include search query if available
      };

      let data;
      if (selectedCategory) {
        data = await providerService.getProvidersByCategory(selectedCategory, filters);
      } else {
        data = await providerService.searchProviders(filters);
      }
      
      if (data.success && data.data?.providers) {
        setProviders(data.data.providers);
      } else {
        // Fallback to mock data
        setProviders(getMockProviders());
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      // Fallback to mock data
      setProviders(getMockProviders());
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedLocation, searchQuery, getMockProviders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProviders();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProviders]);

  const applyFilters = React.useCallback(() => {
    // Apply filters using the service
    const filters: Partial<ProviderFilters> = {
      search: searchQuery || undefined,
      minRating: ratingFilter || undefined,
      minPrice: priceFilter.min || undefined,
      maxPrice: priceFilter.max || undefined,
      available: availabilityFilter || undefined,
    };

    let filtered = providerService.filterProviders(providers, filters);
    
    // Apply sorting
    const sorted = providerService.sortProviders(filtered, sortBy, sortOrder);
    
    setFilteredProviders(sorted);
  }, [providers, searchQuery, ratingFilter, priceFilter, availabilityFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearchQuery('');
    setRatingFilter(null);
    setPriceFilter({ min: 0, max: 50000 });
    setAvailabilityFilter(false);
    setSortBy('rating');
    setSortOrder('desc');
  };

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || Wrench;
  };


  const handleProviderPress = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowProfileModal(true);
  };

  const handleBookProvider = (provider: Provider) => {
    setShowProfileModal(false);
    setBookingProvider(provider);
    setShowBookingModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {searchQuery 
              ? `Search: "${searchQuery}"` 
              : selectedCategory 
                ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Providers` 
                : 'All Providers'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedLocation} • {filteredProviders.length} providers
          </Text>
        </View>
        <View style={styles.headerActions}>
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
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={20} color="#ec4899" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ec4899']}
              tintColor="#ec4899"
              title="Pull to refresh providers"
              titleColor="#64748b"
            />
          }
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder={initialSearchQuery ? `Searching: ${initialSearchQuery}...` : "Search providers..."}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9ca3af"
                returnKeyType="search"
              />
            </View>
          </View>

          {/* Filters */}
          {showFilters && (
            <View style={styles.filtersContainer}>
              <View style={styles.filtersHeader}>
                <Text style={styles.filtersTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Minimum Rating</Text>
                <View style={styles.ratingButtons}>
                  {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingButton,
                        ratingFilter === rating && styles.ratingButtonSelected
                      ]}
                      onPress={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                    >
                      <Star size={16} color={ratingFilter === rating ? "#ffffff" : "#f59e0b"} fill={ratingFilter === rating ? "#ffffff" : "#f59e0b"} />
                      <Text style={[
                        styles.ratingButtonText,
                        ratingFilter === rating && styles.ratingButtonTextSelected
                      ]}>
                        {rating}+
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Availability Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAvailabilityFilter(!availabilityFilter)}
                >
                  <View style={[
                    styles.checkbox,
                    availabilityFilter && styles.checkboxSelected
                  ]}>
                    {availabilityFilter && <X size={12} color="#ffffff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Available Now</Text>
                </TouchableOpacity>
              </View>

              {/* Clear Filters */}
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Providers List */}
          <View style={styles.providersContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading providers...</Text>
              </View>
            ) : filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => {
                const CategoryIcon = getCategoryIcon(provider.category);
                return (
                  <TouchableOpacity 
                    key={provider.id} 
                    style={styles.providerCard} 
                    activeOpacity={0.8}
                    onPress={() => handleProviderPress(provider)}
                  >
                    <View style={styles.providerInfo}>
                      <View style={styles.providerIconContainer}>
                        {(() => {
                          // Priority 1: User avatarUrl
                          if (provider.user?.avatarUrl) {
                            return (
                              <Image
                                source={{ uri: provider.user.avatarUrl }}
                                style={styles.providerAvatarImage}
                                resizeMode="cover"
                              />
                            );
                          }
                          // Priority 2: First brandImage
                          if (provider.brandImages && provider.brandImages.length > 0) {
                            return (
                              <Image
                                source={{ uri: provider.brandImages[0].url || provider.brandImages[0] }}
                                style={styles.providerAvatarImage}
                                resizeMode="cover"
                              />
                            );
                          }
                          // Priority 3: First portfolio image
                          if (provider.portfolio && provider.portfolio.length > 0) {
                            return (
                              <Image
                                source={{ uri: provider.portfolio[0] }}
                                style={styles.providerAvatarImage}
                                resizeMode="cover"
                              />
                            );
                          }
                          // Fallback: Category icon
                          return <CategoryIcon size={32} color="#ec4899" />;
                        })()}
                      </View>
                      <View style={styles.providerDetails}>
                        <Text style={styles.providerName}>{provider.businessName}</Text>
                        <Text style={styles.providerOwner}>by {provider.user.fullName}</Text>
                        <View style={styles.providerRating}>
                          <Star size={16} color="#fbbf24" fill="#fbbf24" />
                          <Text style={styles.ratingText}>{provider.ratingAverage.toFixed(1)}</Text>
                          <Text style={styles.reviewsText}>({provider.ratingCount} reviews)</Text>
                        </View>
                        <View style={styles.providerLocation}>
                          <MapPin size={14} color="#64748b" />
                          <Text style={styles.locationText}>{provider.locationCity}, {provider.locationState}</Text>
                        </View>
                        {provider.isAvailable && (
                          <View style={styles.availabilityContainer}>
                            <Clock size={14} color="#10b981" />
                            <Text style={styles.availabilityText}>{provider.estimatedArrival}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Featured Badge */}
                    {provider.isTopListed && (
                      <View style={styles.featuredBadge}>
                        <View style={styles.featuredBadgeContent}>
                          <Zap size={14} color="#ffffff" fill="#ffffff" />
                          <Text style={styles.featuredBadgeText}>FEATURED</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.providerBrandImages}>
                      {/* Brand Images - Combine brandImages and portfolio */}
                      {(() => {
                        // Collect all available images
                        let allImages: string[] = [];
                        
                        // Add brand images
                        if (provider.brandImages && provider.brandImages.length > 0) {
                          allImages = provider.brandImages.map((img: any) => img.url || img);
                        }
                        
                        // Add portfolio images if we have less than 3
                        if (allImages.length < 3 && provider.portfolio && provider.portfolio.length > 0) {
                          allImages = [...allImages, ...provider.portfolio];
                        }
                        
                        // Remove duplicates and take first 3
                        allImages = Array.from(new Set(allImages)).slice(0, 3);
                        
                        return (
                          <View style={styles.brandImageGrid}>
                            {allImages.length > 0 ? (
                              <>
                                {allImages.map((image, index) => (
                                  <View key={index} style={styles.brandImageContainer}>
                                    <Image
                                      source={{ uri: image }}
                                      style={styles.brandImage}
                                      resizeMode="cover"
                                    />
                                  </View>
                                ))}
                                {/* Fill remaining slots with placeholders */}
                                {Array.from({ length: 3 - allImages.length }).map((_, i) => (
                                  <View key={`placeholder-${i}`} style={styles.brandImagePlaceholder}>
                                    <CategoryIcon size={20} color="#94a3b8" />
                                  </View>
                                ))}
                              </>
                            ) : (
                              // No images available - show placeholders
                              [1, 2, 3].map((i) => (
                                <View key={i} style={styles.brandImagePlaceholder}>
                                  <CategoryIcon size={20} color="#94a3b8" />
                                </View>
                              ))
                            )}
                          </View>
                        );
                      })()}
                      
                      {/* Availability Badge */}
                      <View style={[
                        styles.availabilityBadge,
                        provider.isAvailable ? styles.availabilityBadgeAvailable : styles.availabilityBadgeBusy
                      ]}>
                        <Text style={styles.availabilityBadgeText}>
                          {provider.isAvailable ? 'Available' : 'Busy'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsTitle}>No providers found</Text>
                <Text style={styles.noResultsSubtitle}>
                  Try adjusting your search or filters
                </Text>
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
            <LogOut size={20} color="#ffffff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Provider Profile Modal */}
      <ProviderProfileModal
        provider={selectedProvider}
        isVisible={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProvider(null);
        }}
        onBook={handleBookProvider}
      />
      
      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        provider={bookingProvider}
        onClose={() => setShowBookingModal(false)}
        onBooked={(bookingId) => {
          setShowBookingModal(false);
          Alert.alert('Booking Confirmed', `Your booking (ID: ${bookingId}) has been placed.`);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  filterButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ratingButtonSelected: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 4,
  },
  ratingButtonTextSelected: {
    color: '#ffffff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#0f172a',
  },
  clearFiltersButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  providersContainer: {
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
  providerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 20,
  },
  featuredBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    // Gradient effect - using orange to pink
    backgroundColor: '#f97316', // fallback orange
  },
  featuredBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  providerOwner: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
    marginRight: 8,
  },
  reviewsText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  providerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '500',
  },
  providerBrandImages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  brandImageGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  providerAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  brandImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  brandImage: {
    width: '100%',
    height: '100%',
  },
  brandImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityBadgeAvailable: {
    backgroundColor: '#10b981',
  },
  availabilityBadgeBusy: {
    backgroundColor: '#f59e0b',
  },
  availabilityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProvidersScreen;
