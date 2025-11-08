// Provider Service for managing provider data and API calls

// const API_BASE_URL = 'http://localhost:8000/api';
const API_BASE_URL = 'https://alabastar-backend.onrender.com/api';
export interface Provider {
  id: string;
  user: {
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
  businessName: string;
  category: string;
  subcategories: string[];
  locationCity: string;
  locationState: string;
  ratingAverage: number;
  ratingCount: number;
  startingPrice: number;
  hourlyRate: number;
  bio: string;
  verificationStatus: string;
  isAvailable: boolean;
  estimatedArrival: string;
  yearsOfExperience: number;
  brandImages: any[];
  portfolio?: string[];
  isTopListed: boolean;
  distance?: number;
  latitude?: number;
  longitude?: number;
}

export interface ProviderFilters {
  category?: string;
  location?: string;
  search?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  available?: boolean;
  sortBy?: 'price' | 'rating' | 'distance' | 'reviews';
  sortOrder?: 'asc' | 'desc';
}

export interface ProviderSearchResponse {
  success: boolean;
  data: {
    providers: Provider[];
    total: number;
    page: number;
    limit: number;
  };
}

class ProviderService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Normalize provider data from API
   */
  private normalizeProviderData(provider: any): Provider {
    // Normalize subcategories - handle null, string, or array
    let subcategories: string[] = [];
    if (provider.subcategories) {
      if (Array.isArray(provider.subcategories)) {
        subcategories = provider.subcategories;
      } else if (typeof provider.subcategories === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(provider.subcategories);
          subcategories = Array.isArray(parsed) ? parsed : [];
        } catch {
          // If JSON parse fails, treat it as a single subcategory
          subcategories = [provider.subcategories];
        }
      }
    }
    
    return {
      id: provider.id,
      user: {
        fullName: provider.User?.fullName || provider.user?.fullName || 'Provider',
        email: provider.User?.email || provider.user?.email || '',
        phone: provider.User?.phone || provider.user?.phone || '',
        avatarUrl: provider.User?.avatarUrl || provider.user?.avatarUrl || ''
      },
      businessName: provider.businessName || 'Business',
      category: provider.category || '',
      subcategories: subcategories,
      locationCity: provider.locationCity || '',
      locationState: provider.locationState || '',
      ratingAverage: provider.ratingAverage || 0,
      ratingCount: provider.ratingCount || 0,
      startingPrice: provider.startingPrice || 5000,
      hourlyRate: provider.hourlyRate || 2000,
      bio: provider.bio || '',
      verificationStatus: provider.verificationStatus || 'pending',
      isAvailable: provider.isAvailable !== false,
      estimatedArrival: provider.estimatedArrival || '30 mins',
      yearsOfExperience: provider.yearsOfExperience || 0,
      brandImages: provider.brandImages || [],
      portfolio: provider.portfolio || [],
      isTopListed: provider.isTopListed || false,
      distance: provider.distance,
      latitude: provider.latitude,
      longitude: provider.longitude,
    };
  }

  /**
   * Normalize multiple providers
   */
  private normalizeProvidersData(providers: any[]): Provider[] {
    return providers.map(provider => this.normalizeProviderData(provider));
  }

  /**
   * Search providers with filters
   */
  async searchProviders(filters: ProviderFilters = {}): Promise<ProviderSearchResponse> {
    const searchParams = new URLSearchParams();

    if (filters.category) searchParams.append('category', filters.category);
    if (filters.location) searchParams.append('location', filters.location);
    if (filters.search) searchParams.append('search', filters.search);
    if (filters.minRating) searchParams.append('minRating', filters.minRating.toString());
    if (filters.maxPrice) searchParams.append('maxPrice', filters.maxPrice.toString());
    if (filters.minPrice) searchParams.append('minPrice', filters.minPrice.toString());
    if (filters.available !== undefined) searchParams.append('available', filters.available.toString());
    if (filters.sortBy) searchParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder);

    const url = `${this.baseURL}/providers/search?${searchParams.toString()}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // Normalize provider data
      if (data.success && data.data?.providers) {
        data.data.providers = this.normalizeProvidersData(data.data.providers);
      }
      
      return data;
    } catch (error) {
      console.error('Error searching providers:', error);
      throw error;
    }
  }

  /**
   * Get providers by category
   */
  async getProvidersByCategory(category: string, filters: Partial<ProviderFilters> = {}): Promise<ProviderSearchResponse> {
    const searchParams = new URLSearchParams();
    
    if (filters.location) searchParams.append('location', filters.location);
    if (filters.minRating) searchParams.append('minRating', filters.minRating.toString());
    if (filters.maxPrice) searchParams.append('maxPrice', filters.maxPrice.toString());
    if (filters.minPrice) searchParams.append('minPrice', filters.minPrice.toString());
    if (filters.available !== undefined) searchParams.append('available', filters.available.toString());
    if (filters.sortBy) searchParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder);

    const queryString = searchParams.toString();
    const url = `${this.baseURL}/providers/category/${category}${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // Normalize provider data
      if (data.success && data.data?.providers) {
        data.data.providers = this.normalizeProvidersData(data.data.providers);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching providers by category:', error);
      throw error;
    }
  }

  /**
   * Get provider by ID
   */
  async getProviderById(id: string): Promise<Provider | null> {
    try {
      const response = await fetch(`${this.baseURL}/providers/${id}`);
      const data = await response.json();
      return data.success ? data.data?.provider : null;
    } catch (error) {
      console.error('Error fetching provider:', error);
      return null;
    }
  }

  /**
   * Sort providers
   */
  sortProviders(providers: Provider[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): Provider[] {
    const sorted = [...providers].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = a.hourlyRate - b.hourlyRate;
          break;
        case 'rating':
          comparison = a.ratingAverage - b.ratingAverage;
          break;
        case 'reviews':
          comparison = a.ratingCount - b.ratingCount;
          break;
        case 'distance':
          comparison = (a.distance || 0) - (b.distance || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Filter providers
   */
  filterProviders(providers: Provider[], filters: Partial<ProviderFilters>): Provider[] {
    return providers.filter(provider => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          provider.businessName.toLowerCase().includes(searchLower) ||
          provider.user.fullName.toLowerCase().includes(searchLower) ||
          (Array.isArray(provider.subcategories) && provider.subcategories.some(sub => sub.toLowerCase().includes(searchLower))) ||
          provider.bio.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Rating filter
      if (filters.minRating && provider.ratingAverage < filters.minRating) {
        return false;
      }

      // Price filter
      if (filters.minPrice && provider.hourlyRate < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && provider.hourlyRate > filters.maxPrice) {
        return false;
      }

      // Availability filter
      if (filters.available !== undefined && provider.isAvailable !== filters.available) {
        return false;
      }

      return true;
    });
  }
}

export const providerService = new ProviderService();

