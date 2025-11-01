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
  onBackToUserTypeSelection: () => void;
  userType: 'user' | 'provider';
}

type AuthScreen = 'login' | 'signup' | 'forgot-password';

type ProviderStage = 'login' | 'register';

interface AuthState {
  currentScreen: AuthScreen;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess, onBackToUserTypeSelection, userType }) => {
  const [authState, setAuthState] = useState<AuthState>({
    currentScreen: 'login',
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [providerStage, setProviderStage] = useState<ProviderStage>('login');

  useEffect(() => {
    setProviderStage('login');
  }, [userType]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
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
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        'Google Sign-In Not Configured',
        'Add your Google web client ID to src/config/googleSignIn.ts before enabling Google authentication.'
      );
      return;
    }

    if (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID) {
      console.warn('Google Sign-In: iosClientId not configured. Using webClientId fallback.');
    }

    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.idToken) {
        throw new Error('Google did not return a valid ID token.');
      }

      const email = userInfo.user?.email;
      if (!email) {
        throw new Error('No email address is associated with the selected Google account.');
      }

      const firebaseResponse = await apiService.firebaseAuth({
        idToken: userInfo.idToken,
        email,
        displayName: userInfo.user?.name || undefined,
        photoURL: userInfo.user?.photo || undefined,
        uid: userInfo.user?.id || '',
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
              onBack={onBackToUserTypeSelection}
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
              onBack={onBackToUserTypeSelection}
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
            onBackToUserTypeSelection={onBackToUserTypeSelection}
            onGoogleSignIn={handleGoogleSignIn}
            isGoogleLoading={isGoogleLoading}
          />
        );
      
      case 'signup':
        return (
          <SignUpScreen
            onSignUp={handleSignUp}
            onLogin={() => navigateTo('login')}
            onBackToUserTypeSelection={onBackToUserTypeSelection}
            onGoogleSignUp={handleGoogleSignIn}
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
            onBackToUserTypeSelection={onBackToUserTypeSelection}
            onGoogleSignIn={handleGoogleSignIn}
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
