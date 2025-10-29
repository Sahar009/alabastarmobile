// API Configuration
const API_BASE_URL = 'http://localhost:8000/api'; // Update this to your backend URL

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
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
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

  async uploadProfilePicture(formData: FormData): Promise<ApiResponse<{ url: string }>> {
    const url = `${this.baseURL}/auth/profile/picture`;
    
    const config: RequestInit = {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Profile picture upload failed:', error);
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
  }): Promise<ApiResponse<any>> {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return this.request(`/bookings?userType=customer${queryString ? `&${queryString}` : ''}`);
  }

  async getBookingById(bookingId: string): Promise<ApiResponse<any>> {
    return this.request(`/bookings/${bookingId}`);
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
}

// Export singleton instance
export const apiService = new ApiService();

// Export the class for testing or multiple instances
export default ApiService;

