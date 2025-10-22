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
  setToken(token: string | null) {
    this.token = token;
  }

  // Get authentication headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
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
