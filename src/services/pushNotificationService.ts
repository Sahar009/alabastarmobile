import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
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

class PushNotificationService {
  private authToken: string | null = null;
  private fcmToken: string | null = null;
  private tokenRegistered: boolean = false;

  /**
   * Initialize push notification service
   */
  async initialize(authToken?: string | null): Promise<void> {
    try {
      console.log('[PushNotificationService] 🚀 Initializing push notification service...');
      
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
        return;
      }

      // Get FCM token
      await this.getFCMToken();

      // Setup notification handlers
      this.setupNotificationHandlers();

      console.log('[PushNotificationService] ✅ Initialization complete');
    } catch (error) {
      console.error('[PushNotificationService] ❌ Initialization error:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
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
      // Check if we already have a token
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (storedToken) {
        this.fcmToken = storedToken;
        console.log('[PushNotificationService] 📱 Using stored FCM token');
      } else {
        // Request new token
        const token = await messaging().getToken();
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
      messaging().onTokenRefresh(async (newToken) => {
        console.log('[PushNotificationService] 🔄 FCM token refreshed');
        this.fcmToken = newToken;
        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
        
        if (this.authToken) {
          await this.registerTokenWithBackend(newToken);
        }
      });

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

      const deviceData: DeviceTokenData = {
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: await DeviceInfo.getUniqueId(),
        deviceName: await DeviceInfo.getDeviceName(),
        appVersion: DeviceInfo.getVersion(),
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
  setupNotificationHandlers(): void {
    // Handle foreground notifications
    messaging().onMessage(async (remoteMessage) => {
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
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[PushNotificationService] 🔔 Notification opened app:', remoteMessage);
      
      // Handle navigation based on notification data
      if (remoteMessage.data) {
        this.handleNotificationNavigation(remoteMessage.data);
      }
    });

    // Check if app was opened from a quit state via notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
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

