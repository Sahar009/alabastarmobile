import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  FlatList,
  Alert,
  Animated,
  ImageSourcePropType,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock,
  RefreshCw,
  Bell,
  Wrench,
  Sofa,
  ChefHat,
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
  Zap,
  ArrowRight,
} from 'lucide-react-native';
import ProviderProfileModal from '../components/ProviderProfileModal';
import BookingModal from '../components/BookingModal';
import { type Provider as ProviderType } from '../services/providerService';
import { API_BASE_URL, apiService } from '../services/api';

interface HomeScreenProps {
  onCategorySelect: (category: string, search?: string) => void;
  userData: any;
  selectedLocation?: string;
  onNavigate?: (screen: string) => void;
}

interface FeaturedService {
  id: string;
  businessName: string;
  category: string;
  subcategories?: string[];
  ratingAverage: number;
  ratingCount: number;
  hourlyRate: number;
  startingPrice?: number;
  locationCity: string;
  locationState?: string;
  isAvailable: boolean;
  estimatedArrival: string;
  brandImages?: any[];
  portfolio?: string[];
  isTopListed?: boolean;
  listingPriority?: number;
  bio?: string;
  verificationStatus?: string;
  user?: {
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
  User?: {
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
}

// Helper function to resolve user data structure
const resolveUser = (data: any) => {
  if (!data) return null;
  return data.user ? data.user : data;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onCategorySelect, userData, selectedLocation = 'Lagos', onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{id: string; name: string; type: 'category' | 'subcategory'; categoryId?: string}>>([]);
  const [allCategories, setAllCategories] = useState<Array<{id: string; name: string; subcategories?: string[]}>>([]);
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>([]);
  const [topRatedServices, setTopRatedServices] = useState<FeaturedService[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adImages, setAdImages] = useState<ImageSourcePropType[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Resolve user data to get name - updates when userData changes
  const userName = useMemo(() => {
    const user = resolveUser(userData);
    return user?.fullName || 'User';
  }, [userData]);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const adFadeAnim = useRef(new Animated.Value(0)).current;
  const skeletonPulse = useRef(new Animated.Value(0.5));
  const [popularServices, setPopularServices] = useState<Array<{
    name: string;
    category: string;
    icon: any;
  }>>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingProvider, setBookingProvider] = useState<ProviderType | null>(null);

  const categoryIcons: { [key: string]: any } = useMemo(() => ({
    plumbing: Droplets, // Water droplets for plumbing
    electrical: Plug, // Power plug for electrical
    cleaning: Sparkles, // Sparkles for cleaning
    moving: Truck, // Truck for moving
    ac_repair: Snowflake, // Snowflake for AC repair
    carpentry: HardHat, // Hard hat for carpentry
    painting: Paintbrush, // Paint brush for painting
    pest_control: Bug, // Bug icon for pest control
    laundry: IronIcon, // Iron icon for laundry
    tiling: Grid3x3, // Grid for tiling
    cctv: Monitor, // Monitor for CCTV
    gardening: Flower, // Flower for gardening
    appliance_repair: Box, // Box for appliance repair
    locksmith: Lock, // Lock for locksmith
    carpet_cleaning: Sofa, // Sofa for carpet cleaning
    cooking: ChefHat, // Chef hat for cooking
  }), []);

  // 2D Image paths for categories
  // Add these images to alabastarmobile/assets/ folder
  const categoryImages: { [key: string]: any } = useMemo(() => {
    try {
      return {
        plumbing: require('../../assets/plumber2d.png'),
        electrical: require('../../assets/mechanic2d.png'),
        cleaning: require('../../assets/cleaner2d.png'),
        moving: require('../../assets/mover2d.png'),
        ac_repair: require('../../assets/ac2d.jpg'),
        carpentry: require('../../assets/carpenter2d.png'),
        painting: require('../../assets/painter2d.jpg'),
        pest_control: require('../../assets/electrician2d.jpg'),
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
      // If images don't exist, return empty object (will fall back to icons)
      console.warn('Category images not found. Using icons instead.');
      return {};
    }
  }, []);

  const fetchFeaturedServices = useCallback(async () => {
    setIsLoadingFeatured(true);
    try {
      // Fetch all providers without location filter
      const params = new URLSearchParams();
      params.append('limit', '15');
      const apiUrl = `${API_BASE_URL}/providers/search?${params.toString()}`;
      
      console.log('Fetching providers for featured services from:', apiUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('Providers API response:', {
        success: data.success,
        hasProviders: !!data.data?.providers,
        providerCount: data.data?.providers?.length || 0,
        totalCount: data.data?.totalCount || 0,
        rawData: data.data,
      });
      
      if (data.success && data.data?.providers && Array.isArray(data.data.providers)) {
        console.log('Raw providers from API:', data.data.providers.length);
        
        // Map providers to FeaturedService format
        const mappedProviders: FeaturedService[] = data.data.providers.map((provider: any) => {
          // Extract brandImages from portfolio.brandImages (nested structure)
          let brandImages: string[] = [];
          
          // Check portfolio.brandImages first (new structure)
          if (provider.portfolio?.brandImages && Array.isArray(provider.portfolio.brandImages)) {
            brandImages = provider.portfolio.brandImages
              .map((img: any) => {
                if (typeof img === 'string') return img;
                if (img?.url) return img.url;
                return null;
              })
              .filter((url: any) => url && typeof url === 'string' && !url.startsWith('blob:'));
          }
          
          // Fallback to root-level brandImages if portfolio.brandImages is not available
          if (brandImages.length === 0 && Array.isArray(provider.brandImages)) {
            brandImages = provider.brandImages
              .map((img: any) => {
                if (typeof img === 'string') return img;
                if (img?.url) return img.url;
                return null;
              })
              .filter((url: any) => url && typeof url === 'string' && !url.startsWith('blob:'));
          }
          
          // Extract portfolio URLs (from portfolio.documents or flat portfolio array)
          let portfolio: string[] = [];
          if (provider.portfolio?.documents && Array.isArray(provider.portfolio.documents)) {
            portfolio = provider.portfolio.documents
              .map((doc: any) => {
                if (typeof doc === 'string') return doc;
                if (doc?.url) return doc.url;
                return null;
              })
              .filter((url: any) => url && typeof url === 'string');
          } else if (Array.isArray(provider.portfolio)) {
            portfolio = provider.portfolio
              .map((img: any) => {
                if (typeof img === 'string') return img;
                if (img?.url) return img.url;
                return null;
              })
              .filter((url: any) => url && typeof url === 'string');
          }
          
          return {
            id: provider.id,
            businessName: provider.businessName || provider.User?.fullName || 'Service Provider',
            category: provider.category,
            subcategories: Array.isArray(provider.subcategories) ? provider.subcategories : 
                          (typeof provider.subcategories === 'string' ? [provider.subcategories] : []),
            ratingAverage: provider.ratingAverage || 0,
            ratingCount: provider.ratingCount || 0,
            hourlyRate: provider.hourlyRate || 2000,
            startingPrice: provider.startingPrice || provider.hourlyRate || 2000,
            locationCity: provider.locationCity || selectedLocation,
            locationState: provider.locationState || '',
            isAvailable: provider.isAvailable !== false,
            estimatedArrival: provider.estimatedArrival || '30 mins',
            brandImages: brandImages, // Now array of URL strings
            portfolio: portfolio, // Now array of URL strings
            isTopListed: provider.isTopListed === true || (provider.listingPriority || 1) > 1,
            listingPriority: provider.listingPriority || 1,
            bio: provider.bio || '',
            verificationStatus: provider.verificationStatus || 'pending',
            user: provider.user || provider.User,
            User: provider.User || provider.user,
          };
        });
        
        console.log('Processed providers:', mappedProviders.length);
        console.log('First provider:', mappedProviders[0]?.businessName);
        
        const featured = mappedProviders.filter(service => service.isTopListed);
        console.log('Top listed providers:', featured.length);
        setFeaturedServices(featured);

        const topRated = [...mappedProviders]
          .sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0))
          .slice(0, 15);
        setTopRatedServices(topRated);
      } else {
        console.warn('No providers found in API response');
        console.warn('Response data:', JSON.stringify(data, null, 2));
        setFeaturedServices([]);
        setTopRatedServices([]);
      }
    } catch (error) {
      console.error('Error fetching featured services:', error);
      setFeaturedServices([]);
      setTopRatedServices([]);
    } finally {
      setIsLoadingFeatured(false);
    }
  }, [selectedLocation]);

  // Hardcoded categories as fallback (will be replaced by API data)
  const hardcodedCategories = useMemo(() => [
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
      icon: Plug, 
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
      icon: Truck, 
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
      icon: HardHat, 
      color: '#d97706',
      image: '/images/carpenter2d.png',
      description: 'Furniture repair, woodwork'
    },
    { 
      id: 'painting', 
      name: 'Painting', 
      icon: Paintbrush, 
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
      icon: IronIcon, 
      color: '#ec4899',
      image: '/images/laundry2d.png',
      description: 'Dry cleaning, ironing'
    },
    { 
      id: 'pharmaceutical', 
      name: 'Pharmaceutical', 
      icon: Grid3x3, 
      color: '#6b7280',
      image: '/images/pharmacy2d.png',
      description: 'Pharmaceutical services'
    },
    { 
      id: 'cctv', 
      name: 'CCTV', 
      icon: Monitor, 
      color: '#1f2937',
      image: '/images/cctv2d.png',
      description: 'Security camera installation'
    },
    { 
      id: 'gardening', 
      name: 'Gardening', 
      icon: Flower, 
      color: '#16a34a',
      image: '/images/gardener2d.png',
      description: 'Lawn care, landscaping'
    },
    { 
      id: 'appliance_repair', 
      name: 'Appliance Repair', 
      icon: Box, 
      color: '#7c3aed',
      image: '/images/mechanic2d.png',
      description: 'Home appliance repairs'
    },
    { 
      id: 'locksmith', 
      name: 'Locksmith', 
      icon: Lock, 
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
  ], []);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      const base = "http://localhost:8000/api";
      const response = await fetch(`${base}/providers/categories`);
      const data = await response.json();
      
      if (data.success && data.data?.categories) {
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
            image: '/images/' + cat.slug + '2d.png',
            description: cat.description || 'Service category',
            subcategories: cat.subcategories || []
          };
        });
        
