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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { API_BASE_URL } from '../services/api';

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
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const adFadeAnim = useRef(new Animated.Value(0)).current;
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

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const base = 'http://localhost:8000';
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${base}/api/notifications/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.data?.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    if (userData) {
      fetchUnreadCount();
    }
  }, [userData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchFeaturedServices(),
        fetchCategories()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeaturedServices, fetchCategories]);


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
        activeOpacity={0.9}
      >
        {/* Premium Badge */}
        {service.isTopListed && (
          <View style={styles.featuredBadgeCard}>
            <View style={styles.featuredBadgeContentCard}>
              <Zap size={12} color="#ffffff" fill="#ffffff" />
              <Text style={styles.featuredBadgeTextCard}>FEATURED</Text>
            </View>
          </View>
        )}

        {/* Header Section with Avatar and Info */}
        <View style={styles.featuredCardHeader}>
          <View style={styles.featuredProviderAvatarWrapper}>
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
              return (
                <View style={styles.featuredProviderIconFallback}>
                  <CategoryIcon size={28} color="#ec4899" />
                </View>
              );
            })()}
            {service.isAvailable && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          <View style={styles.featuredProviderInfo}>
            <Text style={styles.featuredProviderName} numberOfLines={1}>
              {service.businessName}
            </Text>
            <Text style={styles.featuredProviderOwner} numberOfLines={1}>
              {service.user?.fullName || service.User?.fullName || 'Provider'}
            </Text>
            <View style={styles.featuredProviderMetaRow}>
              <View style={styles.featuredProviderRating}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.featuredRatingTextCard}>{service.ratingAverage.toFixed(1)}</Text>
                <Text style={styles.featuredReviewsTextCard}>({service.ratingCount})</Text>
              </View>
              {service.isAvailable && (
                <View style={styles.featuredAvailabilityContainer}>
                  <Clock size={12} color="#10b981" />
                  <Text style={styles.featuredAvailabilityText}>{service.estimatedArrival}</Text>
                </View>
              )}
            </View>
            <View style={styles.featuredProviderLocation}>
              <MapPin size={12} color="#64748b" />
              <Text style={styles.featuredLocationTextCard} numberOfLines={1}>
                {service.locationCity}{service.locationState ? `, ${service.locationState}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Subcategories Tags */}
        {subcats.length > 0 && (
          <View style={styles.featuredSubcategoriesContainer}>
            {subcats.slice(0, 2).map((subcat: string, idx: number) => {
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
            {subcats.length > 2 && (
              <View style={styles.featuredSubcategoryChip}>
                <Text style={styles.featuredSubcategoryText}>+{subcats.length - 2}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Portfolio Gallery */}
        <View style={styles.featuredProviderBrandImages}>
          <View style={styles.featuredBrandImageGrid}>
            {allImages.length > 0 ? (
              <>
                {allImages.slice(0, 3).map((image, index) => (
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
                    <CategoryIcon size={18} color="#cbd5e1" />
                  </View>
                ))}
              </>
            ) : (
              [1, 2, 3].map((i) => (
                <View key={i} style={styles.featuredBrandImagePlaceholder}>
                  <CategoryIcon size={18} color="#cbd5e1" />
                </View>
              ))
            )}
          </View>
        </View>

        {/* Footer with Availability Badge */}
        <View style={styles.featuredCardFooter}>
          <View style={[
            styles.featuredAvailabilityBadge,
            service.isAvailable ? styles.featuredAvailabilityBadgeAvailable : styles.featuredAvailabilityBadgeBusy
          ]}>
            <View style={[
              styles.availabilityDot,
              service.isAvailable ? styles.availabilityDotActive : styles.availabilityDotInactive
            ]} />
            <Text style={styles.featuredAvailabilityBadgeText}>
              {service.isAvailable ? 'Available Now' : 'Currently Busy'}
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
                {userData?.role === 'provider' 
                  ? 'Provider' 
                  : userData?.user?.fullName || 'User'}!
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
                <View style={[styles.badge, unreadCount === 0 && styles.badgeEmpty]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.subtitle}>Find trusted pros for any job</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for services..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading top rated providers...</Text>
                              </View>
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
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading featured services...</Text>
                        </View>
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
          Alert.alert('Booking Confirmed', `Your booking (ID: ${bookingId}) has been placed.`);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    borderRadius: 24,
    borderWidth: 0,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
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
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeEmpty: {
    backgroundColor: '#94a3b8',
  },
  greeting: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: 0.2,
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
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  searchBarContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionType: {
    fontSize: 12,
    color: '#64748b',
  },
  searchButton: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  section: {
    marginTop: 8,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    marginRight: 12,
    flexShrink: 1,
    letterSpacing: -0.5,
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
    marginBottom: 32,
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
    marginTop: 4,
  },
  featuredCard: {
    width: 320,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginRight: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
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
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 24,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#f97316',
  },
  featuredBadgeTextCard: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featuredProviderAvatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  featuredProviderAvatarImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  featuredProviderIconFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  featuredProviderInfo: {
    flex: 1,
    paddingTop: 2,
  },
  featuredProviderName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  featuredProviderOwner: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
    fontWeight: '500',
  },
  featuredProviderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featuredProviderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredRatingTextCard: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f59e0b',
    marginLeft: 2,
  },
  featuredReviewsTextCard: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  featuredProviderLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredLocationTextCard: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  featuredAvailabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredAvailabilityText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  featuredSubcategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  featuredSubcategoryChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  featuredSubcategoryText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  featuredProviderBrandImages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  featuredBrandImageGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featuredBrandImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredBrandImage: {
    width: '100%',
    height: '100%',
  },
  featuredBrandImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#e2e8f0',
  },
  featuredCardFooter: {
    alignItems: 'center',
  },
  featuredAvailabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  featuredAvailabilityBadgeAvailable: {
    backgroundColor: '#10b981',
  },
  featuredAvailabilityBadgeBusy: {
    backgroundColor: '#f59e0b',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availabilityDotActive: {
    backgroundColor: '#ffffff',
  },
  availabilityDotInactive: {
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  featuredAvailabilityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
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