// API Configuration
// export const API_BASE_URL = 'http://localhost:8000/api'; // Update this to your backend URL
export const API_BASE_URL = "https://alabastar-backend.onrender.com/api"
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
  avatarUrl?: string;
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
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Set authentication token
  async setToken(token: string | null) {
    this.token = token;
    // Store token in AsyncStorage for persistence
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (token) {
      await AsyncStorage.setItem('token', token);
    } else {
      await AsyncStorage.removeItem('token');
    }
  }

  // Store user data
  async setUser(user: any) {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('user');
    }
  }

  // Load token from AsyncStorage on app initialization
  async loadToken() {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    try {
      const token = await AsyncStorage.getItem('token');
      this.token = token;
      return token;
    } catch (error) {
      console.error('Error loading token:', error);
      return null;
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
    // Always ensure token is loaded from AsyncStorage before making requests
    // This ensures tokens persist across app restarts and after registration
    if (!this.token) {
      await this.loadToken();
    }
    
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    
    // Immediate log to verify function is called
    console.warn('🚀 API Request initiated:', method, url);
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    // Log request details
    const requestBody = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : null;
    const headersObj = config.headers as Record<string, string>;
    
    // Use console.warn for visibility in Metro terminal
    console.warn('\n========================================');
    console.warn('📤 API REQUEST');
    console.warn('========================================');
    console.warn('Method:', method);
    console.warn('URL:', url);
    console.warn('Headers:', JSON.stringify({
      ...headersObj,
      Authorization: headersObj?.Authorization ? 'Bearer ***' : undefined,
    }, null, 2));
    if (requestBody) {
      console.warn('Body:', JSON.stringify(requestBody, null, 2));
    }
    console.warn('Timestamp:', new Date().toISOString());
    console.warn('========================================\n');
    
    // Also log to console.log for DevTools
    console.log('\n========================================');
    console.log('📤 API REQUEST');
    console.log('========================================');
    console.log('Method:', method);
    console.log('URL:', url);
    console.log('Headers:', {
      ...headersObj,
      Authorization: headersObj?.Authorization ? 'Bearer ***' : undefined,
    });
    if (requestBody) {
      console.log('Body:', JSON.stringify(requestBody, null, 2));
    }
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================\n');

    const startTime = Date.now();

    try {
      const response = await fetch(url, config);
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      // Log response details
      console.warn('\n========================================');
      console.warn('📥 API RESPONSE');
      console.warn('========================================');
      console.warn('Method:', method);
      console.warn('URL:', url);
      console.warn('Status:', response.status, response.statusText);
      console.warn('Response Time:', `${responseTime}ms`);
      console.warn('Response Data:', JSON.stringify(data, null, 2));
      console.warn('Timestamp:', new Date().toISOString());
      console.warn('========================================\n');
      
      // Also log to console.log for DevTools
      console.log('\n========================================');
      console.log('📥 API RESPONSE');
      console.log('========================================');
      console.log('Method:', method);
      console.log('URL:', url);
      console.log('Status:', response.status, response.statusText);
      console.log('Response Time:', `${responseTime}ms`);
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      console.log('========================================\n');

      if (!response.ok) {
        console.error('\n========================================');
        console.error('❌ API ERROR RESPONSE');
        console.error('========================================');
        console.error('Method:', method);
        console.error('URL:', url);
        console.error('Status:', response.status);
        console.error('Error:', data.message || `HTTP error! status: ${response.status}`);
        console.error('Response Data:', JSON.stringify(data, null, 2));
        console.error('========================================\n');
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('\n========================================');
      console.error('❌ API REQUEST FAILED');
      console.error('========================================');
      console.error('Method:', method);
      console.error('URL:', url);
      console.error('Response Time:', `${responseTime}ms`);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.stack) {
        console.error('Stack:', error.stack);
      }
      console.error('Timestamp:', new Date().toISOString());
      console.error('========================================\n');
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

  async uploadProfilePicture(formData: FormData): Promise<ApiResponse<{ avatarUrl: string; user?: User }>> {
    const url = `${this.baseURL}/auth/profile/picture`;
    
    const config: RequestInit = {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: formData,
    };

    const headersObj = config.headers as Record<string, string>;
    
    // Use console.warn for visibility in Metro terminal
    console.warn('\n========================================');
    console.warn('📤 API REQUEST (FormData)');
    console.warn('========================================');
    console.warn('Method: POST');
    console.warn('URL:', url);
    console.warn('Headers:', JSON.stringify({
      ...headersObj,
      Authorization: headersObj?.Authorization ? 'Bearer ***' : undefined,
    }, null, 2));
    console.warn('Body: [FormData - file upload]');
    console.warn('Timestamp:', new Date().toISOString());
    console.warn('========================================\n');
    
    // Also log to console.log for DevTools
    console.log('\n========================================');
    console.log('📤 API REQUEST (FormData)');
    console.log('========================================');
    console.log('Method: POST');
    console.log('URL:', url);
    console.log('Headers:', {
      ...headersObj,
      Authorization: headersObj?.Authorization ? 'Bearer ***' : undefined,
    });
    console.log('Body: [FormData - file upload]');
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================\n');

    const startTime = Date.now();

    try {
      const response = await fetch(url, config);
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      console.warn('\n========================================');
      console.warn('📥 API RESPONSE');
      console.warn('========================================');
      console.warn('Method: POST');
      console.warn('URL:', url);
      console.warn('Status:', response.status, response.statusText);
      console.warn('Response Time:', `${responseTime}ms`);
      console.warn('Response Data:', JSON.stringify(data, null, 2));
      console.warn('Timestamp:', new Date().toISOString());
      console.warn('========================================\n');
      
      // Also log to console.log for DevTools
      console.log('\n========================================');
      console.log('📥 API RESPONSE');
      console.log('========================================');
      console.log('Method: POST');
      console.log('URL:', url);
      console.log('Status:', response.status, response.statusText);
      console.log('Response Time:', `${responseTime}ms`);
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      console.log('========================================\n');

      if (!response.ok) {
        console.error('\n========================================');
        console.error('❌ API ERROR RESPONSE');
        console.error('========================================');
        console.error('Method: POST');
        console.error('URL:', url);
        console.error('Status:', response.status);
        console.error('Error:', data.message || `HTTP error! status: ${response.status}`);
        console.error('Response Data:', JSON.stringify(data, null, 2));
        console.error('========================================\n');
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('\n========================================');
      console.error('❌ API REQUEST FAILED');
      console.error('========================================');
      console.error('Method: POST');
      console.error('URL:', url);
      console.error('Response Time:', `${responseTime}ms`);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.stack) {
        console.error('Stack:', error.stack);
      }
      console.error('Timestamp:', new Date().toISOString());
      console.error('========================================\n');
      throw error;
    }
  }

  async getCustomerProfile(): Promise<ApiResponse<Customer>> {
    return this.request<Customer>('/customers/me');
  }

  async updateCustomerPreferences(preferences: any): Promise<ApiResponse<Customer>> {
    return this.request<Customer>('/customers/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
  }

  async updateNotificationSettings(settings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  }): Promise<ApiResponse<Customer>> {
    return this.request<Customer>('/customers/notifications', {
      method: 'PUT',
      body: JSON.stringify({ notificationSettings: settings }),
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

  // Notification methods
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    category?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async getUnreadNotificationCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    // Token will be auto-loaded by request() method if missing
    return this.request<{ unreadCount: number }>(`/notifications/unread-count`, {
      method: 'GET',
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse> {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Booking methods
  async getMyBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    userType?: 'customer' | 'provider';
  }): Promise<ApiResponse<any>> {
    const { userType = 'customer', ...restParams } = params || {};

    const queryString = new URLSearchParams(
      Object.entries(restParams).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request(`/bookings?userType=${userType}${queryString ? `&${queryString}` : ''}`);
  }

  async getBookingById(bookingId: string): Promise<ApiResponse<any>> {
    return this.request(`/bookings/${bookingId}`);
  }

  async getProviderProfile(): Promise<ApiResponse<any>> {
    return this.request('/providers/profile');
  }

  async updateProviderProfile(payload: any): Promise<ApiResponse<any>> {
    return this.request('/providers/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async addProviderPortfolioImage(url: string): Promise<ApiResponse<any>> {
    return this.request('/providers/portfolio', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async removeProviderPortfolioImage(imageUrl: string): Promise<ApiResponse<any>> {
    return this.request('/providers/portfolio', {
      method: 'DELETE',
      body: JSON.stringify({ url: imageUrl }),
    });
  }

  async uploadProviderDocument(providerId: string, formData: FormData): Promise<ApiResponse<any>> {
    await this.loadToken();
    const url = `${this.baseURL}/providers/${providerId}/documents`;
    
    const config: RequestInit = {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: formData,
    };

    const startTime = Date.now();
    try {
      const response = await fetch(url, config);
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      console.log('📥 Upload document response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        data,
      });

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Upload document error:', error);
      throw error;
    }
  }

  async deleteProviderDocument(providerId: string, documentId: string): Promise<ApiResponse> {
    return this.request(`/providers/${providerId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async getProviderFeatureLimits(providerId: string): Promise<ApiResponse<any>> {
    return this.request(`/providers/${providerId}/feature-limits`);
  }

  async uploadProviderVideo(providerId: string, videoData: {
    videoUrl: string;
    videoThumbnail?: string;
    videoDuration: number;
  }): Promise<ApiResponse<any>> {
    return this.request(`/providers/${providerId}/video`, {
      method: 'POST',
      body: JSON.stringify(videoData),
    });
  }

  async deleteProviderVideo(providerId: string): Promise<ApiResponse> {
    return this.request(`/providers/${providerId}/video`, {
      method: 'DELETE',
    });
  }

  async getProviderSettings(): Promise<ApiResponse<any>> {
    return this.request('/providers/settings');
  }

  async updateProviderSettings(payload: any): Promise<ApiResponse<any>> {
    return this.request('/providers/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateProviderNotificationSettings(settings: Record<string, boolean>): Promise<ApiResponse<any>> {
    return this.request('/providers/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateProviderPrivacySettings(settings: Record<string, boolean>): Promise<ApiResponse<any>> {
    return this.request('/providers/settings/privacy', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getProviderSubscription(): Promise<ApiResponse<any>> {
    return this.request('/subscriptions/my-subscription');
  }

  async getProviderSubscriptionHistory(): Promise<ApiResponse<any>> {
    return this.request('/subscriptions/history');
  }

  async getSubscriptionPlans(): Promise<ApiResponse<any>> {
    return this.request('/subscription-plans/plans');
  }

  async initializeProviderSubscription(planId: string, options?: { callbackUrl?: string }): Promise<ApiResponse<any>> {
    return this.request('/subscriptions/initialize-payment', {
      method: 'POST',
      body: JSON.stringify({ planId, callbackUrl: options?.callbackUrl }),
    });
  }

  async cancelProviderSubscription(subscriptionId?: string): Promise<ApiResponse<any>> {
    return this.request('/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ subscriptionId }),
    });
  }

  async reactivateProviderSubscription(subscriptionId: string): Promise<ApiResponse<any>> {
    return this.request('/subscriptions/reactivate', {
      method: 'POST',
      body: JSON.stringify({ subscriptionId }),
    });
  }

  // Referral methods
  async generateReferralCode(providerId?: string): Promise<ApiResponse<any>> {
    if (providerId) {
      return this.request(`/referrals/generate/${providerId}`, {
        method: 'POST',
      });
    }
    return this.request('/referrals/generate', {
      method: 'POST',
    });
  }

  async getReferralStats(providerId?: string): Promise<ApiResponse<any>> {
    if (providerId) {
      return this.request(`/referrals/stats/${providerId}`);
    }
    return this.request('/referrals/stats');
  }

  async getReferralHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return this.request(`/referrals/history${queryString ? `?${queryString}` : ''}`);
  }

  async validateReferralCode(code: string): Promise<ApiResponse<any>> {
    return this.request(`/referrals/validate/${code}`);
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<ApiResponse> {
    return this.request(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<ApiResponse> {
    return this.request(`/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async createBooking(payload: {
    providerId: string;
    serviceId?: string;
    scheduledAt: string;
    locationAddress: string;
    locationCity?: string;
    locationState?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Messaging methods
  async sendMessage(recipientId: string, content: string, bookingId?: string): Promise<ApiResponse> {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content, bookingId }),
    });
  }

  async getMessages(recipientId: string, page = 1, limit = 50): Promise<ApiResponse> {
    return this.request(`/messages?recipientId=${recipientId}&page=${page}&limit=${limit}`);
  }

  // Review methods
  async submitReview(bookingId: string, rating: number, comment?: string): Promise<ApiResponse> {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify({ bookingId, rating, comment }),
    });
  }

  // Firebase/Google Authentication
  // This endpoint accepts both Firebase ID tokens and Google ID tokens
  // Firebase Admin SDK can verify both types of tokens
  async firebaseAuth(authData: {
    idToken: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    uid?: string;
    phone?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify(authData),
    });
  }

  // Earnings & Wallet APIs
  async getEarningsStats(): Promise<ApiResponse> {
    await this.loadToken();
    return this.request<ApiResponse>('/earnings/stats', { method: 'GET' });
  }

  async getTransactions(params?: {
    type?: string;
    dateRange?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    await this.loadToken();
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.dateRange) queryParams.append('dateRange', params.dateRange);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return this.request<ApiResponse>(`/earnings/transactions${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  }

  async requestWithdrawal(data: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }): Promise<ApiResponse> {
    await this.loadToken();
    return this.request<ApiResponse>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        amount: data.amount,
        withdrawalMethod: 'bank_transfer',
        bankDetails: {
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
        },
      }),
    });
  }

  async getBanks(): Promise<ApiResponse> {
    await this.loadToken();
    return this.request<ApiResponse>('/paystack/banks', { method: 'GET' });
  }

  async verifyAccount(accountNumber: string, bankCode: string): Promise<ApiResponse> {
    await this.loadToken();
    return this.request<ApiResponse>('/paystack/verify-account', {
      method: 'POST',
      body: JSON.stringify({
        accountNumber,
        bankCode,
      }),
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export the class for testing or multiple instances
export default ApiService;

