import { apiService } from './api';
import { Alert, Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config/googleSignIn';

interface GoogleUserData {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

/**
 * Google Sign-In Service
 * 
 * This service handles Google authentication for the mobile app using
 * @react-native-google-signin/google-signin package
 */
class GoogleSignInService {
  private isConfigured = false;

  constructor() {
    this.configure();
  }

  /**
   * Configure Google Sign-In
   */
  configure() {
    try {
      if (!GOOGLE_WEB_CLIENT_ID) {
        console.warn('Google Sign-In: WEB_CLIENT_ID is not configured');
        return;
      }

      // iOS requires iosClientId explicitly set
      // We'll use webClientId for iOS if no iosClientId is provided
      const iosClientId = GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;

      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID, // From Google Cloud Console - required for both iOS and Android
        iosClientId: iosClientId, // iOS client ID - required for iOS, can use webClientId if no separate iOS client
        offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
        forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`
      });

      this.isConfigured = true;
      console.log('Google Sign-In configured successfully');
    } catch (error) {
      console.error('Google Sign-In configuration error:', error);
    }
  }

  /**
   * Check if Google Sign-In is configured
   */
  isAvailable(): boolean {
    return this.isConfigured && Boolean(GOOGLE_WEB_CLIENT_ID);
  }

  /**
   * Check if user is already signed in
   */
  async isSignedIn(): Promise<boolean> {
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      return false;
    }
  }

  /**
   * Get current user (if signed in)
   */
  async getCurrentUser() {
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Sign in with Google
   */
  async signIn(): Promise<GoogleUserData | null> {
    try {
      if (!this.isAvailable()) {
        Alert.alert(
          'Google Sign-In Not Configured',
          'Google Sign-In is not available. Please contact support or sign in with email.'
        );
        return null;
      }

      // Check Play Services (Android only, iOS will skip this)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Sign in
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo || !userInfo.data || !userInfo.data.user) {
        throw new Error('Failed to get user information from Google');
      }

      const user = userInfo.data.user;
      
      // Convert to our format
      const googleUserData: GoogleUserData = {
        email: user.email || '',
        name: user.name || (user.givenName ? `${user.givenName} ${user.familyName || ''}`.trim() : 'User'),
        picture: user.photo || undefined,
        googleId: user.id || '',
      };

      return googleUserData;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        console.log('User cancelled Google Sign-In');
        return null;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g. sign in) is in progress already
        Alert.alert('Google Sign-In', 'Sign-in is already in progress. Please wait.');
        return null;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        Alert.alert(
          'Google Play Services Required',
          'Google Play Services is not available or outdated. Please update and try again.'
        );
        return null;
      } else {
        // Some other error
        Alert.alert(
          'Google Sign-In Failed',
          error?.message || 'Failed to sign in with Google. Please try again.'
        );
        return null;
      }
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      throw error;
    }
  }

  /**
   * Revoke access
   */
  async revokeAccess(): Promise<void> {
    try {
      await GoogleSignin.revokeAccess();
    } catch (error) {
      console.error('Google Revoke Access error:', error);
      throw error;
    }
  }

  /**
   * Authenticate with backend using Google user data
   */
  async authenticateWithBackend(googleUserData: GoogleUserData) {
    try {
      const response = await apiService.googleAuth(googleUserData);
      
      if (response.success && response.data) {
        // Store token and user data
        apiService.setToken(response.data.token);
        if (response.data.user) {
          await apiService.setUser(response.data.user);
        }
        return response.data;
      } else {
        throw new Error(response.message || 'Google authentication failed');
      }
    } catch (error: any) {
      console.error('Backend Google auth error:', error);
      throw error;
    }
  }

  /**
   * Complete Google Sign-In flow
   * Signs in with Google and authenticates with backend
   */
  async completeSignIn(): Promise<GoogleUserData | null> {
    const googleUserData = await this.signIn();
    return googleUserData;
  }
}

export const googleSignInService = new GoogleSignInService();
export default googleSignInService;
