import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import ProviderAuthScreen from './ProviderAuthScreen';
import { apiService, LoginData, RegisterData } from '../services/api';
import { googleSignInService } from '../services/googleSignInService';
import { Alert } from 'react-native';

interface AuthNavigatorProps {
  onAuthSuccess: (userData: any) => void;
  onBackToUserTypeSelection: () => void;
  userType: 'user' | 'provider';
}

type AuthScreen = 'login' | 'signup' | 'forgot-password';

interface AuthState {
  currentScreen: AuthScreen;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess, onBackToUserTypeSelection, userType }) => {
  // Log userType when component mounts/updates
  React.useEffect(() => {
    console.log('[AuthNavigator] Component mounted/updated with userType:', userType);
  }, [userType]);

  const [authState, setAuthState] = useState<AuthState>({
    currentScreen: 'login',
  });

  const navigateTo = (screen: AuthScreen) => {
    setAuthState({
      currentScreen: screen,
    });
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('[AuthNavigator] Login attempt:', { email, userType });
      
      if (!userType) {
        throw new Error('User type not set. Please select user or provider first.');
      }
      
      const loginData: LoginData = { email, password };
      
      // Use appropriate login endpoint based on user type
      const isProvider = userType === 'provider';
      console.log('[AuthNavigator] Using', isProvider ? 'provider' : 'user', 'login endpoint');
      
      let response;
      
      if (isProvider) {
        // Try provider login first
        try {
          response = await apiService.loginProvider(loginData);
        } catch (providerError: any) {
          // If provider login fails with "Invalid credentials", try regular login as fallback
          // This handles the case where user selected "provider" but account is actually a regular user
          if (providerError.message?.includes('Invalid credentials')) {
            console.log('[AuthNavigator] Provider login failed, trying regular login as fallback...');
            try {
              response = await apiService.login(loginData);
              // If regular login succeeds, check the role
              if (response.success && response.data) {
                const userRole = response.data.user?.role;
                if (userRole === 'customer') {
                  // Account is a regular user, but they selected provider
                  // Allow login but inform them
                  console.log('[AuthNavigator] Regular user account logged in via provider selection');
                }
              }
            } catch (regularError: any) {
              // Both failed, throw the original provider error
              console.error('[AuthNavigator] Regular login also failed:', regularError.message);
              throw providerError;
            }
          } else {
            // Other errors, re-throw
            throw providerError;
          }
        }
      } else {
        response = await apiService.login(loginData);
      }
      
      console.log('[AuthNavigator] Login response:', { 
        success: response.success, 
        hasData: !!response.data,
        userRole: response.data?.user?.role,
      });
      
      if (response.success && response.data) {
        // Verify the user role matches the selected userType
        const userRole = response.data.user?.role;
        if (isProvider && userRole !== 'provider') {
          // User selected provider but account is regular user - allow login but warn
          console.warn('[AuthNavigator] User selected provider but account role is:', userRole, '. Allowing login.');
          // Don't throw error, just proceed with login
        }
        if (!isProvider && userRole === 'provider') {
          throw new Error('This is a provider account. Please use the provider login.');
        }
        
        // Store token for future API calls
        apiService.setToken(response.data.token);
        
        // Skip OTP verification and go directly to success
        onAuthSuccess(response.data);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('[AuthNavigator] Login error:', error);
      throw error;
    }
  };

  const handleSignUp = async (userData: any) => {
    try {
      console.log('Signup attempt:', { userData, userType });
      
      const registerData: RegisterData = {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone || undefined,
        password: userData.password,
      };
      
      // Use appropriate registration endpoint based on user type
      // Note: If provider registration endpoint exists, use it here
      // For now, both use the same endpoint but backend should handle role based on endpoint
      const response = userType === 'provider'
        ? await apiService.registerProvider(registerData)
        : await apiService.register(registerData);
      
      if (response.success && response.data) {
        // Store token for future API calls
        apiService.setToken(response.data.token);
        
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
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      throw error;
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Sign in with Google
      const googleUserData = await googleSignInService.completeSignIn();
      
      if (googleUserData) {
        // Authenticate with backend
        const authData = await googleSignInService.authenticateWithBackend(googleUserData);
        
        if (authData) {
          onAuthSuccess(authData);
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert(
        'Google Sign-In Failed',
        error?.message || 'Failed to sign in with Google. Please try again or use email sign-in.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };


  const renderCurrentScreen = () => {
    // If userType is provider, show ProviderAuthScreen for login
    if (userType === 'provider' && authState.currentScreen === 'login') {
      return (
        <ProviderAuthScreen
          onLogin={handleLogin}
          onBack={onBackToUserTypeSelection}
          onJoinProvider={() => navigateTo('signup')}
          onForgotPassword={() => navigateTo('forgot-password')}
        />
      );
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
        // Default to provider auth screen if userType is provider, otherwise regular login
        if (userType === 'provider') {
          return (
            <ProviderAuthScreen
              onLogin={handleLogin}
              onBack={onBackToUserTypeSelection}
              onJoinProvider={() => navigateTo('signup')}
              onForgotPassword={() => navigateTo('forgot-password')}
            />
          );
        }
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
