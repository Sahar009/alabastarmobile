import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_BASE_URL = 'https://backend.alabastar.ng/api';

// API Response Interface
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Auth Interfaces
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'provider';
  status: string;
  provider: string;
}

export interface Customer {
  id: string;
  preferences: any;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  customer?: Customer;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// API Service Class
class ApiService {
  public baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Set authentication token
  async setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        await AsyncStorage.setItem('token', token);
      } else {
        await AsyncStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Load token from AsyncStorage
  async loadToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        this.token = token;
      }
      return token;
    } catch (error) {
      console.error('Error loading token:', error);
      return null;
    }
  }

  // Set user data
  async setUser(user: User | null) {
    try {
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  // Get authentication headers
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers as Record<string, string> || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Test API connection
  async testConnection(): Promise<ApiResponse> {
    return this.request('/auth/test');
  }

  // Authentication Methods
  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(loginData: LoginData): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  async loginProvider(loginData: LoginData): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/provider/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  async verifyToken(): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/verify');
  }

  async updateProfile(updateData: Partial<User>): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteAccount(): Promise<ApiResponse> {
    return this.request('/auth/delete-account', {
      method: 'DELETE',
    });
  }

  // Google Authentication
  async googleAuth(googleUserData: {
    email: string;
    name: string;
    picture?: string;
    googleId: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleUserData),
    });
  }

  // Firebase Authentication (for future implementation)
  async firebaseAuth(firebaseData: {
    idToken: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    uid: string;
    phone?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify(firebaseData),
    });
  }

  // Booking Methods
  async getMyBookings(params?: {
    userType?: string;
    status?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.userType) queryParams.append('userType', params.userType);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/bookings${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any>(endpoint, {
      method: 'GET',
    });
  }

  // Review Methods
  async submitReview(reviewData: {
    bookingId: string;
    rating: number;
    comment?: string | null;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Earnings/Withdrawal Methods
  async getEarningsStats(): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Fetching earnings stats...');
    
    try {
      const response = await this.request<any>('/earnings/stats', {
        method: 'GET',
      });
      
      console.log('[API Service] ✅ Earnings stats response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Earnings stats error:', {
        message: error.message,
        endpoint: '/earnings/stats',
      });
      throw error;
    }
  }

  async getBanks(): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Fetching banks list...');
    
    try {
      const response = await this.request<any>('/paystack/banks', {
        method: 'GET',
      });
      
      console.log('[API Service] ✅ Banks response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        banksCount: Array.isArray(response.data) ? response.data.length : 'N/A',
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Banks error:', {
        message: error.message,
        endpoint: '/paystack/banks',
      });
      throw error;
    }
  }

  async verifyAccount(accountNumber: string, bankCode: string): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Verifying account...', {
      accountNumber: accountNumber ? `${accountNumber.substring(0, 3)}***` : 'N/A',
      bankCode,
    });
    
    try {
      const response = await this.request<any>('/paystack/verify-account', {
        method: 'POST',
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      
      console.log('[API Service] ✅ Account verification response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        accountName: response.data?.account_name || 'N/A',
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Account verification error:', {
        message: error.message,
        endpoint: '/paystack/verify-account',
      });
      throw error;
    }
  }

  async requestWithdrawal(withdrawalData: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Requesting withdrawal:', {
      amount: withdrawalData.amount,
      bankName: withdrawalData.bankName,
      accountNumber: withdrawalData.accountNumber ? `${withdrawalData.accountNumber.substring(0, 3)}***` : 'N/A',
      accountName: withdrawalData.accountName,
    });
    
    try {
      const response = await this.request<any>('/earnings/withdraw', {
        method: 'POST',
        body: JSON.stringify(withdrawalData),
      });
      
      console.log('[API Service] ✅ Withdrawal response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        fullResponse: JSON.stringify(response, null, 2),
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Withdrawal error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        endpoint: '/earnings/withdraw',
        withdrawalData: {
          ...withdrawalData,
          accountNumber: withdrawalData.accountNumber ? `${withdrawalData.accountNumber.substring(0, 3)}***` : 'N/A',
        },
      });
      throw error;
    }
  }

  // Provider Profile Methods
  async getProviderProfile(): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Fetching provider profile...');
    
    try {
      const response = await this.request<any>('/providers/profile', {
        method: 'GET',
      });
      
      console.log('[API Service] ✅ Provider profile response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        businessName: response.data?.businessName || 'N/A',
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Provider profile error:', {
        message: error.message,
        endpoint: '/providers/profile',
      });
      throw error;
    }
  }

  async updateProviderProfile(updateData: {
    businessName?: string;
    category?: string;
    subcategories?: string[];
    bio?: string;
    locationCity?: string;
    locationState?: string;
    latitude?: string;
    longitude?: string;
    portfolio?: string[];
  }): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Updating provider profile...', {
      businessName: updateData.businessName,
      category: updateData.category,
      hasSubcategories: Array.isArray(updateData.subcategories) && updateData.subcategories.length > 0,
      hasPortfolio: Array.isArray(updateData.portfolio) && updateData.portfolio.length > 0,
    });
    
    try {
      const response = await this.request<any>('/providers/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      console.log('[API Service] ✅ Provider profile update response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Provider profile update error:', {
        message: error.message,
        endpoint: '/providers/profile',
      });
      throw error;
    }
  }

  // Get popular subcategories for a category
  async getPopularSubcategories(category: string, limit: number = 20): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Fetching popular subcategories...', { category, limit });
    
    try {
      const response = await this.request<any>(`/providers/subcategories/${category}?limit=${limit}`, {
        method: 'GET',
      });
      
      console.log('[API Service] ✅ Popular subcategories response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        subcategoriesCount: response.data?.subcategories?.length || 0,
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Popular subcategories error:', {
        message: error.message,
        endpoint: `/providers/subcategories/${category}`,
      });
      throw error;
    }
  }

  // Provider Settings Methods
  async getProviderSettings(): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Fetching provider settings...');
    
    try {
      // Fetch both notification preferences and provider profile for privacy settings
      const [notificationPrefs, providerProfile] = await Promise.all([
        this.request<any>('/notifications/preferences', {
          method: 'GET',
        }).catch(() => ({ success: false, data: null })),
        this.request<any>('/providers/profile', {
          method: 'GET',
        }).catch(() => ({ success: false, data: null })),
      ]);

      // Combine settings
      const settings: {
        notifications: { email: boolean; sms: boolean; push: boolean } | null;
        privacy: { showProfile: boolean; showContactInfo: boolean; showPortfolio: boolean } | null;
      } = {
        notifications: notificationPrefs.success && notificationPrefs.data ? {
          email: notificationPrefs.data.emailEnabled ?? true,
          sms: notificationPrefs.data.smsEnabled ?? false,
          push: notificationPrefs.data.pushEnabled ?? true,
        } : null,
        privacy: null,
      };

      // Extract privacy settings from provider profile's User object or fetch from user profile
      if (providerProfile.success && providerProfile.data?.User?.privacySettings) {
        // Privacy settings are in the User object within provider profile
        settings.privacy = providerProfile.data.User.privacySettings;
        console.log('[API Service] ✅ Loaded privacy settings from provider profile User');
      } else {
        // Try fetching from user profile endpoint
        try {
          const userProfileResponse = await this.request<any>('/auth/profile', {
            method: 'GET',
          }).catch(() => ({ success: false, data: null }));
          
          if (userProfileResponse.success && userProfileResponse.data?.user?.privacySettings) {
            settings.privacy = userProfileResponse.data.user.privacySettings;
            console.log('[API Service] ✅ Loaded privacy settings from user profile');
          } else {
            // Fallback: Try loading from local storage
            try {
              const localPrivacySettings = await AsyncStorage.getItem('user_privacy_settings');
              if (localPrivacySettings) {
                settings.privacy = JSON.parse(localPrivacySettings);
                console.log('[API Service] ✅ Loaded privacy settings from local storage');
              } else {
                // Use default privacy settings
                settings.privacy = {
                  showProfile: true,
                  showContactInfo: true,
                  showPortfolio: true,
                };
              }
            } catch (storageError) {
              console.warn('[API Service] Could not load privacy settings from local storage:', storageError);
              settings.privacy = {
                showProfile: true,
                showContactInfo: true,
                showPortfolio: true,
              };
            }
          }
        } catch (error) {
          console.warn('[API Service] Could not fetch user profile for privacy settings:', error);
          // Fallback to defaults
          settings.privacy = {
            showProfile: true,
            showContactInfo: true,
            showPortfolio: true,
          };
        }
      }

      console.log('[API Service] ✅ Provider settings response:', {
        hasNotifications: !!settings.notifications,
        hasPrivacy: !!settings.privacy,
      });

      return {
        success: true,
        message: 'Provider settings retrieved successfully',
        data: settings,
      };
    } catch (error: any) {
      console.error('[API Service] ❌ Provider settings error:', {
        message: error.message,
        endpoint: '/providers/settings',
      });
      throw error;
    }
  }

  async updateProviderNotificationSettings(settings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  }): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Updating provider notification settings...', settings);
    
    try {
      const response = await this.request<any>('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          emailEnabled: settings.email,
          smsEnabled: settings.sms,
          pushEnabled: settings.push,
        }),
      });
      
      console.log('[API Service] ✅ Notification settings update response:', {
        success: response.success,
        message: response.message,
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Notification settings update error:', {
        message: error.message,
        endpoint: '/notifications/preferences',
      });
      throw error;
    }
  }

  async updateProviderPrivacySettings(settings: {
    showProfile: boolean;
    showContactInfo: boolean;
    showPortfolio: boolean;
  }): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Updating privacy settings (user-level)...', settings);
    
    try {
      // Update via user profile endpoint - works for both providers and customers
      const response = await this.request<any>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          privacySettings: settings,
        }),
      });
      
      console.log('[API Service] ✅ Privacy settings update response:', {
        success: response.success,
        message: response.message,
      });
      
      // Store in AsyncStorage as backup
      if (response.success) {
        try {
          await AsyncStorage.setItem('user_privacy_settings', JSON.stringify(settings));
        } catch (storageError) {
          console.warn('[API Service] Could not store privacy settings locally:', storageError);
        }
      }
      
      return {
        success: true,
        message: 'Privacy settings updated successfully',
        data: settings,
      };
    } catch (error: any) {
      console.warn('[API Service] ⚠️ Privacy settings API not available, storing locally:', error.message);
      
      // Fallback: Store locally in AsyncStorage
      try {
        await AsyncStorage.setItem('user_privacy_settings', JSON.stringify(settings));
        
        return {
          success: true,
          message: 'Privacy settings saved locally',
          data: settings,
        };
      } catch (storageError: any) {
        console.error('[API Service] ❌ Could not store privacy settings:', storageError);
        throw new Error('Failed to save privacy settings');
      }
    }
  }

  // Provider Subscription Methods
  async getProviderSubscription(): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Fetching provider subscription...');
    
    try {
      const response = await this.request<any>('/subscriptions/my-subscription', {
        method: 'GET',
      });
      
      console.log('[API Service] ✅ Provider subscription response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        status: response.data?.status || 'N/A',
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Provider subscription error:', {
        message: error.message,
        endpoint: '/subscriptions/my-subscription',
      });
      throw error;
    }
  }

  async getProviderSubscriptionHistory(): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Fetching provider subscription history...');
    
    try {
      const response = await this.request<any>('/subscriptions/history', {
        method: 'GET',
      });
      
      console.log('[API Service] ✅ Provider subscription history response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        historyCount: Array.isArray(response.data) ? response.data.length : 'N/A',
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Provider subscription history error:', {
        message: error.message,
        endpoint: '/subscriptions/history',
      });
      throw error;
    }
  }

  async getSubscriptionPlans(): Promise<ApiResponse<any>> {
    console.log('[API Service] 🚀 Fetching subscription plans...');
    
    try {
      const response = await this.request<any>('/subscription-plans/plans', {
        method: 'GET',
      });
      
      console.log('[API Service] ✅ Subscription plans response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        plansCount: Array.isArray(response.data) ? response.data.length : 'N/A',
      });
      
      return response;
    } catch (error: any) {
      console.error('[API Service] ❌ Subscription plans error:', {
        message: error.message,
        endpoint: '/subscription-plans/plans',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export the class for testing or multiple instances
export default ApiService;

