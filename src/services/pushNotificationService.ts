import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

// Storage keys
const FCM_TOKEN_KEY = '@fcm_token';
const NOTIFICATION_PERMISSION_KEY = '@notification_permission';

interface DeviceTokenData {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  deviceName: string;
  appVersion: string;
  osVersion: string;
}

// Lazy load Firebase messaging to avoid NativeEventEmitter error
let messaging: any = null;
let messagingLoaded = false;

// Lazy load DeviceInfo to avoid native module error
let DeviceInfo: any = null;
let deviceInfoLoaded = false;

async function loadMessagingModule(): Promise<any> {
  if (messagingLoaded && messaging) {
    return messaging;
  }
  
  try {
    // Wait a bit for native modules to be ready
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    
    // Dynamically import messaging module
    const messagingModule = require('@react-native-firebase/messaging');
    messaging = messagingModule.default || messagingModule;
    messagingLoaded = true;
    console.log('[PushNotificationService] ✅ Firebase messaging module loaded');
    return messaging;
  } catch (error: any) {
    console.error('[PushNotificationService] ❌ Failed to load messaging module:', error?.message || error);
    // Return null instead of throwing to allow graceful degradation
    messagingLoaded = true; // Mark as loaded to prevent retry loops
    return null;
  }
}

async function loadDeviceInfoModule(): Promise<any> {
  if (deviceInfoLoaded && DeviceInfo) {
    return DeviceInfo;
  }
  
  try {
    // Wait a bit for native modules to be ready
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    
    // Dynamically import DeviceInfo module
    const deviceInfoModule = require('react-native-device-info');
    DeviceInfo = deviceInfoModule.default || deviceInfoModule;
    deviceInfoLoaded = true;
    console.log('[PushNotificationService] ✅ DeviceInfo module loaded');
    return DeviceInfo;
  } catch (error) {
    console.error('[PushNotificationService] ❌ Failed to load DeviceInfo module:', error);
    // Return a fallback object with default methods to prevent crashes
    return {
      getUniqueId: async () => 'unknown-device-id',
      getDeviceName: async () => 'Unknown Device',
      getVersion: () => '1.0.0',
    };
  }
}

class PushNotificationService {
  private authToken: string | null = null;
  private fcmToken: string | null = null;
  private tokenRegistered: boolean = false;
  private isInitialized: boolean = false;

  /**
   * Safely get messaging instance
   */
  private async getMessagingInstance(): Promise<any | null> {
    try {
      const messagingModule = await loadMessagingModule();
      if (!messagingModule) {
        console.warn('[PushNotificationService] ⚠️ Messaging module not available');
        return null;
      }
      if (typeof messagingModule === 'function') {
        const instance = messagingModule();
        if (instance) {
          return instance;
        }
      }
      // If it's already an instance, return it
      if (messagingModule && typeof messagingModule.getToken === 'function') {
        return messagingModule;
      }
    } catch (error: any) {
      console.warn('[PushNotificationService] ⚠️ Failed to get messaging instance:', error?.message || error);
    }
    return null;
  }

  /**
   * Wait for Firebase native module to be ready
   * Returns true if ready, false if not available (non-blocking)
   */
  private async waitForFirebaseReady(): Promise<boolean> {
    const maxRetries = 10;
    const retryDelay = 500;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const messagingInstance = await this.getMessagingInstance();
        if (messagingInstance) {
          console.log('[PushNotificationService] ✅ Firebase messaging module is ready');
          return true;
        }
      } catch {
        console.log(`[PushNotificationService] ⏳ Waiting for Firebase to be ready (attempt ${i + 1}/${maxRetries})...`);
      }
      
