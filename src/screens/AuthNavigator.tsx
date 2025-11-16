import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import ProviderAuthScreen from './ProviderAuthScreen';
import ProviderRegistrationScreen from './ProviderRegistrationScreen';
import { apiService, LoginData, RegisterData } from '../services/api';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../config/googleSignIn';

interface AuthNavigatorProps {
  onAuthSuccess: (userData: any) => void;
  onSwitchToCustomerAuth: () => void;
  onSwitchToProviderAuth: () => void;
  userType: 'user' | 'provider';
}

type AuthScreen = 'login' | 'signup' | 'forgot-password';

type ProviderStage = 'login' | 'register';

interface AuthState {
  currentScreen: AuthScreen;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({
  onAuthSuccess,
  onSwitchToCustomerAuth,
  onSwitchToProviderAuth,
  userType,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    currentScreen: 'login',
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [providerStage, setProviderStage] = useState<ProviderStage>('login');

  useEffect(() => {
    setProviderStage('login');
  }, [userType]);

  useEffect(() => {
    // Configure Google Sign-In only if we have the necessary credentials for the current platform
    const webClientId = String(GOOGLE_WEB_CLIENT_ID || '').trim();
    const iosClientId = String(GOOGLE_IOS_CLIENT_ID || '').trim();
    const hasWebClientId = webClientId.length > 0;
    const hasIosClientId = iosClientId.length > 0;
    
    // Platform-specific requirements:
    // - iOS: Needs either iosClientId OR webClientId (webClientId works as fallback)
    // - Android: Needs webClientId
    const canConfigure = Platform.OS === 'ios' 
      ? (hasIosClientId || hasWebClientId) // iOS can work with either
      : hasWebClientId; // Android needs webClientId
    
    if (!canConfigure) {
      console.warn(`Google Sign-In not configured for ${Platform.OS}: Missing required client IDs. Add to src/config/googleSignIn.ts`);
      return;
    }
    
    // Build config object conditionally
    const config: any = {};
    
    // For iOS: The library requires iosClientId OR GoogleService-Info.plist
    // If iosClientId is not provided, use webClientId as fallback
    if (Platform.OS === 'ios') {
      if (hasIosClientId) {
        config.iosClientId = iosClientId;
      } else if (hasWebClientId) {
        // Use webClientId as iosClientId on iOS (works if they're from the same project)
        config.iosClientId = webClientId;
      }
      // Always provide webClientId for iOS (required for ID token)
      if (hasWebClientId) {
        config.webClientId = webClientId;
      }
    } else {
      // Android: Only needs webClientId
      if (hasWebClientId) {
        config.webClientId = webClientId;
      }
    }
    
    // Enable offline access if webClientId is configured
    if (hasWebClientId) {
      config.offlineAccess = true;
      config.forceCodeForRefreshToken = true;
    }
    
    // Only configure if we have at least one client ID
    if (Object.keys(config).length > 0) {
      try {
        GoogleSignin.configure(config);
        console.log('Google Sign-In configured successfully');
      } catch (error: any) {
        // Suppress configuration errors - Google Sign-In just won't work until properly configured
        console.warn('Google Sign-In configuration warning:', error?.message || error);
        // On iOS, if configuration fails, it's usually because:
        // 1. iosClientId is missing (we're using webClientId as fallback)
        // 2. GoogleService-Info.plist is missing
        // This is expected if not fully configured - don't break the app
      }
    }
  }, []);

  const navigateTo = (screen: AuthScreen) => {
    setAuthState({
      currentScreen: screen,
    });
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('Login attempt:', { email, userType });
      
      const loginData: LoginData = { email, password };
      
      // Use appropriate login endpoint based on user type
      const response = userType === 'provider' 
        ? await apiService.loginProvider(loginData)
        : await apiService.login(loginData);
      
      if (response.success && response.data) {
        // Store token and user data in AsyncStorage for future API calls
        await apiService.setToken(response.data.token);
        await apiService.setUser(response.data.user);
        
        // Skip OTP verification and go directly to success
        onAuthSuccess(response.data);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleSignUp = async (userData: any) => {
    try {
      console.log('Signup attempt:', userData);
      
      const registerData: RegisterData = {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone || undefined,
        password: userData.password,
      };
      
      const response = await apiService.register(registerData);
      
      if (response.success && response.data) {
        // Store token and user data in AsyncStorage for future API calls
        await apiService.setToken(response.data.token);
        await apiService.setUser(response.data.user);
        
        // Skip OTP verification and go directly to success
        onAuthSuccess(response.data);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const handleSendResetEmail = async (email: string) => {
    try {
      // TODO: Implement actual password reset logic
      console.log('Password reset request:', email);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
    } catch (error) {
      throw error;
    }
  };

  const handleProviderJoin = () => {
    setProviderStage('register');
  };

  const handleProviderOnboardingComplete = () => {
    Alert.alert(
      'Registration Submitted',
      'Your provider registration has been submitted successfully. We will notify you once it has been reviewed.'
    );
    setProviderStage('login');
  };

  const handleProviderOnboardingCancelled = () => {
    setProviderStage('login');
  };

  const handleGoogleSignIn = async () => {
    // Check if Google Sign-In is configured
    const webClientId = String(GOOGLE_WEB_CLIENT_ID || '').trim();
    const iosClientId = String(GOOGLE_IOS_CLIENT_ID || '').trim();
    const hasWebClientId = webClientId.length > 0;
    const hasIosClientId = iosClientId.length > 0;
    
    // Platform-specific requirements
    const isConfigured = Platform.OS === 'ios' 
      ? (hasIosClientId || hasWebClientId)
      : hasWebClientId;
    
    if (!isConfigured) {
      Alert.alert(
        'Google Sign-In Not Configured',
        Platform.OS === 'ios'
          ? 'For iOS, you need to add GOOGLE_WEB_CLIENT_ID or GOOGLE_IOS_CLIENT_ID to src/config/googleSignIn.ts'
          : 'Add your Google web client ID to src/config/googleSignIn.ts before enabling Google authentication.'
      );
      return;
    }

    setIsGoogleLoading(true);
    try {
      // Only check Play Services on Android
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      
      const result = await GoogleSignin.signIn();
      
      // The response structure from @react-native-google-signin/google-signin
      // Response has: { data: { idToken, user: { email, name, photo, id } } }
      const responseData = (result as any).data || result;
      const idToken = responseData.idToken;
      const user = responseData.user || {};
      const email = user.email;
      const displayName = user.name;
      const photoURL = user.photo;
      const uid = user.id;

      if (!idToken) {
        throw new Error('Google did not return a valid ID token.');
      }

      if (!email) {
        throw new Error('No email address is associated with the selected Google account.');
      }

      // Use Firebase endpoint - it can verify Google ID tokens via Firebase Admin SDK
      const firebaseResponse = await apiService.firebaseAuth({
        idToken,
        email,
        displayName,
        photoURL,
        uid,
      });

      if (firebaseResponse.success && firebaseResponse.data) {
        await apiService.setToken(firebaseResponse.data.token);
        await apiService.setUser(firebaseResponse.data.user);
        onAuthSuccess(firebaseResponse.data);
      } else {
        throw new Error(firebaseResponse.message || 'Unable to complete Google sign-in.');
      }
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      if (error?.code === statusCodes.IN_PROGRESS) {
        return;
      }

      if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services Required',
          'Please install or update Google Play Services and try again.'
        );
        return;
      }

      console.error('Google sign-in error:', error);
      Alert.alert('Google Sign-In Error', error?.message || 'Unable to sign in with Google. Please try again later.');
    } finally {
      setIsGoogleLoading(false);
    }
  };


  const renderCurrentScreen = () => {
    if (userType === 'provider') {
      if (providerStage === 'register') {
        return (
          <ProviderRegistrationScreen
            onCancel={handleProviderOnboardingCancelled}
            onComplete={handleProviderOnboardingComplete}
          />
        );
      }

      switch (authState.currentScreen) {
        case 'login':
          return (
            <ProviderAuthScreen
              onLogin={handleLogin}
              onBack={onSwitchToCustomerAuth}
              onJoinProvider={handleProviderJoin}
              onForgotPassword={() => navigateTo('forgot-password')}
            />
          );

        case 'forgot-password':
          return (
            <ForgotPasswordScreen
              onSendResetEmail={handleSendResetEmail}
              onBackToLogin={() => navigateTo('login')}
            />
          );

        case 'signup':
        default:
          return (
            <ProviderAuthScreen
              onLogin={handleLogin}
              onBack={onSwitchToCustomerAuth}
              onJoinProvider={handleProviderJoin}
              onForgotPassword={() => navigateTo('forgot-password')}
            />
          );
      }
    }

    switch (authState.currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onSignUp={() => navigateTo('signup')}
            onForgotPassword={() => navigateTo('forgot-password')}
            onGoogleSignIn={handleGoogleSignIn}
            onSwitchToProvider={onSwitchToProviderAuth}
            isGoogleLoading={isGoogleLoading}
          />
        );
      
      case 'signup':
        return (
          <SignUpScreen
            onSignUp={handleSignUp}
            onLogin={() => navigateTo('login')}
            onGoogleSignUp={handleGoogleSignIn}
            onSwitchToProvider={onSwitchToProviderAuth}
            isGoogleLoading={isGoogleLoading}
          />
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onSendResetEmail={handleSendResetEmail}
            onBackToLogin={() => navigateTo('login')}
          />
        );
      
      default:
        return (
          <LoginScreen
            onLogin={handleLogin}
            onSignUp={() => navigateTo('signup')}
            onForgotPassword={() => navigateTo('forgot-password')}
            onGoogleSignIn={handleGoogleSignIn}
            onSwitchToProvider={onSwitchToProviderAuth}
            isGoogleLoading={isGoogleLoading}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AuthNavigator;