        // Store all categories for search suggestions
        setAllCategories(apiCategories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          subcategories: cat.subcategories || []
        })));
        
        // Set popular services from first 4 categories
        const popular = apiCategories.slice(0, 4).map((cat: any) => ({
          name: cat.name,
          category: cat.id,
          icon: cat.icon
        }));
        setPopularServices(popular);
        
      } else {
        // Fallback to hardcoded categories with iconImage
        const categoriesWithImages = hardcodedCategories.map((cat: any) => ({
          ...cat,
          iconImage: categoryImages[cat.id],
          subcategories: []
        }));
        
        // Store all categories for search suggestions
        setAllCategories(categoriesWithImages.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          subcategories: []
        })));
        
        // Set popular services from first 4 fallback categories
        const popular = categoriesWithImages.slice(0, 4).map((cat: any) => ({
          name: cat.name,
          category: cat.id,
          icon: cat.icon
        }));
        setPopularServices(popular);
        
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to hardcoded categories with iconImage
      const categoriesWithImages = hardcodedCategories.map((cat: any) => ({
        ...cat,
        iconImage: categoryImages[cat.id],
        subcategories: []
      }));
      
      // Store all categories for search suggestions
      setAllCategories(categoriesWithImages.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        subcategories: []
      })));
      
      // Set popular services from first 4 fallback categories
      const popular = categoriesWithImages.slice(0, 4).map((cat: any) => ({
        name: cat.name,
        category: cat.id,
        icon: cat.icon
      }));
      setPopularServices(popular);
      
    }
  }, [categoryIcons, categoryImages, hardcodedCategories]);
  
  const popularAccentPalettes = useMemo(() => [
    { base: '#ec4899', tint: 'rgba(236,72,153,0.12)', glow: 'rgba(236,72,153,0.25)' },
    { base: '#f97316', tint: 'rgba(249,115,22,0.12)', glow: 'rgba(249,115,22,0.25)' },
    { base: '#3b82f6', tint: 'rgba(59,130,246,0.12)', glow: 'rgba(59,130,246,0.25)' },
    { base: '#10b981', tint: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.25)' },
  ], []);
  
  // Generate search suggestions based on query
  const generateSuggestions = useCallback((query: string) => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const queryLower = query.toLowerCase().trim();
    const suggestionsList: Array<{id: string; name: string; type: 'category' | 'subcategory'; categoryId?: string}> = [];

    // Search in categories
    allCategories.forEach(category => {
      // Match category name (prioritize exact matches)
      const categoryNameLower = category.name.toLowerCase();
      if (categoryNameLower.includes(queryLower)) {
        const isExactMatch = categoryNameLower === queryLower || categoryNameLower.startsWith(queryLower);
        suggestionsList.push({
          id: category.id,
          name: category.name,
          type: 'category',
          // Add priority for sorting (exact matches first)
          priority: isExactMatch ? 1 : 2
        } as any);
      }

      // Search in subcategories
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach(subcategory => {
          const subcategoryLower = subcategory.toLowerCase();
          if (subcategoryLower.includes(queryLower)) {
            const isExactMatch = subcategoryLower === queryLower || subcategoryLower.startsWith(queryLower);
            suggestionsList.push({
              id: `${category.id}_${subcategory}`,
              name: subcategory,
              type: 'subcategory',
              categoryId: category.id,
              priority: isExactMatch ? 1 : 2
            } as any);
          }
        });
      }
    });

    // Sort by priority (exact matches first), then limit to top 8
    const sortedSuggestions = suggestionsList.sort((a: any, b: any) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });

    setSuggestions(sortedSuggestions.slice(0, 8));
    setShowSuggestions(sortedSuggestions.length > 0 && query.length > 0);
  }, [allCategories]);

  // Handle search query change with debouncing
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length > 0) {
      // Show suggestions immediately as user types
      generateSuggestions(searchQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, generateSuggestions]);
  
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchFeaturedServices();
  }, [fetchFeaturedServices]);

  useEffect(() => {
    const fetchAds = async () => {
      setIsLoadingAds(true);
      try {
        // TODO: Replace with actual API call once endpoint is available
        // const response = await fetch(`${API_BASE_URL}/ads/home`);
        // const data = await response.json();
        // if (data.success && Array.isArray(data.data)) {
        //   setAdImages(data.data);
        // } else {
        //   setAdImages([]);
        // }

        setAdImages([
          require('../../assets/slider1.png'),
          require('../../assets/slider2.png'),
        ]);
      } catch (error) {
        console.error('Error fetching ads:', error);
        setAdImages([]);
      } finally {
        setIsLoadingAds(false);
      }
    };

    fetchAds();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulse.current, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonPulse.current, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (adImages.length === 0) {
      setCurrentAdIndex(0);
      return;
    }
    setCurrentAdIndex(0);
  }, [adImages]);

  useEffect(() => {
    if (adImages.length <= 1) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [adImages]);

  useEffect(() => {
    if (adImages.length === 0) {
      return;
    }
    adFadeAnim.setValue(0);
    Animated.timing(adFadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [currentAdIndex, adImages, adFadeAnim]);

  const renderSkeletonCards = useCallback(
    (count: number, prefix: string) =>
      Array.from({ length: count }).map((_, idx) => (
        <View key={`${prefix}-${idx}`} style={[styles.featuredCard, styles.skeletonCard]}>
          <Animated.View style={[styles.skeletonOverlay, { opacity: skeletonPulse.current }]} />
        </View>
      )),
    [],
  );

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      // Use apiService which automatically loads token if missing
      await apiService.loadToken();
      const response: any = await apiService.getUnreadNotificationCount();
      
      // Backend returns { success: true, count: number }
      if (response.success) {
        // Check both response.count (backend format) and response.data.unreadCount (alternative format) for compatibility
        const count = response.count ?? response.data?.unreadCount ?? 0;
        setUnreadCount(count);
        console.log('Unread notification count:', count);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
      // Don't show error to user, just log it
    }
  }, []);

  useEffect(() => {
    if (userData) {
      fetchUnreadCount();
      // Refresh unread count periodically (every 30 seconds)
      const interval = setInterval(fetchUnreadCount, 30000);
      
      // Refresh when app comes to foreground
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          fetchUnreadCount();
        }
      });
      
      return () => {
        clearInterval(interval);
        subscription.remove();
      };
    }
  }, [userData, fetchUnreadCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchFeaturedServices(),
        fetchCategories(),
        fetchUnreadCount()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeaturedServices, fetchCategories, fetchUnreadCount]);


  const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || Wrench;
  };

  // Convert FeaturedService to Provider format
  const convertToProvider = (service: FeaturedService): ProviderType => {
    return {
      id: service.id,
      user: {
        fullName: service.user?.fullName || service.User?.fullName || 'Provider',
        email: service.user?.email || service.User?.email || '',
        phone: service.user?.phone || service.User?.phone || '',
        avatarUrl: service.user?.avatarUrl || service.User?.avatarUrl || '',
      },
      businessName: service.businessName,
      category: service.category,
      subcategories: service.subcategories || [],
      locationCity: service.locationCity,
      locationState: service.locationState || '',
      ratingAverage: service.ratingAverage,
      ratingCount: service.ratingCount,
      startingPrice: service.startingPrice || service.hourlyRate || 2000,
      hourlyRate: service.hourlyRate || 2000,
      bio: service.bio || '',
      verificationStatus: service.verificationStatus || 'pending',
      isAvailable: service.isAvailable,
      estimatedArrival: service.estimatedArrival,
      yearsOfExperience: 0,
      brandImages: service.brandImages || [],
      portfolio: service.portfolio || [],
      isTopListed: service.isTopListed === true,
    };
  };

  const handleFeaturedServicePress = (service: FeaturedService) => {
    const provider = convertToProvider(service);
    setSelectedProvider(provider);
    setShowProfileModal(true);
  };

  const handleBookProvider = (provider: ProviderType) => {
    setShowProfileModal(false);
    setBookingProvider(provider);
    setShowBookingModal(true);
  };

  const handleCategoryPress = (categoryId: string) => {
    onCategorySelect(categoryId);
  };

  const handleSearchPress = () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      // Navigate to providers screen with search query
      onCategorySelect('search', trimmedQuery);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: {id: string; name: string; type: 'category' | 'subcategory'; categoryId?: string}) => {
    setShowSuggestions(false);
    
    if (suggestion.type === 'category') {
      setSearchQuery('');
      onCategorySelect(suggestion.id);
    } else if (suggestion.type === 'subcategory' && suggestion.categoryId) {
      // Navigate to the parent category when subcategory is selected
      setSearchQuery('');
      onCategorySelect(suggestion.categoryId);
    } else {
      // If it's a subcategory, use the suggestion name as search query
      const searchText = suggestion.name;
      onCategorySelect('search', searchText);
      setSearchQuery('');
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchFocus = () => {
    // Show suggestions if there are any and query exists
    if (searchQuery && searchQuery.trim().length > 0) {
      // Trigger suggestions generation if needed
      if (suggestions.length === 0 && allCategories.length > 0) {
        generateSuggestions(searchQuery);
      }
      setShowSuggestions(suggestions.length > 0);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const renderProviderCard = (service: FeaturedService, keyPrefix: string) => {
    const CategoryIcon = getCategoryIcon(service.category);
    const subcats = Array.isArray(service.subcategories) ? service.subcategories : [];

    let allImages: string[] = [];

    if (service.brandImages && Array.isArray(service.brandImages) && service.brandImages.length > 0) {
      allImages = [...service.brandImages].filter((url: any) => url && typeof url === 'string' && !url.startsWith('blob:'));
    }

    if (allImages.length < 3 && service.portfolio && Array.isArray(service.portfolio) && service.portfolio.length > 0) {
      const portfolioUrls = service.portfolio.filter((url: any) => url && typeof url === 'string');
      allImages = [...allImages, ...portfolioUrls];
    }

    allImages = Array.from(new Set(allImages)).slice(0, 3);
              
              return (
              <TouchableOpacity 
        key={`${keyPrefix}-${service.id}`}
                    style={styles.featuredCard}
                    onPress={() => handleFeaturedServicePress(service)}
                    activeOpacity={0.8}
                  >
                    {service.isTopListed && (
                      <View style={styles.featuredBadgeCard}>
                        <View style={styles.featuredBadgeContentCard}>
                          <Zap size={14} color="#ffffff" fill="#ffffff" />
                          <Text style={styles.featuredBadgeTextCard}>FEATURED</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.featuredProviderInfo}>
                      <View style={styles.featuredProviderIconContainer}>
                        {(() => {
                          if (service.user?.avatarUrl || service.User?.avatarUrl) {
                            return (
                          <Image
                                source={{ uri: service.user?.avatarUrl || service.User?.avatarUrl }}
                                style={styles.featuredProviderAvatarImage}
                            resizeMode="cover"
                          />
                            );
                          }
                          if (service.brandImages && service.brandImages.length > 0) {
                            const firstImg = service.brandImages[0];
                            if (firstImg && typeof firstImg === 'string') {
                              return (
                                <Image
                                  source={{ uri: firstImg }}
                                  style={styles.featuredProviderAvatarImage}
                                  resizeMode="cover"
                                />
                              );
                            }
                          }
                          if (service.portfolio && service.portfolio.length > 0 && service.portfolio[0]) {
                            return (
                              <Image
                                source={{ uri: service.portfolio[0] }}
                                style={styles.featuredProviderAvatarImage}
                                resizeMode="cover"
                              />
                            );
                          }
                          return <CategoryIcon size={32} color="#ec4899" />;
                        })()}
                      </View>

                      <View style={styles.featuredProviderDetails}>
                        <Text style={styles.featuredProviderName}>{service.businessName}</Text>
                        <Text style={styles.featuredProviderOwner}>
                          by {service.user?.fullName || service.User?.fullName || 'Provider'}
                        </Text>
                        <View style={styles.featuredProviderRating}>
                          <Star size={16} color="#fbbf24" fill="#fbbf24" />
                          <Text style={styles.featuredRatingTextCard}>{service.ratingAverage.toFixed(1)}</Text>
                          <Text style={styles.featuredReviewsTextCard}>({service.ratingCount} reviews)</Text>
                        </View>
                        <View style={styles.featuredProviderLocation}>
                          <MapPin size={14} color="#64748b" />
                          <Text style={styles.featuredLocationTextCard}>
                            {service.locationCity}{service.locationState ? `, ${service.locationState}` : ''}
                          </Text>
                        </View>
                        {service.isAvailable && (
                          <View style={styles.featuredAvailabilityContainer}>
                            <Clock size={14} color="#10b981" />
                            <Text style={styles.featuredAvailabilityText}>{service.estimatedArrival}</Text>
                          </View>
                        )}
                      </View>
                    </View>

        {subcats.length > 0 && (
                        <View style={styles.featuredSubcategoriesContainer}>
                          {subcats.slice(0, 3).map((subcat: string, idx: number) => {
                            const formattedName = subcat
                              .split('_')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ');
                            return (
                              <View key={idx} style={styles.featuredSubcategoryChip}>
                                <Text style={styles.featuredSubcategoryText}>{formattedName}</Text>
                              </View>
                            );
                          })}
                          {subcats.length > 3 && (
                            <View style={styles.featuredSubcategoryChip}>
                              <Text style={styles.featuredSubcategoryText}>+{subcats.length - 3}</Text>
                            </View>
                          )}
                        </View>
        )}
                    
                    <View style={styles.featuredProviderBrandImages}>
                          <View style={styles.featuredBrandImageGrid}>
                            {allImages.length > 0 ? (
                              <>
                                {allImages.map((image, index) => (
                                  <View key={index} style={styles.featuredBrandImageContainer}>
                                <Image
                                      source={{ uri: image }}
                                      style={styles.featuredBrandImage}
                                  resizeMode="cover"
                                />
                              </View>
                            ))}
                                {Array.from({ length: 3 - allImages.length }).map((_, i) => (
                                  <View key={`placeholder-${i}`} style={styles.featuredBrandImagePlaceholder}>
                                    <CategoryIcon size={20} color="#94a3b8" />
                              </View>
                                ))}
                              </>
                            ) : (
                              [1, 2, 3].map((i) => (
                                <View key={i} style={styles.featuredBrandImagePlaceholder}>
                                  <CategoryIcon size={20} color="#94a3b8" />
                              </View>
                              ))
                        )}
                      </View>
                      
                      <View style={[
                        styles.featuredAvailabilityBadge,
                        service.isAvailable ? styles.featuredAvailabilityBadgeAvailable : styles.featuredAvailabilityBadgeBusy
                      ]}>
                        <Text style={styles.featuredAvailabilityBadgeText}>
                          {service.isAvailable ? 'Available' : 'Busy'}
                        </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
              <Text style={styles.userName}>
                {userName}!
              </Text>
            </View>
            <View style={styles.headerRight}>
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
                style={styles.notificationButton}
                onPress={() => onNavigate?.('notifications')}
              >
                <Bell size={20} color="#ec4899" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.subtitle}>Find trusted businesses and professionals</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBarContainer}>
          <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
            <Search size={20} color={isSearchFocused ? "#ec4899" : "#94a3b8"} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for services..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => {
                  setIsSearchFocused(true);
                  handleSearchFocus();
                }}
                onBlur={() => {
                  setIsSearchFocused(false);
                  handleSearchBlur();
                }}
                returnKeyType="search"
                onSubmitEditing={handleSearchPress}
              />
            </View>
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(item)}
                      activeOpacity={0.7}
                    >
                      <Search size={16} color="#64748b" />
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionText}>{item.name}</Text>
                        <Text style={styles.suggestionType}>
                          {item.type === 'category' ? 'Category' : 'Service'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
            <Search size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Popular Services */}
        <View style={styles.section}>
          <View>
            <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
              <TouchableOpacity
                style={styles.sectionActionButton}
                onPress={() => onNavigate?.('providers')}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionActionText}>See all</Text>
                <ArrowRight size={16} color="#ec4899" />
              </TouchableOpacity>
            </View>
           
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularScrollContent}
          >
            {popularServices.map((service, index) => {
              const palette = popularAccentPalettes[index % popularAccentPalettes.length];
              const IconComponent = service.icon || Wrench;
              const hasIcon = !!IconComponent;
              const fallbackInitial = service.name?.charAt(0)?.toUpperCase() || '?';
              
              return (
              <TouchableOpacity 
                key={index} 
                  style={[
                    styles.popularCard,
                    { borderColor: palette.tint, shadowColor: palette.glow },
                  ]}
                onPress={() => handleCategoryPress(service.category)}
                  activeOpacity={0.88}
                >
                  <View style={[styles.popularAccent, { backgroundColor: palette.base }]} />
                  <View style={styles.popularCardInner}>
                    <View style={styles.popularIconWrapper}>
                      <View style={[styles.popularIconCircle, { backgroundColor: palette.tint }]}>
                        {hasIcon ? (
                          <IconComponent size={24} color={palette.base} />
                        ) : (
                          <Text style={[styles.popularIconFallback, { color: palette.base }]}>
                            {fallbackInitial}
                          </Text>
                        )}
                </View>
                    </View>
                    <View style={styles.popularBody}>
                      <Text style={styles.popularTitle}>{service.name}</Text>
                      <Text style={styles.popularDescription}>
                        Frequently booked by customers nearby.
                      </Text>
                    </View>
                    <View style={styles.popularFooter}>
                      <Text style={[styles.popularFooterText, { color: palette.base }]}>
                        Discover providers
                      </Text>
                      <ArrowRight size={16} color={palette.base} />
                        </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
        </View>

        {/* Promotional Spotlight */}
        <View style={styles.section}>
          {/* <View style={[styles.sectionHeader, styles.promoHeader]}>
            <Text style={styles.sectionTitle}>Promotions</Text>
              <TouchableOpacity
              style={styles.sectionActionButton}
              onPress={() => onNavigate?.('providers')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionActionText}>View offers</Text>
              <ArrowRight size={16} color="#ec4899" />
              </TouchableOpacity>
        </View> */}

          {isLoadingAds ? (
            <View style={styles.adsLoadingCard}>
              <Text style={styles.adsLoadingText}>Loading offers…</Text>
            </View>
          ) : adImages.length === 0 ? (
            <View style={styles.adsEmptyCard}>
              <Text style={styles.adsEmptyText}>No promotions available right now.</Text>
            </View>
          ) : (
            <Animated.View style={[styles.adsCard, { opacity: adFadeAnim }]}>
                          <Image
                source={adImages[currentAdIndex]}
                style={styles.adsImage}
                            resizeMode="cover"
                          />
              <View style={styles.adsOverlay} />
              <View style={styles.adsContent}>
                <Text style={styles.adsHeadline}>Limited Time Offer</Text>
                <Text style={styles.adsSubtext}>Book now and enjoy exclusive savings.</Text>
                      </View>
            </Animated.View>
          )}
        </View>

  {/* Top Rated Providers */}
  <View style={styles.featuredSection}>
    <Text style={styles.sectionTitle}>Top Rated Providers</Text>
    {isLoadingFeatured ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
        {renderSkeletonCards(3, 'top-rated-skeleton')}
      </ScrollView>
    ) : topRatedServices.length === 0 ? (
      <View style={styles.emptyFeaturedContainer}>
        <Text style={styles.emptyFeaturedText}>No top rated providers available</Text>
      </View>
    ) : (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
        {topRatedServices.map((service) => renderProviderCard(service, 'top-rated'))}
      </ScrollView>
    )}
  </View>

        {/* Featured Services */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Providers</Text>
          {isLoadingFeatured ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
              {renderSkeletonCards(3, 'featured-skeleton')}
            </ScrollView>
          ) : featuredServices.length === 0 ? (
            <View style={styles.emptyFeaturedContainer}>
              <Text style={styles.emptyFeaturedText}>No featured services available</Text>
                    </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
              {featuredServices.map((service) => renderProviderCard(service, 'featured'))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

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
          Alert.alert(
            'Booking Confirmed',
            `Your booking (ID: ${bookingId}) has been placed.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  onNavigate?.('bookings');
                },
              },
            ],
            { cancelable: false }
          );
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    borderWidth: 1.5,
    borderColor: '#fce7f3',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
    shadowOpacity: 0.3,
  },
  refreshingIcon: {
    transform: [{ rotate: '180deg' }],
  },
  notificationButton: {
    position: 'relative',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    borderWidth: 1.5,
    borderColor: '#fce7f3',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  greeting: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBarFocused: {
    borderColor: '#ec4899',
    shadowColor: '#ec4899',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  searchBarContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 10,
    fontWeight: '500',
    paddingVertical: 0,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 6,
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    zIndex: 1000,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 14,
  },
  suggestionText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  suggestionType: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    padding: 16,
    minWidth: 56,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    marginTop: 10,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    marginRight: 12,
    flexShrink: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
    flexWrap: 'wrap',
  },
  sectionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fdf2f8',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fce7f3',
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  skeletonCard: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ec4899',
  },
  popularScrollContent: {
    paddingRight: 20,
    gap: 18,
  },
  popularCard: {
    width: 220,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  popularAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
  },
  popularCardInner: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    gap: 18,
  },
  popularIconWrapper: {
    position: 'relative',
  },
  popularIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  popularIconFallback: {
    fontSize: 20,
    fontWeight: '700',
  },
  popularBody: {
    gap: 8,
  },
  popularTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  popularDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  popularFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  popularFooterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  adsScrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  adsLoadingCard: {
    width: 240,
    height: 140,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adsLoadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  adsEmptyCard: {
    width: 240,
    height: 140,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adsEmptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  adsCard: {
    width: '95%',
    maxWidth: 360,
    height: 160,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    alignSelf: 'center',
  },
  adsImage: {
    width: '100%',
    height: '100%',
  },
  adsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  adsContent: {
    position: 'absolute',
    inset: 0,
    padding: 18,
    justifyContent: 'flex-end',
    gap: 8,
  },
  adsHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  adsSubtext: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  promoSection: {
    alignItems: 'center',
  },
  promoHeader: {
    width: '100%',
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
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  featuredBadgeCard: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 20,
  },
  featuredBadgeContentCard: {
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
    backgroundColor: '#f97316',
  },
  featuredBadgeTextCard: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  featuredProviderInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featuredProviderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredProviderAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  featuredProviderDetails: {
    flex: 1,
  },
  featuredProviderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  featuredProviderOwner: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  featuredProviderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredRatingTextCard: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
    marginRight: 8,
  },
  featuredReviewsTextCard: {
    fontSize: 12,
    color: '#9ca3af',
  },
  featuredProviderLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featuredLocationTextCard: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  featuredAvailabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredAvailabilityText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '500',
  },
  featuredSubcategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    marginTop: 4,
  },
  featuredSubcategoryChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featuredSubcategoryText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  featuredProviderBrandImages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featuredBrandImageGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  featuredBrandImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  featuredBrandImage: {
    width: '100%',
    height: '100%',
  },
  featuredBrandImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  featuredAvailabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredAvailabilityBadgeAvailable: {
    backgroundColor: '#10b981',
  },
  featuredAvailabilityBadgeBusy: {
    backgroundColor: '#f59e0b',
  },
  featuredAvailabilityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyFeaturedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyFeaturedText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default HomeScreen;