      await new Promise<void>(resolve => setTimeout(resolve, retryDelay));
    }
    
    console.warn('[PushNotificationService] ⚠️ Firebase messaging module not available after waiting. Push notifications will be disabled.');
    return false;
  }

  /**
   * Initialize push notification service
   */
  async initialize(authToken?: string | null): Promise<void> {
    if (this.isInitialized) {
      console.log('[PushNotificationService] Already initialized, skipping...');
      return;
    }

    try {
      console.log('[PushNotificationService] 🚀 Initializing push notification service...');
      
      // Wait for Firebase to be ready (non-blocking)
      const firebaseReady = await this.waitForFirebaseReady();
      
      if (!firebaseReady) {
        console.warn('[PushNotificationService] ⚠️ Firebase not available. Push notifications disabled.');
        this.isInitialized = true; // Mark as initialized to prevent retry loops
        return;
      }
      
      // Store auth token if provided
      if (authToken) {
        this.authToken = authToken;
      } else {
        // Try to load from AsyncStorage
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          this.authToken = storedToken;
        }
      }

      // Request notification permissions
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        console.warn('[PushNotificationService] ⚠️ Notification permission not granted');
        this.isInitialized = true;
        return;
      }

      // Get FCM token
      await this.getFCMToken();

      // Setup notification handlers
      await this.setupNotificationHandlers();

      this.isInitialized = true;
      console.log('[PushNotificationService] ✅ Initialization complete');
    } catch (error: any) {
      console.error('[PushNotificationService] ❌ Initialization error:', error?.message || error);
      // Don't throw - allow app to continue without push notifications
      console.warn('[PushNotificationService] ⚠️ Continuing without push notifications');
      this.isInitialized = true; // Mark as initialized to prevent retry loops
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const messagingModule = await loadMessagingModule();
        const messagingInstance = await this.getMessagingInstance();
        if (!messagingInstance || !messagingModule) {
          console.warn('[PushNotificationService] ⚠️ Firebase messaging instance not available');
          return false;
        }
        
        const authStatus = await messagingInstance.requestPermission();
        const enabled =
          authStatus === messagingModule.AuthorizationStatus.AUTHORIZED ||
          authStatus === messagingModule.AuthorizationStatus.PROVISIONAL;
        
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, enabled.toString());
        
        if (enabled) {
          console.log('[PushNotificationService] ✅ iOS notification permission granted');
        } else {
          console.warn('[PushNotificationService] ⚠️ iOS notification permission denied');
        }
        
        return enabled;
      } else if (Platform.OS === 'android') {
        // Android 13+ (API level 33+) requires runtime permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'Alabastar needs permission to send you notifications',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          const enabled = granted === PermissionsAndroid.RESULTS.GRANTED;
          await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, enabled.toString());
          
          if (enabled) {
            console.log('[PushNotificationService] ✅ Android notification permission granted');
          } else {
            console.warn('[PushNotificationService] ⚠️ Android notification permission denied');
          }
          
          return enabled;
        } else {
          // Android 12 and below - notifications are enabled by default
          console.log('[PushNotificationService] ✅ Android notification permission (pre-API 33)');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[PushNotificationService] ❌ Permission request error:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const messagingInstance = await this.getMessagingInstance();
      if (!messagingInstance) {
        console.warn('[PushNotificationService] ⚠️ Firebase messaging instance not available');
        return null;
      }

      // Check if we already have a token
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (storedToken) {
        this.fcmToken = storedToken;
        console.log('[PushNotificationService] 📱 Using stored FCM token');
      } else {
        // Request new token
        const token = await messagingInstance.getToken();
        if (token) {
          this.fcmToken = token;
          await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
          console.log('[PushNotificationService] ✅ FCM token obtained:', token.substring(0, 20) + '...');
        } else {
          console.warn('[PushNotificationService] ⚠️ No FCM token available');
          return null;
        }
      }

      // Register token with backend if authenticated
      if (this.authToken && this.fcmToken && !this.tokenRegistered) {
        await this.registerTokenWithBackend(this.fcmToken);
      }

      // Listen for token refresh
      if (messagingInstance) {
        messagingInstance.onTokenRefresh(async (newToken: string) => {
          console.log('[PushNotificationService] 🔄 FCM token refreshed');
          this.fcmToken = newToken;
          await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
          
          if (this.authToken) {
            await this.registerTokenWithBackend(newToken);
          }
        });
      }

      return this.fcmToken;
    } catch (error) {
      console.error('[PushNotificationService] ❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      if (!this.authToken) {
        console.warn('[PushNotificationService] ⚠️ Cannot register token: No auth token');
        return;
      }

      // Load DeviceInfo module
      const DeviceInfoModule = await loadDeviceInfoModule();
      
      const deviceData: DeviceTokenData = {
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: await DeviceInfoModule.getUniqueId(),
        deviceName: await DeviceInfoModule.getDeviceName(),
        appVersion: DeviceInfoModule.getVersion(),
        osVersion: `${Platform.OS} ${Platform.Version}`,
      };

      console.log('[PushNotificationService] 📡 Registering device token with backend...');

      const response = await fetch(`${API_BASE_URL}/notifications/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(deviceData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.tokenRegistered = true;
        console.log('[PushNotificationService] ✅ Device token registered successfully');
      } else {
        console.error('[PushNotificationService] ❌ Failed to register token:', data.message);
      }
    } catch (error) {
      console.error('[PushNotificationService] ❌ Error registering token with backend:', error);
    }
  }

  /**
   * Setup notification handlers
   */
  async setupNotificationHandlers(): Promise<void> {
    try {
      const messagingInstance = await this.getMessagingInstance();
      if (!messagingInstance) {
        console.warn('[PushNotificationService] ⚠️ Cannot setup handlers: messaging instance not available');
        return;
      }

    // Handle foreground notifications
    messagingInstance.onMessage(async (remoteMessage: any) => {
      console.log('[PushNotificationService] 📬 Foreground notification received:', remoteMessage);
      
      // Show alert when app is in foreground
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'New Notification',
          remoteMessage.notification.body || '',
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }

      // You can also use a local notification library here for better UX
      // For example: notifee.displayNotification({ ... })
    });

    // Handle notification tap when app is in background/quit state
    messagingInstance.onNotificationOpenedApp((remoteMessage: any) => {
      console.log('[PushNotificationService] 🔔 Notification opened app:', remoteMessage);
      
      // Handle navigation based on notification data
      if (remoteMessage.data) {
        this.handleNotificationNavigation(remoteMessage.data);
      }
    });

    // Check if app was opened from a quit state via notification
    messagingInstance
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('[PushNotificationService] 🔔 App opened from notification:', remoteMessage);
          
          // Handle navigation after a delay to ensure app is ready
          setTimeout(() => {
            if (remoteMessage.data) {
              this.handleNotificationNavigation(remoteMessage.data);
            }
          }, 1000);
        }
      });
    } catch (error) {
      console.error('[PushNotificationService] ❌ Error setting up notification handlers:', error);
    }
  }

  /**
   * Handle navigation based on notification data
   */
  private handleNotificationNavigation(data: any): void {
    // This will be called from App.tsx to handle navigation
    // Store navigation data in AsyncStorage for App.tsx to read
    if (data.type || data.actionUrl || data.bookingId) {
      AsyncStorage.setItem('pendingNotification', JSON.stringify(data));
    }
  }

  /**
   * Update auth token
   */
  async updateAuthToken(token: string | null): Promise<void> {
    this.authToken = token;
    this.tokenRegistered = false; // Reset to allow re-registration

    // If we have an FCM token and new auth token, register it
    if (token && this.fcmToken) {
      await this.registerTokenWithBackend(this.fcmToken);
    }
  }

  /**
   * Unregister device token (when user logs out)
   */
  async unregisterToken(): Promise<void> {
    try {
      // TODO: Call backend endpoint to remove device token
      // For now, just clear local token
      this.fcmToken = null;
      this.tokenRegistered = false;
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      console.log('[PushNotificationService] 🗑️ Device token unregistered');
    } catch (error) {
      console.error('[PushNotificationService] ❌ Error unregistering token:', error);
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }
}

// Export singleton instance
export default new PushNotificationService();

